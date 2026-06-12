from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os
import sys
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

print("🔍 Starting Flask application initialization...", flush=True)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

class HybridRecommenderInference:
    def __init__(self, model_dict, global_df):
        # Ambil matriks dan index dari file .pkl
        self.sim_matrix = model_dict['similarity_matrix']
        self.indices = model_dict['indices']
        # Gunakan df_processed dari Flask agar kita DAPAT movie_id secara otomatis!
        self.df = global_df
        
    def get_hybrid_recommendations(self, title, top_n=10, min_similarity=0.1, genre_filter=False, verbose=False):
        if title not in self.indices:
            return pd.DataFrame()
            
        idx = self.indices[title]
        
        # Ambil skor similarity untuk film ini
        sim_scores = list(enumerate(self.sim_matrix[idx]))
        
        # Filter berdasarkan min_similarity (jangan masukkan film itu sendiri: i != idx)
        sims = [(i, s) for i, s in sim_scores if i != idx and s >= min_similarity]
        
        if not sims:
            return pd.DataFrame() # Return kosong jika tidak ada yang lolos filter
            
        # Urutkan dari skor tertinggi
        sims = sorted(sims, key=lambda x: x[1], reverse=True)
        
        # Ambil index dan skor untuk top N
        top_idx = [i for i, _ in sims[:top_n]]
        top_scores = [round(s, 4) for _, s in sims[:top_n]]
        
        # Ambil detail film dari df_processed
        result = self.df.iloc[top_idx].copy()
        result['Hybrid_Score'] = top_scores
        
        return result.reset_index(drop=True)

# Global variables untuk model & data
df_processed = None
tfidf_vectorizer = None
cosine_sim_matrix = None
hybrid_recommender = None
models_loaded = False

def load_and_process_data():
    global df_processed, tfidf_vectorizer, cosine_sim_matrix, hybrid_recommender, models_loaded
    
    logger.info("=" * 60)
    logger.info("🔄 Loading ML models and data...")
    logger.info("=" * 60)
    
    try:
        model_dir = os.path.join(os.path.dirname(__file__), 'model')
        model_dir = os.path.normpath(model_dir)
        
        if not os.path.exists(model_dir):
            logger.error(f"❌ Model directory not found: {model_dir}")
            return False
        
        # --- 1. Load df_processed.csv ---
        csv_path = os.path.join(model_dir, 'df_processed.csv')
        if not os.path.exists(csv_path):
            logger.error(f"❌ df_processed.csv not found")
            return False
        
        df_processed = pd.read_csv(csv_path, encoding='utf-8')
        column_mapping = {
            'Title': 'title', 'Genre': 'genres', 'Overview': 'overview',
            'Real_Actor': 'actors', 'IMDB Score': 'imdb_rating',
            'Year': 'year', 'Premiere': 'premiere', 'Runtime': 'runtime', 'Language': 'language'
        }
        existing_cols = {k: v for k, v in column_mapping.items() if k in df_processed.columns}
        df_processed.rename(columns=existing_cols, inplace=True)
        
        for col in ['title', 'genres']:
            if col not in df_processed.columns:
                df_processed[col] = ''
        df_processed.fillna('', inplace=True)
        if 'movie_id' not in df_processed.columns:
            df_processed['movie_id'] = range(1, len(df_processed) + 1)
        
        logger.info(f"✅ Loaded {len(df_processed)} movies from CSV")
        
        # --- 2. Load tfidf_vectorizer.pkl ---
        tfidf_path = os.path.join(model_dir, 'tfidf_vectorizer.pkl')
        if not os.path.exists(tfidf_path):
            logger.error(f"❌ tfidf_vectorizer.pkl not found")
            return False
        tfidf_vectorizer = joblib.load(tfidf_path)
        logger.info(f"✅ TF-IDF Vectorizer loaded successfully")
        
        # --- 3. Load cosine_sim_matrix.pkl ---
        cosine_path = os.path.join(model_dir, 'cosine_sim_matrix.pkl')
        if not os.path.exists(cosine_path):
            logger.error(f"❌ cosine_sim_matrix.pkl not found")
            return False
        
        logger.info(f"📥 Loading Cosine Similarity matrix...")
        cosine_sim_matrix = joblib.load(cosine_path)
        logger.info(f"✅ Cosine Similarity matrix loaded! Shape: {cosine_sim_matrix.shape}")
        
        # --- 4. Load hybrid_recommender.pkl (WITH ERROR ISOLATION) ---
        try:
            hybrid_path = os.path.join(model_dir, 'hybrid_recommender.pkl') 
            
            if os.path.exists(hybrid_path):
                logger.info(f"📥 Loading Hybrid Recommender Dictionary...")
                hybrid_dict = joblib.load(hybrid_path)
                
                # Validasi struktur dictionary sebelum instantiate class
                if 'similarity_matrix' in hybrid_dict and 'indices' in hybrid_dict:
                    hybrid_recommender = HybridRecommenderInference(hybrid_dict, df_processed)
                    logger.info(f"✅ Hybrid Recommender successfully loaded and mapped!")
                else:
                    logger.error(f"❌ Hybrid model missing required keys. Available keys: {list(hybrid_dict.keys()) if isinstance(hybrid_dict, dict) else 'Not a dict'}")
                    logger.warning(f"⚠️ Hybrid recommendation will be disabled")
                    hybrid_recommender = None
            else:
                logger.warning(f"⚠️ Hybrid model not found at {hybrid_path}. Hybrid route will be disabled.")
                hybrid_recommender = None
                
        except Exception as e:
            logger.error(f"❌ FAILED to load Hybrid Recommender: {str(e)}")
            logger.warning(f"⚠️ Hybrid recommendation will be disabled, but core models will continue")
            import traceback
            logger.error(traceback.format_exc())
            hybrid_recommender = None
        
        # ✅ SUCCESS LOGIC: Anggap sukses jika core models (cosine) sudah ready
        if cosine_sim_matrix is not None and df_processed is not None:
            logger.info("=" * 60)
            logger.info("✅ Core models (Cosine + TF-IDF) loaded successfully!")
            logger.info(f"📊 Movies count: {len(df_processed)}")
            logger.info(f"🔗 Cosine matrix shape: {cosine_sim_matrix.shape}")
            logger.info(f"🤖 Hybrid recommender: {'READY' if hybrid_recommender is not None else 'DISABLED'}")
            logger.info("=" * 60)
            
            models_loaded = True
            return True
        else:
            logger.error("❌ Critical failure: Core models not loaded")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error loading models: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        models_loaded = False
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint - ALWAYS respond"""
    try:
        health_data = {
            'status': 'ok',
            'service': 'Movie Recommendation ML Service',
            'timestamp': datetime.now().isoformat(),
            'models_loaded': models_loaded,
            'movies_count': len(df_processed) if df_processed is not None else 0,
            'cosine_matrix_ready': cosine_sim_matrix is not None
        }
        
        if models_loaded:
            health_data['status'] = 'healthy'
            return jsonify(health_data), 200
        else:
            health_data['status'] = 'initializing'
            return jsonify(health_data), 503  # Service Unavailable but responding
            
    except Exception as e:
        logger.error(f"Error in health check: {e}")
        return jsonify({
            'status': 'error',
            'service': 'Movie Recommendation ML Service',
            'error': str(e)
        }), 500

@app.route('/recommend/content-based', methods=['POST'])
def recommend_content_based():
    """
    Content-based recommendation endpoint
    Accepts: movie_id OR movie_title
    Returns: Top N similar movies
    """
    try:
        # Parse request JSON
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body must be JSON'}), 400
        
        movie_id = data.get('movie_id')
        movie_title = data.get('movie_title')
        num_recommendations = int(data.get('num_recommendations', 10))
        
        logger.info(f"Recommendation request: id={movie_id}, title={movie_title}, n={num_recommendations}")
        
        # Validasi input
        if not movie_title and not movie_id:
            return jsonify({'error': 'movie_id or movie_title is required'}), 400
        
        # Validasi models sudah loaded
        if df_processed is None or cosine_sim_matrix is None:
            return jsonify({'error': 'ML models not loaded. Please wait for initialization.'}), 503
        
        # Cari index film di dataframe
        movie_idx = None
        
        # Prioritas 1: Cari berdasarkan movie_title (exact match, case-insensitive)
        if movie_title:
            matched_rows = df_processed[df_processed['title'].str.lower() == movie_title.lower().strip()]
            
            if len(matched_rows) > 0:
                movie_idx = matched_rows.index[0]
                logger.info(f"Found by exact title match: '{movie_title}' at index {movie_idx}")
            else:
                # Fallback: Partial match
                matched_rows = df_processed[df_processed['title'].str.contains(movie_title, case=False, na=False)]
                if len(matched_rows) > 0:
                    movie_idx = matched_rows.index[0]
                    logger.info(f"Found by partial title match: '{movie_title}' at index {movie_idx}")
                else:
                    logger.warning(f"⚠️ Movie title not found in text match: '{movie_title}'. Trying ID fallback...")
        
        # Cari berdasarkan movie_id (jika title tidak ditemukan)
        if movie_idx is None and movie_id is not None:
            matched_rows = df_processed[df_processed['movie_id'] == int(movie_id)]
            
            if len(matched_rows) > 0:
                movie_idx = matched_rows.index[0]
                movie_title = matched_rows.iloc[0]['title']
                logger.info(f"Found by movie_id fallback: {movie_id} -> '{movie_title}'")
            else:
                return jsonify({'error': f'Movie ID {movie_id} not found'}), 404
        
        if movie_idx is None:
            return jsonify({'error': f'Movie "{movie_title}" or ID {movie_id} not found in dataset'}), 404

        
        # Hitung similarity scores
        similarity_scores = list(enumerate(cosine_sim_matrix[movie_idx]))
        
        # Sort berdasarkan similarity score (descending)
        similarity_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)
        
        # Ambil top N (exclude film itu sendiri yang ada di index 0)
        top_n_scores = similarity_scores[1:num_recommendations + 1]
        
        # Format recommendations
        recommendations = []
        for idx, score in top_n_scores:
            movie = df_processed.iloc[idx]
            
            # Ambil rating, handle jika NaN
            rating = movie.get('imdb_rating')
            try:
                rating = float(rating) if pd.notna(rating) and rating != '' else None
            except (ValueError, TypeError):
                rating = None
            
            recommendations.append({
                'movieId': int(movie['movie_id']) if 'movie_id' in movie else int(idx),
                'title': str(movie['title']),
                'genres': str(movie['genres']),
                'actors': str(movie.get('actors', '')),
                'overview': str(movie.get('overview', ''))[:200] + '...' if len(str(movie.get('overview', ''))) > 200 else str(movie.get('overview', '')),
                'imdb_rating': rating,
                'year': str(movie.get('year', '')),
                'similarity_score': round(float(score), 4)
            })
        
        logger.info(f"Returning {len(recommendations)} recommendations")
        
        return jsonify({
            'success': True,
            'input': {
                'movie_id': movie_id,
                'movie_title': movie_title,
                'requested_count': num_recommendations
            },
            'recommendations': recommendations,
            'total_found': len(recommendations)
        })
        
    except Exception as e:
        logger.error(f"Error in recommend_content_based: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e), 'type': type(e).__name__}), 500

@app.route('/recommend/hybrid', methods=['POST'])
def recommend_hybrid():
    """
    Hybrid recommendation endpoint
    Accepts: title, top_n, min_similarity, genre_filter
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body must be JSON'}), 400
        
        movie_title = data.get('movie_title')
        top_n = int(data.get('num_recommendations', 10))
        min_similarity = float(data.get('min_similarity', 0.1))
        genre_filter = bool(data.get('genre_filter', False))
        
        if not movie_title:
            return jsonify({'error': 'movie_title is required for hybrid recommendation'}), 400
            
        if hybrid_recommender is None:
            return jsonify({'error': 'Hybrid model is not loaded in the server'}), 503

        logger.info(f"🔍 Hybrid Request: title='{movie_title}', top_n={top_n}")

        result_df = hybrid_recommender.get_hybrid_recommendations(
            title=movie_title,
            top_n=top_n,
            min_similarity=min_similarity,
            genre_filter=genre_filter,
            verbose=False
        )

        if result_df.empty:
            logger.warning(f"⚠️ No hybrid recommendations passed the threshold for '{movie_title}'")
            return jsonify({
                'success': True,
                'input': {
                    'movie_title': movie_title,
                    'requested_count': top_n,
                    'genre_filter': genre_filter
                },
                'message': f'No recommendations found for {movie_title}',
                'recommendations': [],
                'total_found': 0
            }), 200

        recommendations = []
        for _, row in result_df.iterrows():
            recommendations.append({
                'movieId': int(row['movie_id']) if 'movie_id' in row else None,
                'title': str(row.get('Title', '')),
                'genres': str(row.get('Genre', '')),
                'actors': str(row.get('Real_Actor', '')),
                'imdb_rating': float(row['IMDB Score']) if pd.notna(row.get('IMDB Score')) else None,
                'runtime': str(row.get('Runtime', '')),
                'similarity_score': float(row.get('Hybrid_Score', 0))
            })

        return jsonify({
            'success': True,
            'input': {
                'movie_title': movie_title,
                'requested_count': top_n,
                'genre_filter': genre_filter
            },
            'recommendations': recommendations,
            'total_found': len(recommendations)
        })

    except Exception as e:
        logger.error(f"Error in recommend_hybrid: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/search', methods=['GET'])
def search_movies():
    """
    Search movies by title, genre, or keyword
    """
    try:
        query = request.args.get('q', '').strip()
        genre = request.args.get('genre', '').strip()
        limit = int(request.args.get('limit', 20))
        
        if not query and not genre:
            return jsonify({'error': 'Query or genre parameter required'}), 400
        
        results = df_processed.copy()
        
        # Filter by query (title, overview, actors)
        if query:
            query_lower = query.lower()
            results = results[
                results['title'].str.lower().str.contains(query_lower, na=False) |
                results['overview'].str.lower().str.contains(query_lower, na=False) |
                results['actors'].str.lower().str.contains(query_lower, na=False)
            ]
        
        # Filter by genre
        if genre:
            genre_lower = genre.lower()
            results = results[results['genres'].str.lower().str.contains(genre_lower, na=False)]
        
        # Sort by rating (if available)
        if 'imdb_rating' in results.columns:
            results = results.sort_values('imdb_rating', ascending=False)
        
        # Limit results
        results = results.head(limit)
        
        # Format response
        movies = []
        for _, row in results.iterrows():
            movies.append({
                'movieId': int(row['movie_id']) if 'movie_id' in row else None,
                'title': str(row['title']),
                'genres': str(row['genres']),
                'imdb_rating': float(row['imdb_rating']) if pd.notna(row.get('imdb_rating')) else None,
                'year': str(row.get('year', ''))
            })
        
        return jsonify({
            'success': True,
            'query': query,
            'genre': genre,
            'results': movies,
            'total': len(movies)
        })
        
    except Exception as e:
        logger.error(f"Error in search_movies: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/movies/<int:movie_id>', methods=['GET'])
def get_movie_by_id(movie_id):
    """
    Get movie details by ID
    """
    try:
        movie_row = df_processed[df_processed['movie_id'] == movie_id]
        
        if len(movie_row) == 0:
            return jsonify({'error': f'Movie ID {movie_id} not found'}), 404
        
        movie = movie_row.iloc[0]
        
        return jsonify({
            'success': True,
            'movie': {
                'movieId': int(movie['movie_id']),
                'title': str(movie['title']),
                'genres': str(movie['genres']),
                'actors': str(movie.get('actors', '')),
                'overview': str(movie.get('overview', '')),
                'imdb_rating': float(movie['imdb_rating']) if pd.notna(movie.get('imdb_rating')) else None,
                'year': str(movie.get('year', '')),
                'premiere': str(movie.get('premiere', '')),
                'runtime': str(movie.get('runtime', '')),
                'language': str(movie.get('language', ''))
            }
        })
        
    except Exception as e:
        logger.error(f"Error in get_movie_by_id: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Initialize models saat aplikasi start
@app.before_request
def before_first_request():
    """Load models before first request"""
    global df_processed, cosine_sim_matrix
    
    if df_processed is None or cosine_sim_matrix is None:
        logger.info("🔄 Initializing ML models...")
        if not load_and_process_data():
            logger.error("Failed to load models. Service may not work properly.")

if __name__ == '__main__':
    try:
        print("\n" + "=" * 60, flush=True)
        print("🎬 SMART MOVIE RECOMMENDATION - ML SERVICE", flush=True)
        print("👤 Team: PJK-GM059 | IBM SkillsBuild Capstone", flush=True)
        print("=" * 60 + "\n", flush=True)
        
        logger.info("=" * 60)
        logger.info("🎬 SMART MOVIE RECOMMENDATION - ML SERVICE")
        logger.info("👤 Team: PJK-GM059 | IBM SkillsBuild Capstone")
        logger.info("=" * 60)
        
        # Load models before starting server
        logger.info("🔄 Attempting to load ML models...")
        models_ok = load_and_process_data()
        
        if models_ok:
            logger.info("✅ Models loaded successfully!")
            print("✅ Models loaded successfully!", flush=True)
        else:
            logger.warning("⚠️  Models failed to load. Service will run without ML models.")
            logger.warning("⚠️  /health endpoint will return status: initializing")
            print("⚠️  Models failed to load. Service will run without ML models.", flush=True)
        
        # Run Flask server
        port = int(os.environ.get('PORT', 5000))
        logger.info(f"🚀 Starting Flask server on 0.0.0.0:{port}")
        logger.info(f"📍 Health check available at: http://localhost:{port}/health")
        
        print(f"\n🚀 Starting Flask server on 0.0.0.0:{port}", flush=True)
        print(f"📍 Health check available at: http://localhost:{port}/health\n", flush=True)
        
        app.run(
            host='0.0.0.0',
            port=port,
            debug=False,
            threaded=True
        )

    except Exception as e:
        logger.error(f"❌ Fatal error during startup: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        print(f"❌ Fatal error during startup: {str(e)}", flush=True)
        sys.exit(1)
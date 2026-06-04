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

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables untuk model & data
df_processed = None
tfidf_vectorizer = None
cosine_sim_matrix = None

def load_and_process_data():
    global df_processed, tfidf_vectorizer, cosine_sim_matrix
    
    try:
        # Path ke folder model (c:\Akbar\model)
        model_dir = os.path.join(os.path.dirname(__file__), 'model')
        model_dir = os.path.normpath(model_dir)
        
        logger.info(f"Model directory: {model_dir}")
        
        # --- 1. Load df_processed.csv ---
        csv_path = os.path.join(model_dir, 'df_processed.csv')
        if not os.path.exists(csv_path):
            logger.error(f"df_processed.csv not found: {csv_path}")
            return False
        
        logger.info(f"Loading processed dataset from: {csv_path}")
        df_processed = pd.read_csv(csv_path, encoding='utf-8')
        
        # Standarisasi nama kolom dari df_processed.csv
        column_mapping = {
            'Title': 'title',
            'Genre': 'genres',
            'Overview': 'overview',
            'Real_Actor': 'actors',
            'IMDB Score': 'imdb_rating',
            'Year': 'year',
            'Premiere': 'premiere',
            'Runtime': 'runtime',
            'Language': 'language'
        }
        existing_cols = {k: v for k, v in column_mapping.items() if k in df_processed.columns}
        df_processed.rename(columns=existing_cols, inplace=True)
        
        # Pastikan kolom penting ada
        for col in ['title', 'genres']:
            if col not in df_processed.columns:
                df_processed[col] = ''
        
        df_processed.fillna('', inplace=True)
        
        # Generate unique movie_id jika belum ada
        if 'movie_id' not in df_processed.columns:
            df_processed['movie_id'] = range(1, len(df_processed) + 1)
        
        logger.info(f"Dataset loaded: {len(df_processed)} movies")
        logger.info(f"Columns: {list(df_processed.columns)}")
        
        # --- 2. Load tfidf_vectorizer.pkl ---
        tfidf_path = os.path.join(model_dir, 'tfidf_vectorizer.pkl')
        if not os.path.exists(tfidf_path):
            logger.error(f"tfidf_vectorizer.pkl not found: {tfidf_path}")
            return False
        
        logger.info(f"Loading TF-IDF vectorizer from: {tfidf_path}")
        tfidf_vectorizer = joblib.load(tfidf_path)
        logger.info(f"TF-IDF vectorizer loaded successfully")
        
        # --- 3. Load cosine_sim_matrix.pkl ---
        cosine_path = os.path.join(model_dir, 'cosine_sim_matrix.pkl')
        if not os.path.exists(cosine_path):
            logger.error(f"cosine_sim_matrix.pkl not found: {cosine_path}")
            return False
        
        logger.info(f"Loading Cosine Similarity matrix from: {cosine_path}")
        cosine_sim_matrix = joblib.load(cosine_path)
        logger.info(f"Cosine Similarity matrix loaded! Shape: {cosine_sim_matrix.shape}")
        
        # Tampilkan sample data
        title_col = 'title' if 'title' in df_processed.columns else df_processed.columns[0]
        genre_col = 'genres' if 'genres' in df_processed.columns else 'Genre'
        sample_cols = ['movie_id', title_col, genre_col]
        sample_cols = [c for c in sample_cols if c in df_processed.columns]
        sample = df_processed[sample_cols].head(3)
        logger.info(f"📋 Sample data:\n{sample.to_string(index=False)}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error loading model artifacts: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'Movie Recommendation ML Service',
        'movies_loaded': len(df_processed) if df_processed is not None else 0,
        'models_ready': cosine_sim_matrix is not None
    })

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
        
        logger.info(f"🔍 Recommendation request: id={movie_id}, title={movie_title}, n={num_recommendations}")
        
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
                    # JANGAN langsung return 404 di sini, biarkan log mencatatnya saja
                    logger.warning(f"⚠️ Movie title not found in text match: '{movie_title}'. Trying ID fallback...")
        
        # Prioritas 2: Cari berdasarkan movie_id (jika title tidak ditemukan)
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
        logger.info(" Initializing ML models...")
        if not load_and_process_data():
            logger.error("Failed to load models. Service may not work properly.")

if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("🎬 SMART MOVIE RECOMMENDATION - ML SERVICE")
    logger.info("👤 Team: PJK-GM059 | IBM SkillsBuild Capstone")
    logger.info("=" * 60)
    
    # Load models before starting server
    if load_and_process_data():
        logger.info("Models loaded successfully!")
    else:
        logger.warning("⚠️  Models failed to load. Start server anyway.")
    
    # Run Flask server
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )
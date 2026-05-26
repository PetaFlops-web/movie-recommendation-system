import os
import numpy as np
import pandas as pd
import joblib
# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity

# Configuration
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'model')
PORT = 5001

app = Flask(__name__)
CORS(app)

# Load Model Artifacts on Startup
print("=" * 60)
print("Loading model artifacts...")
print("=" * 60)

# Load processed DataFrame
df = pd.read_csv(os.path.join(MODEL_DIR, 'df_processed.csv'))
print(f"[OK] DataFrame loaded: {df.shape[0]} records, columns: {list(df.columns)}")

# Load TF-IDF Vectorizer & compute TF-IDF matrix
tfidf_vectorizer = joblib.load(os.path.join(MODEL_DIR, 'tfidf_vectorizer.pkl'))
tfidf_matrix = tfidf_vectorizer.transform(df['tags'].fillna(''))
print(f"[OK] TF-IDF Vectorizer loaded, matrix shape: {tfidf_matrix.shape}")

# Load Cosine Similarity Matrix
cosine_sim = joblib.load(os.path.join(MODEL_DIR, 'cosine_sim_matrix.pkl'))
print(f"[OK] Cosine Similarity Matrix loaded: {cosine_sim.shape}")

# Load encoders
movie_encoder = joblib.load(os.path.join(MODEL_DIR, 'movie_encoder.pkl'))
user_encoder = joblib.load(os.path.join(MODEL_DIR, 'user_encoder.pkl'))
n_movies = len(movie_encoder.classes_)
n_users = len(user_encoder.classes_)
print(f"[OK] Encoders loaded: {n_users} users, {n_movies} movies")

# Load NCF Model (Keras)
try:
    import tensorflow as tf
    ncf_model = tf.keras.models.load_model(os.path.join(MODEL_DIR, 'ncf_model.keras'))
    print(f"[OK] NCF Keras model loaded successfully")
    NCF_AVAILABLE = True
except Exception as e:
    print(f"[WARNING] NCF model failed to load: {e}")
    print("[WARNING] NCF endpoint will be unavailable")
    ncf_model = None
    NCF_AVAILABLE = False

# Build title-to-index mapping for content-based
indices = pd.Series(df.index, index=df['Title']).to_dict()
print(f"[OK] Title index mapping created: {len(indices)} entries")

# Build merged DataFrame for NCF 
df_merged = df.copy()
if 'movie_idx' not in df_merged.columns:
    df_merged['movie_idx'] = movie_encoder.transform(
        df_merged['Title'].apply(
            lambda x: x if x in movie_encoder.classes_ else movie_encoder.classes_[0]
        )
    )

print("All models loaded successfully! Server ready.")

# Helper: Format movie metadata
def format_movie_metadata(row):
    """Extract relevant metadata from a DataFrame row."""
    return {
        'title': str(row.get('Title', '')),
        'genre': str(row.get('Genre', '')),
        'imdb_score': float(row.get('IMDB Score', 0)),
        'language': str(row.get('Language', '')),
        'year': int(row.get('Year', 0)) if pd.notna(row.get('Year')) else None,
        'runtime': int(row.get('Runtime', 0)) if pd.notna(row.get('Runtime')) else None,
    }


# Endpoint 1: Content-Based Filtering
@app.route('/predict/content-based', methods=['GET'])
def content_based():
    """
    Get recommendations similar to a given movie title.
    Query params: title (str), top_n (int, default=10)
    """
    title = request.args.get('title', '').strip()
    top_n = int(request.args.get('top_n', 10))

    if not title:
        return jsonify({'success': False, 'error': 'Parameter "title" is required'}), 400

    # Find title in index
    if title not in indices:
        # Try case-insensitive search
        title_lower = title.lower()
        matched = [t for t in indices.keys() if t.lower() == title_lower]
        if matched:
            title = matched[0]
        else:
            available = [t for t in indices.keys() if title_lower in t.lower()]
            return jsonify({
                'success': False,
                'error': f'Movie "{title}" not found in database',
                'suggestions': available[:5]
            }), 404

    idx = indices[title]
    sim_scores = list(enumerate(cosine_sim[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

    # Exclude the movie itself (index 0) and get top_n
    sim_scores = sim_scores[1:top_n + 1]

    movie_indices = [i[0] for i in sim_scores]
    similarity_scores = [round(float(i[1]), 4) for i in sim_scores]

    recommendations = []
    for i, score in zip(movie_indices, similarity_scores):
        movie_data = format_movie_metadata(df.iloc[i])
        movie_data['similarity_score'] = score
        recommendations.append(movie_data)

    return jsonify({
        'success': True,
        'model': 'content-based',
        'input_title': title,
        'count': len(recommendations),
        'recommendations': recommendations
    })



# Endpoint 2: NCF (Neural Collaborative Filtering)
@app.route('/predict/ncf', methods=['GET'])
def ncf_predict():
    """
    Get personalized recommendations for a user via NCF model.
    Query params: username (str), top_n (int, default=10), exclude_seen (bool, default=true)
    """
    if not NCF_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'NCF model is not available. TensorFlow may not be installed.'
        }), 503

    username = request.args.get('username', '').strip()
    top_n = int(request.args.get('top_n', 10))
    exclude_seen = request.args.get('exclude_seen', 'true').lower() == 'true'

    if not username:
        return jsonify({'success': False, 'error': 'Parameter "username" is required'}), 400

    # Validate user exists
    if username not in user_encoder.classes_:
        available_users = list(user_encoder.classes_[:10])
        return jsonify({
            'success': False,
            'error': f'User "{username}" not found',
            'available_users_sample': available_users
        }), 404

    user_id = user_encoder.transform([username])[0]
    all_movie_ids = np.arange(n_movies)

    # Get seen movies if excluding
    seen_movie_ids = set()
    if exclude_seen:
        seen_movie_ids = set(
            df_merged[df_merged['User'] == username]['movie_idx'].values
        )

    # Predict ratings for all movies
    user_arr = np.full(len(all_movie_ids), user_id)
    preds = ncf_model.predict([user_arr, all_movie_ids], verbose=0).flatten()

    # Denormalize predictions to 1-5 scale
    pred_ratings = preds * 4.0 + 1.0

    # Build result DataFrame
    result = pd.DataFrame({
        'movie_idx': all_movie_ids,
        'pred_rating': pred_ratings
    })

    # Exclude seen movies
    if exclude_seen:
        result = result[~result['movie_idx'].isin(seen_movie_ids)]

    # Sort and get top N
    result = result.sort_values('pred_rating', ascending=False).head(top_n)

    # Decode movie indices to titles
    result['Title'] = movie_encoder.inverse_transform(result['movie_idx'].values)

    # Merge with metadata
    meta = df[['Title', 'Genre', 'IMDB Score', 'Language', 'Year', 'Runtime']].drop_duplicates('Title')
    result = result.merge(meta, on='Title', how='left')
    result['pred_rating'] = result['pred_rating'].round(2)

    recommendations = []
    for _, row in result.iterrows():
        recommendations.append({
            'title': str(row['Title']),
            'genre': str(row.get('Genre', '')),
            'imdb_score': float(row.get('IMDB Score', 0)),
            'language': str(row.get('Language', '')),
            'predicted_rating': float(row['pred_rating']),
        })

    return jsonify({
        'success': True,
        'model': 'ncf',
        'username': username,
        'exclude_seen': exclude_seen,
        'count': len(recommendations),
        'recommendations': recommendations
    })


# Endpoint 3: Hybrid Onboarding (for new users)
@app.route('/predict/hybrid-onboarding', methods=['POST'])
def hybrid_onboarding():
    """
    Get recommendations for a new user based on liked movie titles.
    Body JSON: { "liked_titles": ["Movie A", "Movie B"], "top_n": 10 }
    """
    data = request.get_json()
    if not data or 'liked_titles' not in data:
        return jsonify({
            'success': False,
            'error': 'Request body must contain "liked_titles" array'
        }), 400

    liked_titles = data.get('liked_titles', [])
    top_n = int(data.get('top_n', 10))

    if not liked_titles or not isinstance(liked_titles, list):
        return jsonify({
            'success': False,
            'error': '"liked_titles" must be a non-empty array of movie titles'
        }), 400

    # Validate titles
    valid = [t for t in liked_titles if t in indices]
    invalid = [t for t in liked_titles if t not in indices]

    if not valid:
        return jsonify({
            'success': False,
            'error': 'No valid movie titles found',
            'invalid_titles': invalid,
            'suggestion': 'Check available titles via GET /movies endpoint'
        }), 404

    # Mean pooling of TF-IDF vectors
    liked_idx = [indices[t] for t in valid]
    liked_matrix = tfidf_matrix[liked_idx]
    mean_vector = np.asarray(liked_matrix.mean(axis=0))

    # Cosine similarity between mean vector and all movies
    sims = cosine_similarity(mean_vector, tfidf_matrix).flatten()

    # Exclude liked movies
    for idx in liked_idx:
        sims[idx] = -1.0

    top_idx = sims.argsort()[::-1][:top_n]
    top_scores = sims[top_idx]

    recommendations = []
    for i, score in zip(top_idx, top_scores):
        movie_data = format_movie_metadata(df.iloc[i])
        movie_data['onboarding_score'] = round(float(score), 4)
        recommendations.append(movie_data)

    return jsonify({
        'success': True,
        'model': 'hybrid-onboarding',
        'liked_titles': valid,
        'invalid_titles': invalid,
        'count': len(recommendations),
        'recommendations': recommendations
    })


# Endpoint 4: List all movies
@app.route('/movies', methods=['GET'])
def list_movies():
    """List all unique movies with metadata. Supports pagination."""
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    search = request.args.get('search', '').strip().lower()

    movies_df = df[['Title', 'Genre', 'IMDB Score', 'Language', 'Year', 'Runtime']].drop_duplicates('Title')

    # Search filter
    if search:
        movies_df = movies_df[movies_df['Title'].str.lower().str.contains(search, na=False)]

    total = len(movies_df)

    # Pagination
    start = (page - 1) * limit
    end = start + limit
    page_df = movies_df.iloc[start:end]

    movies = []
    for _, row in page_df.iterrows():
        movies.append(format_movie_metadata(row))

    return jsonify({
        'success': True,
        'page': page,
        'limit': limit,
        'total': total,
        'total_pages': (total + limit - 1) // limit,
        'movies': movies
    })

# Endpoint 5: List all users
@app.route('/users', methods=['GET'])
def list_users():
    """List all available users in the dataset."""
    users = sorted(list(user_encoder.classes_))
    return jsonify({
        'success': True,
        'count': len(users),
        'users': users
    })

# Health Check
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'models_loaded': {
            'tfidf_vectorizer': True,
            'cosine_sim_matrix': True,
            'ncf_model': NCF_AVAILABLE,
            'movie_encoder': True,
            'user_encoder': True,
        },
        'dataset_size': len(df),
        'n_users': n_users,
        'n_movies': n_movies,
    })

# Main
if __name__ == '__main__':
    print(f"\n[START] Python Inference Server running on http://localhost:{PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)

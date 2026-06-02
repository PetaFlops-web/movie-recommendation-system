import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os
import psycopg2
from psycopg2.extras import RealDictCursor

# 1. Ambil data terbaru dari PostgreSQL
conn = psycopg2.connect(
    dbname=os.getenv('DB_NAME', 'smart_movie_db'),
    user=os.getenv('DB_USER', 'postgres'),
    password=os.getenv('DB_PASSWORD'),
    host=os.getenv('DB_HOST', 'localhost')
)
df = pd.read_sql("SELECT movie_id, title, genres, overview FROM movies", conn)
conn.close()

# 2. Gabungkan fitur untuk TF-IDF
df['features'] = df['genres'] + " " + df['overview'].fillna("")

# 3. Hitung ulang TF-IDF & Cosine Similarity
tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(df['features'])
cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

# 4. Simpan model baru
model_dir = os.path.join(os.path.dirname(__file__), '..', 'model')
os.makedirs(model_dir, exist_ok=True)

with open(os.path.join(model_dir, 'tfidf_vectorizer.pkl'), 'wb') as f:
    pickle.dump(tfidf, f)
with open(os.path.join(model_dir, 'cosine_sim_matrix.pkl'), 'wb') as f:
    pickle.dump(cosine_sim, f)

# Simpan mapping movie_id <-> index (penting untuk lookup)
movie_index_map = dict(zip(df['movie_id'], df.index))
with open(os.path.join(model_dir, 'movie_index_map.pkl'), 'wb') as f:
    pickle.dump(movie_index_map, f)

print(f"✅ Model berhasil diupdate! Total film: {len(df)}")
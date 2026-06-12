import pandas as pd
import numpy as np
import joblib # Gunakan joblib, lebih stabil untuk sklearn/pandas daripada pickle
import os
import psycopg2

# 1. Konfigurasi Database
# Gunakan DATABASE_URL dari environment variable agar bisa konek ke Railway
DATABASE_URL = os.getenv('DATABASE_URL')

def get_db_connection():
    if DATABASE_URL:
        # Parsing URL untuk psycopg2 (jika format postgresql://...)
        # psycopg2.connect(DATABASE_URL) biasanya jalan otomatis di Railway
        return psycopg2.connect(DATABASE_URL)
    else:
        # Fallback lokal jika tidak ada URL
        return psycopg2.connect(
            dbname="smart_movie_db",
            user="postgres",
            password="123", # Sesuaikan dengan password lokal kamu
            host="localhost",
            port="5433"
        )

print("🔄 Starting model training process...")

try:
    conn = get_db_connection()
    print("✅ Connected to Database")
    
    # 2. Ambil data (Pastikan nama kolom sesuai DB kamu)
    # Jika kolom di DB besar-besar, pandas biasanya handle, tapi kita pastikan
    query = "SELECT movie_id, title, genres, overview FROM movies"
    df = pd.read_sql(query, conn)
    conn.close()
    
    print(f"📊 Loaded {len(df)} movies")
    
    # 3. Preprocessing Data
    # Isi nilai kosong agar tidak error saat digabung
    df['genres'] = df['genres'].fillna('')
    df['overview'] = df['overview'].fillna('')
    
    # Gabungkan fitur untuk TF-IDF
    df['features'] = df['genres'] + " " + df['overview']
    
    # 4. Hitung TF-IDF & Cosine Similarity
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    
    print("⚙️  Calculating TF-IDF and Similarity...")
    tfidf = TfidfVectorizer(stop_words='english', max_features=5000)
    tfidf_matrix = tfidf.fit_transform(df['features'])
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
    
    # 5. Buat Mapping Indices (Title -> Index DataFrame)
    # PENTING: Hybrid Recommender butuh mapping dari JUDUL ke INDEX
    indices = pd.Series(df.index, index=df['title']).drop_duplicates()
    
    # 6. Simpan Model ke Folder /model
    model_dir = os.path.join(os.path.dirname(__file__), 'model')
    os.makedirs(model_dir, exist_ok=True)
    
    print(f"💾 Saving models to {model_dir}...")
    
    # Simpan TF-IDF Vectorizer
    with open(os.path.join(model_dir, 'tfidf_vectorizer.pkl'), 'wb') as f:
        joblib.dump(tfidf, f)
        
    # Simpan Cosine Similarity Matrix
    with open(os.path.join(model_dir, 'cosine_sim_matrix.pkl'), 'wb') as f:
        joblib.dump(cosine_sim, f)
        
    # --- BAGIAN PENTING: BUAT HYBRID RECOMMENDER PKL ---
    # Struktur ini HARUS SAMA dengan yang diharapkan inference_server.py
    hybrid_dict = {
        'similarity_matrix': cosine_sim,
        'indices': indices # Mapping Title -> Index
    }
    
    with open(os.path.join(model_dir, 'hybrid_recommender.pkl'), 'wb') as f:
        joblib.dump(hybrid_dict, f)
        
    print("✅ Model training completed successfully!")
    print(f" Files saved: tfidf_vectorizer.pkl, cosine_sim_matrix.pkl, hybrid_recommender.pkl")

except Exception as e:
    print(f"❌ Error during training: {str(e)}")
    import traceback
    traceback.print_exc()
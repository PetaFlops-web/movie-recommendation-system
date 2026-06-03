"""
Diagnostic script to test model loading
Run this to identify which component is failing
"""

import os
import sys

# Add parent directories to path
sys.path.insert(0, os.path.dirname(__file__))

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'model')

print("=" * 70)
print("DIAGNOSTIC: Model Loading Test")
print("=" * 70)

# Step 1: Check model files exist
print("\n[1] Checking model files...")
required_files = [
    'df_processed.csv',
    'tfidf_vectorizer.pkl',
    'cosine_sim_matrix.pkl',
    'movie_encoder.pkl',
    'user_encoder.pkl',
    'ncf_model.keras'
]

for fname in required_files:
    fpath = os.path.join(MODEL_DIR, fname)
    exists = os.path.exists(fpath)
    size = os.path.getsize(fpath) / (1024*1024) if exists else 0  # Size in MB
    status = "✓" if exists else "✗"
    print(f"  {status} {fname:<30} {size:>8.2f} MB")

# Step 2: Test pandas CSV load
print("\n[2] Testing DataFrame load...")
try:
    import pandas as pd
    df = pd.read_csv(os.path.join(MODEL_DIR, 'df_processed.csv'))
    print(f"  ✓ DataFrame loaded successfully")
    print(f"    - Shape: {df.shape}")
    print(f"    - Columns: {list(df.columns)}")
except Exception as e:
    print(f"  ✗ DataFrame load FAILED: {e}")

# Step 3: Test joblib loads
print("\n[3] Testing joblib loads...")
try:
    import joblib
    
    tfidf = joblib.load(os.path.join(MODEL_DIR, 'tfidf_vectorizer.pkl'))
    print(f"  ✓ TF-IDF vectorizer loaded")
    
    cosine_sim = joblib.load(os.path.join(MODEL_DIR, 'cosine_sim_matrix.pkl'))
    print(f"  ✓ Cosine similarity matrix loaded (shape: {cosine_sim.shape})")
    
    movie_enc = joblib.load(os.path.join(MODEL_DIR, 'movie_encoder.pkl'))
    print(f"  ✓ Movie encoder loaded ({len(movie_enc.classes_)} movies)")
    
    user_enc = joblib.load(os.path.join(MODEL_DIR, 'user_encoder.pkl'))
    print(f"  ✓ User encoder loaded ({len(user_enc.classes_)} users)")
    
except Exception as e:
    print(f"  ✗ Joblib load FAILED: {e}")

# Step 4: Test TensorFlow/Keras
print("\n[4] Testing TensorFlow/Keras model...")
try:
    import tensorflow as tf
    ncf_model = tf.keras.models.load_model(os.path.join(MODEL_DIR, 'ncf_model.keras'))
    print(f"  ✓ NCF Keras model loaded successfully")
    print(f"    - Input layers: {[inp.name for inp in ncf_model.inputs]}")
    print(f"    - Output shape: {ncf_model.output_shape}")
except Exception as e:
    print(f"  ✗ NCF model load FAILED: {e}")
    print(f"    TensorFlow may not be installed correctly")

# Step 5: Test Flask import
print("\n[5] Testing Flask...")
try:
    from flask import Flask
    from flask_cors import CORS
    print(f"  ✓ Flask imported successfully")
except Exception as e:
    print(f"  ✗ Flask import FAILED: {e}")

# Step 6: Test numpy/scipy
print("\n[6] Testing numpy/scipy...")
try:
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
    print(f"  ✓ Numpy/scipy imported successfully")
except Exception as e:
    print(f"  ✗ Numpy/scipy import FAILED: {e}")

print("\n" + "=" * 70)
print("END DIAGNOSTIC")
print("=" * 70)

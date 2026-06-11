-- ========================================
-- CREATE ALL TABLES
-- ========================================

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: movies
CREATE TABLE IF NOT EXISTS movies (
  id SERIAL PRIMARY KEY,
  movie_id INTEGER UNIQUE,
  title VARCHAR(255) NOT NULL,
  genres TEXT,
  actors TEXT,
  overview TEXT,
  imdb_rating DECIMAL(3,1),
  premiere VARCHAR(50),
  runtime INTEGER,
  language VARCHAR(50),
  year INTEGER,
  poster_path VARCHAR(500),
  poster_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: comments
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  movie_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

-- Table: movie_likes
CREATE TABLE IF NOT EXISTS movie_likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  movie_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  UNIQUE(user_id, movie_id)
);

-- Table: movie_shares
CREATE TABLE IF NOT EXISTS movie_shares (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  movie_id INTEGER NOT NULL,
  platform VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

-- Table: user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  genre VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, genre)
);

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_comments_movie_id ON comments(movie_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_likes_movie_id ON movie_likes(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_likes_user_id ON movie_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_shares_movie_id ON movie_shares(movie_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_genres ON movies(genres);
CREATE INDEX IF NOT EXISTS idx_movies_imdb_rating ON movies(imdb_rating DESC);

-- ========================================
-- INSERT SAMPLE DATA (OPTIONAL)
-- ========================================

-- Insert 1 sample user (password: password123 - ini hash bcrypt contoh)
INSERT INTO users (username, email, password, display_name) 
VALUES ('testuser', 'test@example.com', '$2b$10$rH9zqX8YQ5xJxK7vN8mP4uL2wV3tB6cD9eF0gH1iJ2kL3mN4oP5qR', 'Test User')
ON CONFLICT (email) DO NOTHING;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Cek semua tabel sudah terbuat
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Hitung jumlah data di setiap tabel
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'movies', COUNT(*) FROM movies
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'movie_likes', COUNT(*) FROM movie_likes
UNION ALL
SELECT 'movie_shares', COUNT(*) FROM movie_shares
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM user_preferences;
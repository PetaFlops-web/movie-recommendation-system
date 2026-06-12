import psycopg2
import requests
import time
import os

# ✅ Gunakan environment variable untuk TMDB API Key
TMDB_API_KEY = os.environ.get("API_KEY_TMDB", "3149e0862f4cfbe6637ec95c9b02a99b")

# ✅ Gunakan DATABASE_URL dari environment (Railway auto-set ini)
DATABASE_URL = os.environ.get("DATABASE_URL")

def get_db_config():
    """Parse DATABASE_URL menjadi config psycopg2"""
    if DATABASE_URL:
        # Format: postgresql://user:pass@host:port/dbname
        if DATABASE_URL.startswith("postgresql://"):
            url = DATABASE_URL.replace("postgresql://", "")
        elif DATABASE_URL.startswith("postgres://"):
            url = DATABASE_URL.replace("postgres://", "")
        else:
            url = DATABASE_URL
        
        # Split credentials
        auth, rest = url.split("@")
        user, password = auth.split(":")
        host_port, dbname = rest.split("/")
        host, port = host_port.split(":")
        
        return {
            "host": host,
            "port": int(port),
            "database": dbname,
            "user": user,
            "password": password,
            "sslmode": "require"  # Railway butuh SSL
        }
    else:
        # Fallback ke config lokal (untuk development)
        return {
            "host": "localhost",
            "port": 5432,
            "database": "smart_movie_db",
            "user": "postgres",
            "password": "123"
        }

def search_tmdb(title):
    url = "https://api.themoviedb.org/3/search/movie"
    params = {
        "api_key": TMDB_API_KEY,
        "query": title,
        "language": "en-US",
        "page": 1
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("results"):
                poster = data["results"][0].get("poster_path")
                if poster:
                    return poster
    except Exception as e:
        print(f"  ❌ Error fetching TMDB: {e}")
    return None

def main():
    print("🎬 Starting poster update script...")
    print(f"🔑 TMDB API Key: {'✓ Set' if TMDB_API_KEY else '✗ Missing'}")
    print(f"🗄️  Database URL: {'✓ Set' if DATABASE_URL else '✗ Using local config'}")
    print("=" * 60)
    
    try:
        db_config = get_db_config()
        print(f"🔌 Connecting to database: {db_config['host']}:{db_config['port']}...")
        conn = psycopg2.connect(**db_config)
        cur = conn.cursor()
        print("✅ Database connected!")
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return
    
    try:
        # Ambil film yang poster_path-nya masih NULL
        cur.execute("SELECT movie_id, title FROM movies WHERE poster_path IS NULL ORDER BY movie_id")
        movies = cur.fetchall()
        total = len(movies)
        
        if total == 0:
            print("🎉 Semua film sudah memiliki poster!")
            return
            
        print(f"📦 Total film tanpa poster: {total}")
        print("=" * 60)
        
        updated = 0
        failed = 0
        
        for i, (movie_id, title) in enumerate(movies, 1):
            print(f"[{i}/{total}] 🎬 {title}... ", end="", flush=True)
            
            poster = search_tmdb(title)
            
            if poster:
                # Update poster_path
                cur.execute(
                    "UPDATE movies SET poster_path = %s WHERE movie_id = %s", 
                    (poster, movie_id)
                )
                conn.commit()
                updated += 1
                print(f"✅ OK")
            else:
                failed += 1
                print(f"⚠️  Not found")
            
            # Rate limit: TMDB max 40 requests/10 seconds
            time.sleep(0.3)
        
        print("=" * 60)
        print(f"📊 RESULT: {updated} updated, {failed} not found, {total - updated - failed} skipped")
        
        # Bonus: Generate poster_url dari poster_path
        print("🔄 Generating poster_url from poster_path...")
        cur.execute(
            "UPDATE movies SET poster_url = 'https://image.tmdb.org/t/p/w500' || poster_path WHERE poster_path IS NOT NULL AND poster_url IS NULL"
        )
        conn.commit()
        print(f"✅ poster_url generated for {cur.rowcount} movies")
        
    except Exception as e:
        print(f"❌ Error during update: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cur.close()
        conn.close()
        print("🔌 Database connection closed")
        print("✨ Script finished!")

if __name__ == "__main__":
    main()
import psycopg2
import requests
import time

TMDB_API_KEY = "3149e0862f4cfbe6637ec95c9b02a99b"

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "smart_movie_db",
    "user": "postgres",
    "password": "123"
}

def search_tmdb(title):
    url = "https://api.themoviedb.org/3/search/movie"
    params = {"api_key": TMDB_API_KEY, "query": title, "language": "en-US", "page": 1}
    try:
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("results"):
                poster = data["results"][0].get("poster_path")
                if poster:
                    return poster
    except Exception as e:
        print(f"  Error: {e}")
    return None

def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("SELECT movie_id, title FROM movies WHERE poster_path IS NULL ORDER BY movie_id")
    movies = cur.fetchall()
    total = len(movies)
    print(f"Total film tanpa poster: {total}")
    print("=" * 50)
    updated = 0
    for i, (movie_id, title) in enumerate(movies, 1):
        print(f"[{i}/{total}] {title}... ", end="")
        poster = search_tmdb(title)
        if poster:
            cur.execute("UPDATE movies SET poster_path = %s WHERE movie_id = %s", (poster, movie_id))
            conn.commit()
            updated += 1
            print(f"OK -> {poster}")
        else:
            print("Tidak ditemukan")
        time.sleep(0.25)
    cur.close()
    conn.close()
    print("=" * 50)
    print(f"Berhasil: {updated} / {total}")

if __name__ == "__main__":
    main()

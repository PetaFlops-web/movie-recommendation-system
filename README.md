# 🎬 Smart Movie Recommendation System

> **Capstone Project PJK-GM059** — Sistem rekomendasi film cerdas menggunakan Content-Based Filtering dengan antarmuka modern fullstack.

![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-API-000000?logo=flask&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Tech Stack](#-tech-stack)
- [Struktur Proyek](#-struktur-proyek)
- [Prasyarat](#-prasyarat)
- [Instalasi & Setup](#-instalasi--setup)
- [Menjalankan Proyek](#-menjalankan-proyek)
- [Variabel](#-variabel-lingkungan)
- [API Reference](#-api-reference)
- [Fitur Utama](#-fitur-utama)
- [Deployment](#-deployment)
- [Kontributor](#-kontributor)
- [Lisensi](#-lisensi)

---

## 🎯 Tentang Proyek

**Smart Movie Recommendation System** adalah aplikasi web fullstack yang memberikan rekomendasi film personal menggunakan algoritma **Content-Based Filtering (CBF)**. Sistem ini menganalisis kesamaan konten antar film (genre, aktor, overview) menggunakan **TF-IDF Vectorization** dan **Cosine Similarity** untuk memberikan rekomendasi yang relevan.

### Fitur Highlights

- 🔍 **Pencarian & Penjelajahan Film** — Cari, filter berdasarkan genre, dan urutkan film
- 🤖 **Rekomendasi Cerdas** — Rekomendasi berbasis konten & preferensi pengguna
- 👤 **Sistem Autentikasi** — Register, login, dan manajemen profil
- ⭐ **Review & Rating** — Berikan ulasan dan rating (1-10) pada film
- ❤️ **Like & Share** — Simpan film favorit dan bagikan
- 🎨 **UI Modern** — Dark theme, glassmorphism, animasi, responsif

---

### Alur Kerja

1. **Frontend** (Next.js) mengirim request ke **Backend** (Express.js)
2. **Backend** menangani autentikasi, CRUD film, komentar, dan preferensi via PostgreSQL
3. Untuk rekomendasi, **Backend** meneruskan request ke **Python Service** (Flask)
4. **Python Service** memuat model ML dan menghitung kesamaan film menggunakan Cosine Similarity
5. Hasil rekomendasi dikembalikan ke frontend untuk ditampilkan

---

## 🛠 Tech Stack

### Frontend
| Teknologi | Versi | Kegunaan |
|---|---|---|
| Next.js | 14.2.x | React framework dengan App Router |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 3.4.x | Utility-first CSS framework |
| Framer Motion | 12.x | Library animasi React |
| Lucide React | 1.x | Icon library |

### Backend
| Teknologi | Versi | Kegunaan |
|---|---|---|
| Node.js | 22.x | JavaScript runtime |
| Express.js | 4.18.x | Web framework |
| PostgreSQL | - | Relational database |
| JSON Web Token | 9.x | Autentikasi berbasis token |
| bcryptjs | 2.x | Hashing password |
| Helmet | 7.x | Security HTTP headers |
| Morgan | 1.x | HTTP request logger |

### Python ML Service
| Teknologi | Kegunaan |
|---|---|
| Flask | Web framework untuk inference server |
| scikit-learn | TF-IDF Vectorizer & Cosine Similarity |
| pandas | Data processing |
| NumPy | Komputasi numerik |
| joblib | Load model yang di-serialize |
| Gunicorn | Production WSGI server |

---

## 📁 Struktur Proyek

```
Fullstack/
├── 📄 .env                          # Token HuggingFace (root)
├── 📄 .gitignore                    # Git ignore rules
├── 📓 Netflix_Recommendation_CBF.ipynb  # Jupyter Notebook (training model)
├── 📄 schema.sql                    # Database schema & seed data
├── 📊 dataset_clean.csv             # Dataset film (mentah)
├── 📊 dataset_final.csv             # Dataset film (final)
│
├── 🤖 model/                        # Pre-trained ML models
│   ├── cosine_sim_matrix.pkl        # Matriks Cosine Similarity
│   ├── df_processed.csv             # Dataframe yang sudah diproses
│   ├── hybrid_recommender.pkl       # Model Hybrid Recommender
│   └── tfidf_vectorizer.pkl         # TF-IDF Vectorizer
│
├── ⚙️ backend/                      # Backend API (Express.js)
│   ├── app.js                       # Express app setup
│   ├── server.js                    # Entry point server
│   ├── package.json                 # Node.js dependencies
│   ├── Dockerfile                   # Docker config
│   ├── api_documentation.md         # Dokumentasi API
│   ├── config/                      # Konfigurasi database
│   ├── controllers/                 # Request handlers
│   ├── middleware/                   # Auth middleware (JWT)
│   ├── routes/                      # Route definitions
│   ├── services/                    # Business logic layer
│   ├── utils/                       # Utility functions
│   ├── scripts/                     # Script import dataset
│   ├── dataset/                     # CSV dataset untuk import
│   └── python_service/              # Flask ML microservice
│       ├── inference_server.py      # Server inference ML
│       ├── requirements.txt         # Python dependencies
│       ├── Dockerfile               # Docker config Python
│       ├── .env.example             # Template environment
│       ├── diagnose.py              # Script diagnostik model
│       ├── update_model.py          # Script update model
│       └── model/                   # Symlink/copy model files
│
└── 🎨 frontend/                     # Frontend (Next.js)
    ├── package.json                 # Node.js dependencies
    ├── next.config.mjs              # Next.js configuration
    ├── tailwind.config.ts           # Tailwind CSS config
    ├── tsconfig.json                # TypeScript config
    ├── .env.example                 # Template environment
    └── src/
        ├── app/                     # App Router pages
        │   ├── layout.tsx           # Root layout
        │   ├── page.tsx             # Home page (/)
        │   ├── globals.css          # Global styles
        │   ├── auth/
        │   │   ├── login/page.tsx   # Login (/auth/login)
        │   │   └── register/page.tsx # Register (/auth/register)
        │   ├── movies/
        │   │   ├── page.tsx         # Movie listing (/movies)
        │   │   └── [id]/page.tsx    # Movie detail (/movies/:id)
        │   ├── profile/page.tsx     # User profile (/profile)
        │   ├── recommendations/page.tsx # Rekomendasi (/recommendations)
        │   └── search/page.tsx      # Pencarian (/search)
        ├── components/              # Komponen UI
        │   ├── Navbar.tsx           # Navigation bar
        │   ├── Footer.tsx           # Footer
        │   ├── MovieCard.tsx        # Kartu film
        │   └── ReviewSection.tsx    # Seksi ulasan
        ├── context/
        │   └── AuthContext.tsx      # Context autentikasi
        ├── lib/
        │   └── api.ts              # Axios instance & API helpers
        └── types/
            └── index.ts            # TypeScript type definitions
```

---

## ✅ Prasyarat

Pastikan perangkat lunak berikut sudah terinstal:

| Software | Versi Minimum | Link Download |
|---|---|---|
| **Node.js** | v18.0.0+ (disarankan v22) | [nodejs.org](https://nodejs.org/) |
| **npm** | v9.0.0+ | Termasuk dalam Node.js |
| **Python** | 3.8+ | [python.org](https://www.python.org/) |
| **pip** | Terbaru | Termasuk dalam Python |
| **PostgreSQL** | 14+ | [postgresql.org](https://www.postgresql.org/) |
| **Git** | Terbaru | [git-scm.com](https://git-scm.com/) |

---

## 🚀 Instalasi & Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd Fullstack
```

### 2. Setup Database PostgreSQL

```bash
# Buat database baru
psql -U postgres
CREATE DATABASE movie_db;
\q

# Jalankan schema untuk membuat tabel
psql -U postgres -d movie_db -f schema.sql
```

> **Catatan:** Schema akan membuat tabel `users`, `movies`, `comments`, `movie_likes`, `movie_shares`, dan `user_preferences`, beserta index untuk performa optimal.

### 3. Setup Backend (Express.js)

```bash
cd backend

# Buat file environment
cp .env.example .env    # Jika ada, atau buat manual
```

Isi file `backend/.env` dengan konfigurasi berikut:

```env
PORT=3001
NODE_ENV=development

DB_USER=postgres
DB_HOST=localhost
DB_NAME=movie_db
DB_PASSWORD=your_db_password
DB_PORT=5432
# Atau gunakan DATABASE_URL untuk production:
# DATABASE_URL=postgresql://user:pass@host:5432/movie_db

PYTHON_SERVICE_URL="http://localhost:5000"

API_KEY_TMDB="your_tmdb_api_key"
API_KEY_READ_ACCESS_TOKEN_TMDB="your_tmdb_read_access_token"
TMDB_BASE_URL="https://api.themoviedb.org/3"

JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="1h"
```

Kemudian instal dependencies, jalankan migrasi, dan import dataset:

```bash
# Instal dependencies
npm install

# Jalankan migrasi database (buat tabel & index)
node scripts/migrate.js

# Import data film ke database
npm run import-movies
# atau: node scripts/importMovies.js

# (Opsional) Sinkronisasi poster dari TMDB
node scripts/importImageMovies.js
```

### 4. Setup Python Service (Flask)

```bash
cd backend/python_service

# Buat virtual environment (opsional tapi disarankan)
python -m venv venv
source venv/bin/activate       # Linux/Mac
# venv\Scripts\activate        # Windows

# Buat file environment
cp .env.example .env

# Instal dependencies Python
pip install -r requirements.txt
```

> **Penting:** Pastikan folder `model/` di root project berisi file model ML yang dibutuhkan:
> - `cosine_sim_matrix.pkl`
> - `df_processed.csv`
> - `hybrid_recommender.pkl`
> - `tfidf_vectorizer.pkl`

### 5. Setup Frontend (Next.js)

```bash
cd frontend

# Buat file environment
cp .env.example .env
```

Edit file `frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:5000
NEXT_PUBLIC_API_TIMEOUT=30000

NEXT_PUBLIC_JWT_STORAGE_KEY=auth_token_storage

NEXT_PUBLIC_ENABLE_CF=true
NEXT_PUBLIC_ENABLE_CBF=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false

NEXT_PUBLIC_LOG_LEVEL=info
NEXT_PUBLIC_APP_NAME=Smart Movie Recommendation
NEXT_PUBLIC_APP_VERSION=1.0.0
```

```bash
# Instal dependencies
npm install
```

---

## ▶️ Menjalankan Proyek

Anda perlu menjalankan **3 service** secara bersamaan. Buka 3 terminal terpisah:

### Terminal 1 — Python ML Service

```bash
cd backend/python_service
source venv/bin/activate    # Jika menggunakan virtualenv
python inference_server.py
```

> Service berjalan di `http://localhost:5000`

### Terminal 2 — Backend Express.js

```bash
cd backend
npm run dev
```

> Server berjalan di `http://localhost:3001`

### Terminal 3 — Frontend Next.js

```bash
cd frontend
npm run dev
```

> Aplikasi berjalan di `http://localhost:3000`

### Urutan Menjalankan

```
1. PostgreSQL    → Pastikan sudah berjalan
2. Python Service → Port 5000 (untuk rekomendasi ML)
3. Backend       → Port 3001 (API utama)
4. Frontend      → Port 3000 (tampilan web)
```

---

## 🔐 Variabel 

### Backend (`backend/.env`)

| Variabel | Deskripsi | Contoh |
|---|---|---|
| `PORT` | Port backend server | `3001` |
| `DB_USER` | Username PostgreSQL | `postgres` |
| `DB_HOST` | Host database | `localhost` |
| `DB_NAME` | Nama database | `movie_db` |
| `DB_PASSWORD` | Password database | `your_password` |
| `DB_PORT` | Port PostgreSQL | `5432` |
| `PYTHON_SERVICE_URL` | URL Python ML service | `http://localhost:5000` |
| `API_KEY_TMDB` | API Key dari TMDB | Daftar di [themoviedb.org](https://www.themoviedb.org/) |
| `API_KEY_READ_ACCESS_TOKEN_TMDB` | Read Access Token TMDB | Dari dashboard TMDB |
| `TMDB_BASE_URL` | Base URL API TMDB | `https://api.themoviedb.org/3` |
| `JWT_SECRET` | Secret key untuk JWT | String acak yang kuat |
| `JWT_EXPIRES_IN` | Masa berlaku JWT | `1h`, `7d`, `30d` |

### Python Service (`backend/python_service/.env`)

| Variabel | Deskripsi | Contoh |
|---|---|---|
| `FLASK_ENV` | Environment Flask | `development` / `production` |
| `FLASK_PORT` | Port Flask server | `5000` |
| `FLASK_DEBUG` | Mode debug | `True` / `False` |
| `MODEL_PATH` | Path ke folder model | `./model/` |
| `LOG_LEVEL` | Level logging | `INFO` |

### Frontend (`frontend/.env`)

| Variabel | Deskripsi | Contoh |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL backend API | `http://localhost:3001` |
| `NEXT_PUBLIC_PYTHON_API_URL` | URL Python service | `http://localhost:5000` |
| `NEXT_PUBLIC_API_TIMEOUT` | Timeout API (ms) | `30000` |
| `NEXT_PUBLIC_JWT_STORAGE_KEY` | Key localStorage JWT | `auth_token_storage` |
| `NEXT_PUBLIC_ENABLE_CF` | Flag Collaborative Filtering | `true` |
| `NEXT_PUBLIC_ENABLE_CBF` | Flag Content-Based Filtering | `true` |
| `NEXT_PUBLIC_APP_NAME` | Nama aplikasi | `Smart Movie Recommendation` |

---

## 📡 API Reference

### Autentikasi

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Registrasi pengguna baru (+ preferensi genre) | ❌ |
| `POST` | `/api/auth/login` | Login dan dapatkan JWT token | ❌ |
| `GET` | `/api/auth/preferences` | Ambil preferensi genre user | ✅ |
| `POST` | `/api/auth/preferences` | Update preferensi genre user | ✅ |

### Film

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/movies` | Daftar film (paginasi, search, filter genre/aktor) | ❌ |
| `GET` | `/api/movies/trending` | Film trending berdasarkan IMDb rating | ❌ |
| `GET` | `/api/movies/top/:genre` | Film top-rated per genre | ❌ |
| `GET` | `/api/movies/:id` | Detail film + rekomendasi TF-IDF & Hybrid | ❌ |
| `GET` | `/api/movies/tmdb/:tmdbId` | Detail film berdasarkan TMDB ID | ❌ |
| `GET` | `/api/movies/recommendations/similar/:title` | 10 film serupa (Content-Based ML) | ❌ |
| `GET` | `/api/movies/recommendations/by-genre` | Rekomendasi berdasarkan genre | ❌ |
| `GET` | `/api/movies/recommendations/user/:userId` | Rekomendasi personal berdasarkan preferensi | ❌ |

### Interaksi Sosial

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/movies/:movieId/comments` | Ambil komentar film | ❌ |
| `POST` | `/api/movies/:movieId/comments` | Buat komentar (+ filter toksisitas) | ✅ |
| `GET` | `/api/movies/:movieId/likes` | Ambil jumlah like | ❌ |
| `POST` | `/api/movies/:movieId/like` | Toggle like/unlike | ✅ |
| `POST` | `/api/movies/:movieId/share` | Catat share (+ platform) | ✅ |

### Profil Pengguna

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/users/:userId/profile` | Ambil profil user | ❌ |
| `PUT` | `/api/users/:userId/profile` | Update username | ✅ |
| `DELETE` | `/api/users/:userId/profile` | Hapus akun secara permanen | ✅ |

### Sistem

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/health` | Health check (Node.js + DB + ML service) | ❌ |
| `GET` | `/health` | Simple health check (untuk Docker) | ❌ |

> **Auth ✅** = Membutuhkan header `Authorization: Bearer <jwt_token>`
> 
> Semua respons API menggunakan format standar: `{ success, message, data }`

---

## ✨ Fitur Utama

### 🏠 Halaman Beranda
- Hero section dengan CTA
- Film trending (berdasarkan jumlah like)
- Film top-rated (berdasarkan IMDb rating)
- Rekomendasi personal (jika login)

### 🔍 Pencarian & Filter
- Pencarian film berdasarkan judul
- Filter berdasarkan genre
- Sorting berdasarkan rating, tahun, atau judul
- Paginasi untuk navigasi data

### 🎬 Detail Film
- Poster film (dari TMDB API)
- Informasi lengkap: judul, tahun, runtime, bahasa, genre, rating IMDb
- Sinopsis/overview
- Film serupa (rekomendasi ML)
- Seksi review dan rating

### 🤖 Sistem Rekomendasi
- **Content-Based Filtering**: Menggunakan TF-IDF pada fitur film (genre, aktor, overview) dan menghitung Cosine Similarity antar film
- **Preference-Based**: Rekomendasi berdasarkan genre favorit pengguna
- Model dilatih dalam Jupyter Notebook (`Netflix_Recommendation_CBF.ipynb`) dan di-serve via Flask microservice

### 👤 Autentikasi & Profil
- Registrasi dengan pemilihan genre favorit
- Login dengan JWT token (disimpan di localStorage)
- Halaman profil: edit display name, lihat film yang disukai, kelola preferensi genre

### ⭐ Review & Rating
- Berikan rating 1-10 dan komentar pada film
- Edit dan hapus review sendiri
- Paginasi pada daftar review

### ❤️ Like & Share
- Like/unlike film dengan animasi
- Share film (salin link ke clipboard)

## 🐳 Deployment

### Menggunakan Docker

**Backend:**
```bash
cd backend
docker build -t movie-backend .
docker run -p 3001:3001 --env-file .env movie-backend
```

**Python Service:**
```bash
cd backend/python_service
docker build -t movie-python-service .
docker run -p 5000:5000 --env-file .env movie-python-service
```

**Frontend (Production Build):**
```bash
cd frontend
npm run build
npm run start
```

### Deploy ke Railway / Vercel

- **Backend + Python Service**: Deploy ke [Railway](https://railway.app/) dengan masing-masing Dockerfile
- **Frontend**: Deploy ke [Vercel](https://vercel.com/) (native Next.js support)
- **Database**: Gunakan managed PostgreSQL dari Railway atau [Neon](https://neon.tech/)

---

## 👥 Kontributor

| Nama | Peran |
|---|---|
| **Wandi Filemon Hotmartua Sianturi** | Backend |
| **Akbar Vabiansyah** | Machine Learning |
| **Nazwa Syakuru** | Frontend |
| **Novario Dimas Kusuma** | Frontend |
---

## 📄 Lisensi

Proyek ini dilisensikan di bawah **MIT License**. Lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.

---

<p align="center">
  <b>Smart Movie Recommendation System</b> — Capstone Project PJK-GM059<br/>
  Dibuat dengan ❤️ menggunakan Next.js, Express.js, Flask, dan scikit-learn
</p>

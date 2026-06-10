# Smart Movie Recommendation System API Documentation

This document provides a Swagger-like specification for the Backend REST API. All endpoints return data in JSON format and have a base URL of `http://localhost:3001` (or your configured `PORT`).

---

## 🔐 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
Register a new user account.
* **Access:** Public
* **Request Body (JSON):**
  ```json
  {
    "username": "johndoe",
    "email": "johndoe@example.com",
    "password": "securepassword123",
    "genres": ["Action", "Sci-Fi"] // Optional array of preferred genres
  }
  ```
* **Success Response (201 Created):** Returns user details and a JWT token.
* **Error Responses:** `400 Bad Request` (Validation Failed)

### `POST /api/auth/login`
Authenticate a user and get a token.
* **Access:** Public
* **Request Body (JSON):**
  ```json
  {
    "email": "johndoe@example.com",
    "password": "securepassword123"
  }
  ```
* **Success Response (200 OK):** Returns user details, preferences, and a JWT token.
* **Error Responses:** `400 Bad Request` (Invalid credentials)

### `GET /api/auth/preferences`
Get the authenticated user's genre preferences.
* **Access:** Private (Requires `Authorization: Bearer <token>`)
* **Success Response (200 OK):** Returns an array of genres.
* **Error Responses:** `401 Unauthorized`

### `POST /api/auth/preferences`
Update the authenticated user's genre preferences.
* **Access:** Private (Requires `Authorization: Bearer <token>`)
* **Request Body (JSON):**
  ```json
  {
    "genres": ["Horror", "Thriller"]
  }
  ```
* **Success Response (200 OK):** Returns the updated preferences.

---

## 🎬 2. Movies & Recommendations (`/api/movies`)

### `GET /api/movies`
Get a paginated list of movies.
* **Access:** Public
* **Query Parameters:**
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)
  - `search` (optional): Search query by title, actor, or genre.
* **Success Response (200 OK):** Returns an array of movies and pagination metadata.

### `GET /api/movies/:id`
Get detailed information about a movie by its local Database ID, alongside 10 content-based recommendations from the ML service.
* **Access:** Public
* **Path Parameters:**
  - `id`: The local database ID of the movie.
* **Success Response (200 OK):** Returns the movie details and a `recommendations` array.
* **Error Responses:** `404 Not Found`

### `GET /api/movies/tmdb/:tmdbId`
Get detailed information about a movie by its TMDB ID.
* **Access:** Public
* **Path Parameters:**
  - `tmdbId`: The TMDB ID of the movie.
* **Success Response (200 OK):** Returns the movie details and ML recommendations.

### `GET /api/movies/recommendations/similar/:title`
Find up to 10 similar movies based on a given movie title (Content-Based ML filtering).
* **Access:** Public
* **Path Parameters:**
  - `title`: URL-encoded movie title (e.g., `Batman`, `Enter%20the%20Anime`).
* **Success Response (200 OK):** Returns the input movie and a `recommendations` array.

### `GET /api/movies/recommendations/by-genre`
Get top recommended movies matching a specific set of multiple genres.
* **Access:** Public
* **Query Parameters:**
  - `genres` (required): Comma-separated list of genres (e.g., `Action,Comedy`).
  - `limit` (optional): Number of movies to return (default: 10).
* **Success Response (200 OK):** Returns a list of movies matching the genres.

### `GET /api/movies/top/:genre`
Get the top-rated movies for a single specific genre.
* **Access:** Public
* **Path Parameters:**
  - `genre`: The genre name (e.g., `Action`).
* **Query Parameters:**
  - `limit` (optional): Default 10.
* **Success Response (200 OK):** Returns a list of top movies.

### `GET /api/movies/recommendations/user/:userId`
Get personalized movie recommendations based on a user's saved genre preferences.
* **Access:** Public
* **Path Parameters:**
  - `userId`: ID of the user to generate recommendations for.
* **Success Response (200 OK):** Returns the user's preferences and recommended movies.

---

## 👤 3. User Profiles (`/api/users`)

### `GET /api/users/:userId/profile`
Get public profile information for a user.
* **Access:** Public
* **Path Parameters:**
  - `userId`: The ID of the user.
* **Success Response (200 OK):** Returns user details (omitting sensitive info).

### `PUT /api/users/:userId/profile`
Update a user's profile information (currently supports updating `username`).
* **Access:** Private (Requires `Authorization: Bearer <token>`)
* **Path Parameters:**
  - `userId`: The ID of the user.
* **Request Body (JSON):**
  ```json
  {
    "username": "new_username"
  }
  ```
* **Success Response (200 OK):** Returns the updated profile.

### `DELETE /api/users/:userId/profile`
Permanently delete a user account.
* **Access:** Private (Requires `Authorization: Bearer <token>`)
* **Path Parameters:**
  - `userId`: The ID of the user.
* **Success Response (200 OK):** Confirmation message.

---

## 💬 4. Social Features (`/api/movies/:movieId`)

### `GET /api/movies/:movieId/comments`
Retrieve all comments for a specific movie.
* **Access:** Public
* **Path Parameters:**
  - `movieId`: Local database ID of the movie.
* **Success Response (200 OK):** Returns an array of comment objects with user info.

### `POST /api/movies/:movieId/comments`
Add a comment/review to a movie.
* **Access:** Private (Requires `Authorization: Bearer <token>`)
* **Request Body (JSON):**
  ```json
  {
    "content": "This movie was absolutely amazing!",
    "rating": 5 // Optional rating out of 5
  }
  ```
* **Success Response (201 Created):** Returns the created comment.

### `GET /api/movies/:movieId/likes`
Get the total number of likes a movie has received.
* **Access:** Public
* **Success Response (200 OK):** Returns the total count.

### `POST /api/movies/:movieId/like`
Toggle a like for a movie (if already liked, it removes the like).
* **Access:** Private (Requires `Authorization: Bearer <token>`)
* **Success Response (200 / 201):** Returns status indicating if the movie was liked or unliked.

### `POST /api/movies/:movieId/share`
Record a movie share event for analytics.
* **Access:** Private (Requires `Authorization: Bearer <token>`)
* **Request Body (JSON):**
  ```json
  {
    "platform": "twitter" // e.g., twitter, facebook, whatsapp, direct
  }
  ```
* **Success Response (201 Created):** Returns the share confirmation.

---

## 🩺 5. System (`/api/health`)

### `GET /api/health`
Check the health status of the Node.js API, PostgreSQL Database, and Python ML Service.
* **Access:** Public
* **Success Response (200 OK):** Returns a health object detailing the status of all sub-systems.

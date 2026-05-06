const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// route utama
app.get("/", (req, res) => {
  res.send("Welcome to App Smart Movie Recommendation");
});

// API sederhana (buat checkpoint)
app.get("/api/movies", (req, res) => {
  const movies = [
    { id: 1, title: "Avengers", genre: "Action" },
    { id: 2, title: "Titanic", genre: "Romance" },
    { id: 3, title: "Conjuring", genre: "Horror" }
  ];

  res.json(movies);
});

// API
app.get("/api/recommend", (req, res) => {
  const { genre } = req.query;

  const movies = [
    { title: "Avengers", genre: "Action" },
    { title: "Titanic", genre: "Romance" },
    { title: "Conjuring", genre: "Horror" }
  ];

  const result = movies.filter(m =>
    m.genre.toLowerCase().includes(genre?.toLowerCase())
  );

  res.json(result);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
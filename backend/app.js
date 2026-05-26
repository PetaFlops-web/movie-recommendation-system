import express from "express";
import cors from "cors";
import recommendationRoutes from "./src/routes/recommendation.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "Smart Movie Recommendation API",
    version: "1.0.0",
    description:
      "Backend API for Content-Based, NCF, and Hybrid Movie Recommendations",
    endpoints: {
      health: "GET /api/v1/health",
      movies: "GET /api/v1/movies?page=1&limit=20&search=...",
      users: "GET /api/v1/users",
      content_based:
        "GET /api/v1/recommendations/content-based?title=...&top_n=10",
      ncf: "GET /api/v1/recommendations/ncf?username=...&top_n=10&exclude_seen=true",
      hybrid_onboarding: "POST /api/v1/recommendations/hybrid-onboarding",
    },
  });
});

app.use("/api/v1", recommendationRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use((err, req, res, _next) => {
  console.error("[GlobalError]", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(
    `\n[START] Node.js API Server running on http://localhost:${PORT}`,
  );
});

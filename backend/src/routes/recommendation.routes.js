import { Router } from "express";
import {
  contentBasedController,
  ncfController,
  hybridOnboardingController,
  moviesController,
  usersController,
  healthController,
} from "../controllers/recommendation.controller.js";

const router = Router();

// Content-Based Filtering: GET /api/v1/recommendations/content-based?title=...&top_n=10
router.get("/recommendations/content-based", contentBasedController);

// Neural Collaborative Filtering: GET /api/v1/recommendations/ncf?username=...&top_n=10
router.get("/recommendations/ncf", ncfController);

// Hybrid Onboarding: POST /api/v1/recommendations/hybrid-onboarding { liked_titles: [...], top_n: 10 }
router.post("/recommendations/hybrid-onboarding", hybridOnboardingController);

// List Movies: GET /api/v1/movies?page=1&limit=20&search=...
router.get("/movies", moviesController);

// List Users: GET /api/v1/users
router.get("/users", usersController);

// Health Check: GET /api/v1/health
router.get("/health", healthController);

export default router;

import { Router } from "express";
import {
  login,
  getProfile,
  changePassword,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Rutas públicas
router.post("/login", login);

// Rutas protegidas
router.get("/profile", authenticateToken, getProfile);
router.post("/change-password", authenticateToken, changePassword);

export default router;

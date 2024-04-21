import express from "express";
import { registerUser,loginUser,logoutUser,forgotPassword, changePassword } from "../controllers/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout",logoutUser);
router.post("/forgot-password",forgotPassword);
router.post("/change-password/:id/:token",changePassword);

export default router;
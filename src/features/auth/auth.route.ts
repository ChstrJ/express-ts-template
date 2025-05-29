import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

// @ts-ignore
router.get('/login', authController.login);

export default router;

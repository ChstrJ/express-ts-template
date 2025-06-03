import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "@middlewares/validator";
import { loginValidator } from "@common/schema/authValidator";

const router = Router();

// @ts-ignore
router.get('/login', validateRequest(loginValidator), authController.login);
router.get('/login', validateRequest(loginValidator), authController.register);

export default router;

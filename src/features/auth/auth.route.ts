import { Router } from "express";
import { validateRequest } from "@middlewares/validator";
import { loginValidator, registerValidator } from "@common/schema/authValidator";
import { authController } from "./auth.controller";

const router = Router();

router.post('/login', validateRequest(loginValidator), authController.login);
router.post('/register', validateRequest(registerValidator), authController.register);

export default router;
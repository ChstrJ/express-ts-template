import { Router } from "express";
import { validateRequest } from "@middlewares/validator";
import { loginValidator, registerValidator } from "@common/schema/authValidator";
import { container } from "tsyringe";
import { AuthController } from "./auth.controller";

const router = Router();

const authController = container.resolve(AuthController);

router.post('/login', validateRequest(loginValidator), (req, res) => authController.login(req, res));
router.post('/register', validateRequest(registerValidator), (req, res) => authController.register(req, res));

export default router;

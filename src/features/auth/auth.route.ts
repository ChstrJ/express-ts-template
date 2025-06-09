//@ts-nocheck
import { Router } from "express";
import { validateRequest } from "@middlewares/validator";
import { loginValidator, registerValidator } from "@common/schema/authValidator";
import { container } from "tsyringe";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AccountRepository } from "@features/account/account.repository";

const router = Router();

//const authController = container.resolve(AuthController);

const authService = new AuthService(new AccountRepository)
const authController = new AuthController(authService)
console.log(authController)

//router.post('/login', validateRequest(loginValidator), (req, res) => authController.login(req, res));
//router.post('/register', validateRequest(registerValidator), (req, res) => authController.register(req, res));
router.get('/test', (req, res) => authController.test(req, res));

export default router;

import { AuthController } from "@root/controllers/auth/auth.controller";
import { Router } from "express";
import { container } from "tsyringe";

const router = Router();

const authController = container.resolve(AuthController);

router.post('/login', (req: any, res: any) => authController.login(req, res));

export default router;



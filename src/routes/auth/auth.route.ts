import { AuthController } from "@root/controllers/auth/auth.controller";
import { Router, Request, Response } from "express";
import { container } from "tsyringe";

const router = Router();

const authController = container.resolve(AuthController);

// @ts-ignore
router.post('/login', (req: Request, res: Response) => authController.login(req, res));

export default router;



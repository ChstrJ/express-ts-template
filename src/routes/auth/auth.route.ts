import { AuthController } from "@root/controllers/auth/auth.controller";
import { Router, Request, Response } from "express";
import { container } from "tsyringe";

const router = Router();

const controller = container.resolve(AuthController);

router.post('/login', (req: any, res: any) => controller.login(req, res));

export default router;



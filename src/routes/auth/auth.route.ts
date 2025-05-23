import { AuthController } from "@root/controllers/auth/auth.controller";
import { Router } from "express";
import { container } from "tsyringe";

const router = Router();

const controller = container.resolve(AuthController);

router.get('/login', (req, res) => controller.login(req, res));

export default router;



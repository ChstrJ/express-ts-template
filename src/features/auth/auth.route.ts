import { Router, Request, Response } from "express";
import { AuthService } from "./auth.service";

const router = Router();

router.get('/login', (req: Request, res: Response) => AuthService.login(req, res));

export default router;

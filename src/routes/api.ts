import { Router } from "express";
import AuthRoutes from "@features/auth/auth.route";

const router = Router();

const VERSION = 'v1';

router.use('/auth', AuthRoutes);

export default router;

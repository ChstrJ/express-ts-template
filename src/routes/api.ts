import { Router } from "express";
import AuthRoutes from "@features/auth/auth.route";

const router = Router();

router.use('/auth', AuthRoutes);

export default router;

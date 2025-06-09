import { Router } from "express";
import { validateRequest } from "@middlewares/validator";
import { loginValidator, registerValidator } from "@common/schema/authValidator";
import { container } from "tsyringe";
import { AuthController } from "./auth.controller";

const router = Router();

const authController = container.resolve(AuthController);

router.post('/login', validateRequest(loginValidator), async (req, res, next) => {
  try {
    await authController.login(req, res);
  } catch (error) {
    next(error);
  }
});
router.post('/register', validateRequest(registerValidator), async (req, res, next) => {
  try {
    await authController.register(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;

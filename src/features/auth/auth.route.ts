import { Router } from "express";
import { validateRequest } from "@middlewares/validator";
import { loginValidator, registerValidator } from "@common/schema/authValidator";
import { container } from "tsyringe";
import { AuthController } from "./auth.controller";
// Removed: import { AuthService } from "./auth.service";
// Removed: import { AccountRepository } from "@features/account/account.repository";
// Removed: import logger from '@utils/logger'; // For logging

const router = Router();

// try {
//   logger.info("Attempting to resolve AccountRepository...");
//   const accountRepo = container.resolve(AccountRepository);
//   logger.info(`AccountRepository resolved: ${!!accountRepo}`);
//   if (accountRepo) {
//     logger.info(`AccountRepository constructor: ${accountRepo.constructor.name}`);
//   }
//
//   logger.info("Attempting to resolve AuthService...");
//   const authServiceResolved = container.resolve(AuthService);
//   logger.info(`AuthService resolved: ${!!authServiceResolved}`);
//   if (authServiceResolved) {
//     logger.info(`AuthService constructor: ${authServiceResolved.constructor.name}`);
//     logger.info(`AuthService.accountRepository: ${!!(authServiceResolved as any).accountRepository}`);
//   }
// } catch (e: any) {
//   logger.error("Error resolving services directly in auth.route.ts:", e.message);
// }

const authController = container.resolve(AuthController);
// logger.info(`AuthController resolved: ${!!authController}`);
// if (authController) {
//   logger.info(`AuthController constructor: ${authController.constructor.name}`);
//   logger.info(`AuthController.authService: ${!!(authController as any).authService}`);
// }

router.post('/login', validateRequest(loginValidator), (req, res) => authController.login(req, res));
router.post('/register', validateRequest(registerValidator), (req, res) => authController.register(req, res));
router.get('/test', (req, res) => authController.test(req, res));

export default router;

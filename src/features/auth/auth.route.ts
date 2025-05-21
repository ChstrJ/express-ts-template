import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { AuthController } from './auth.controller';

const router = Router();

//@ts-ignore
router.get('/login', (req: Request, res: Response) => {
  return res.json({ message: 'test' });
});

export default router;

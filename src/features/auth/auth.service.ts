import { Request, Response } from 'express';

export const AuthService = {

  async login(req, res) {
    return res.json({ message: 'hi' });
  }

}


import { Request, Response } from 'express';

export const accountController = {
    async findAll(req: Request, res: Response) {
        res.json('test')
    },
}
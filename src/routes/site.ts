import express, { Request, Response } from 'express';
import path from 'path';

export const SiteRouter = express.Router();

SiteRouter.get('/alo', (req: Request, res: Response) => {
    res.send('Hello, world');
});


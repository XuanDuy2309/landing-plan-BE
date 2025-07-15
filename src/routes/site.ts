import express from 'express';
import { DashboardController } from '../controllers';
import { authMiddleware } from '../middleware';

export const SiteRouter = express.Router();
const controller = new DashboardController()

SiteRouter.get('/dashboard-sumary', authMiddleware, controller.getDashboardStats);


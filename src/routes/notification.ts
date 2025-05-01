import express from "express";
import { NotificationController } from "../controllers";
import { authMiddleware } from "../middleware";

export const NotificationRouter = express.Router();
const notificationController = new NotificationController();

NotificationRouter.get("/", authMiddleware, notificationController.getAllByUserId);
NotificationRouter.put("/read_all", authMiddleware, notificationController.readAllNotification);
NotificationRouter.put("/:id", authMiddleware, notificationController.readNotification);
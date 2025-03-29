import express from "express";
import { AuthController } from "../controllers";
import { authMiddleware, upload } from "../middleware";

export const AuthRouter = express.Router();
const authController = new AuthController();
AuthRouter.post('/upload', authMiddleware, upload.array('files'), authController.upload);
AuthRouter.get('/list_upload', authMiddleware, authController.getListMedia);
AuthRouter.get('/list_upload/:id', authController.getListMediaByID);
AuthRouter.delete('/delete/:id', authMiddleware, authController.delete);
AuthRouter.get('/list_video', authMiddleware, authController.getListMedia);
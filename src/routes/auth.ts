import express, { Request, Response } from "express";
import { AuthController, UserController } from "../controllers";
import multer from "multer";
import { authMiddleware, upload } from "../middleware";

export const AuthRouter = express.Router();
const authController = new AuthController();
AuthRouter.post('/upload_image', authMiddleware, upload.single('image'), authController.uploadImage);
AuthRouter.post('/upload_images', authMiddleware, upload.array('images', 10), authController.saveListImage);
AuthRouter.post('/upload_videos', authMiddleware, upload.array('videos', 10), authController.saveListVideo);
AuthRouter.get('/list_image', authMiddleware, authController.getAllImage);
AuthRouter.delete('/delete_image/:id', authMiddleware, authController.deleteImage);
AuthRouter.post('/upload_video', authMiddleware, upload.single('video'), authController.uploadVideo);
AuthRouter.get('/list_video', authMiddleware, authController.getAllVideo);
AuthRouter.delete('/delete_video/:id', authMiddleware, authController.deleteVideo);
AuthRouter.get('/list_video_by_user/:id', authController.getAllVideoByID);
AuthRouter.get('/list_image_by_user/:id', authController.getAllImageByID);
import express, { Request, Response } from "express";
import { AuthController, UserController } from "../controllers";
import multer from "multer";
import { authMiddleware, upload } from "../middleware";

export const AuthRouter = express.Router();
const authController = new AuthController();
AuthRouter.post('/upload_image', authMiddleware, upload.single('image'), authController.uploadImage);
AuthRouter.get('/list_image', authMiddleware, authController.index);
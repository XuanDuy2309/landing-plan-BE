import express, { Request, Response } from "express";
import { UserController } from "../controllers";
import { authMiddleware } from "../middleware";
import { upload } from "../middleware";

export const UserRouter = express.Router();
const userController = new UserController();

UserRouter.get('/', authMiddleware, userController.index);
UserRouter.get('/profile', authMiddleware, userController.getProfile);
UserRouter.get('/:id', authMiddleware, userController.getUserById);
UserRouter.post('/register', upload.single('avatar'), userController.create);
UserRouter.post('/login', userController.login);
UserRouter.put('/update', upload.single('avatar'), authMiddleware, userController.updateInfo);
UserRouter.put('/change_password', authMiddleware, userController.changePassword);
UserRouter.put('/change_avatar', upload.single('avatar'), authMiddleware, userController.changeAvatar);
UserRouter.put('/change_background', upload.single('background'), authMiddleware, userController.changeBackground);
UserRouter.delete('/delete_background', authMiddleware, userController.deleteBackground);
UserRouter.delete('/delete_avatar', authMiddleware, userController.deleteAvatar);
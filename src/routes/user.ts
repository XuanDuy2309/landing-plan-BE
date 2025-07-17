import express from "express";
import { UserController } from "../controllers";
import { authMiddleware, upload } from "../middleware";

export const UserRouter = express.Router();
const userController = new UserController();

UserRouter.get('/', authMiddleware, userController.index);
UserRouter.get('/profile', authMiddleware, userController.getProfile);
UserRouter.get('/check_follow', authMiddleware, userController.checkFollow);
UserRouter.get('/followers', authMiddleware, userController.getListFollowers);
UserRouter.get('/followings', authMiddleware, userController.getListFollowings);
UserRouter.get('/:id', authMiddleware, userController.getUserById);
UserRouter.post('/follow', authMiddleware, userController.follow);
UserRouter.post('/register', upload.single('avatar'), userController.create);
UserRouter.post('/login', userController.login);
UserRouter.put('/update', upload.single('avatar'), authMiddleware, userController.updateInfo);
UserRouter.put('/update/:id', upload.single('avatar'), authMiddleware, userController.update);
UserRouter.put('/change_password', authMiddleware, userController.changePassword);
UserRouter.put('/change_avatar', upload.single('avatar'), authMiddleware, userController.changeAvatar);
UserRouter.put('/change_background', upload.single('background'), authMiddleware, userController.changeBackground);
UserRouter.delete('/delete_background', authMiddleware, userController.deleteBackground);
UserRouter.delete('/delete_avatar', authMiddleware, userController.deleteAvatar);
UserRouter.delete('/follow/:id', authMiddleware, userController.unfollow);
UserRouter.put('/toggle_status', authMiddleware, userController.toggleStatus)

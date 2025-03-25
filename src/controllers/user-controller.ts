import { access } from "fs";
import { UserModel } from "../models";
import { AuthController } from "./auth-controller";
import bcrypt from "bcrypt";

export class UserController {
    async index(req: any, res: any) {
        const user = new UserModel();
        const data = await user.getAll();
        res.status(200).json(data);
    }

    async getUserById(req: any, res: any) {
        const user = new UserModel();
        const data = await user.findUserById(req.params.id);
        res.status(200).json(data);
    }

    async getProfile(req: any, res: any) {
        const { user } = req;
        if (!user) {
            return res.status(400).json({ message: 'authentication failed' });
        }
        const userTemp = new UserModel();
        const auth = new AuthController();
        const data = await userTemp.findUserById(user.id);
        if (data.status && data.data) {
            const access_token = await auth.generateToken(data.data);
            return res.status(200).json(
                {
                    data: {
                        ...data.data,
                        access_token: access_token
                    }, status: true, message: "success"
                }
            );
        }
        return res.status(400).json(data);
    }

    async create(req: any, res: any) {
        const { username, password, confirm_password, fullname, phone_number, address, dob, gender, email, avatar, role, status } = req.body;
        if (!username || !password || !fullname || !phone_number || !email || !confirm_password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        if (password !== req.body.confirm_password) {
            return res.status(400).json({ message: 'Password and confirm password do not match' });
        }
        const user = new UserModel();
        const auth = new AuthController();
        user.username = username;
        user.password = password;
        user.fullname = fullname;
        user.phone_number = phone_number;
        user.address = address;
        user.dob = dob;
        user.gender = gender;
        user.email = email;
        user.avatar = avatar;
        user.role = role;
        user.status = status;
        user.confirm_password = confirm_password;
        user.created_at = new Date()
        const check = await user.checkInvalidUser();
        if (check.status) {
            return res.status(400).json({ message: check.message });
        }
        const data = await user.save();
        if (!data?.status) {
            return res.status(400).json(data);
        }
        const access_token = await auth.generateToken(data.data as any);
        res.status(200).json({
            data: {
                ...data.data,
                access_token: access_token,
            },
            status: true,
            message: "success"
        });
    }

    async updateInfo(req: any, res: any) {
        const { user } = req;
        if (!user) {
            return res.status(400).json({ message: 'authentication failed' });
        }
        const { fullname, phone_number, address, dob, gender, email, avatar, role, status } = req.body;
        const userTemp = new UserModel();
        userTemp.id = user.id;
        userTemp.fullname = fullname;
        userTemp.phone_number = phone_number;
        userTemp.address = address;
        userTemp.dob = dob;
        userTemp.gender = gender;
        userTemp.email = email;
        userTemp.avatar = avatar;
        userTemp.role = role;
        userTemp.status = status;
        const data = await userTemp.updateInfo();
        res.status(200).json(data);
    }

    async changePassword(req: any, res: any) {
        const { user } = req;
        if (!user) {
            return res.status(400).json({ message: 'authentication failed' });
        }
        const { old_password, new_password, confirm_password } = req.body;
        const userTemp = new UserModel();
        const resUser = await userTemp.findUserById(user.id);
        if (!resUser.data) {
            return res.status(400).json({ message: 'User not found' });
        }
        bcrypt.compare(old_password, resUser.data?.password!, async (err, result) => {
            if (err) {
                return res.status(400).json({ message: err });
            }
            if (!result) {
                return res.status(400).json({ message: 'Old password is incorrect' });
            }
            if (new_password !== confirm_password) {
                return res.status(400).json({ message: 'New password and confirm password do not match' });
            }
            userTemp.id = user.id;
            const data = await userTemp.changePassword(new_password);
            res.status(200).json(data);
        })
    }

    async changeAvatar(req: any, res: any) {
        const { user } = req;
        const { avatar } = req.body;
        if (!user) {
            return res.status(400).json({ message: 'authentication failed' });
        }
        if (!avatar) {
            return res.status(400).json({ message: 'image not found' });
        }
        const userTemp = new UserModel();
        userTemp.id = user.id;
        const data = await userTemp.changeAvatar(avatar);
        if (!data.status) {
            return res.status(400).json(data);
        }
        res.status(200).json(data);
    }

    async deleteAvatar(req: any, res: any) {
        const { user } = req;
        const userTemp = new UserModel();
        userTemp.id = user.id;
        const data = await userTemp.deleteAvatar();
        res.status(200).json(data);
    }

    async changeBackground(req: any, res: any) {
        const { user } = req;
        const { background } = req.body;
        if (!user) {
            return res.status(400).json({ message: 'authentication failed' });
        }
        if (!background) {
            return res.status(400).json({ message: 'image not found' });
        }
        const userTemp = new UserModel();
        userTemp.id = user.id;
        const data = await userTemp.changeBackground(background);
        if (!data.status) {
            return res.status(400).json(data);
        }
        res.status(200).json(data);
    }

    async deleteBackground(req: any, res: any) {
        const { user } = req;
        const userTemp = new UserModel();
        userTemp.id = user.id;
        const data = await userTemp.deleteBackground();
        res.status(200).json(data);
    }

    async login(req: any, res: any) {
        const { username, password } = req.body;
        const user = new UserModel();
        const auth = new AuthController();
        const resUser: any = await user.getUserByUserName(username);
        if (!resUser) {
            return res.status(400).json({ status: false, message: 'User not found' });
        }
        bcrypt.compare(password, resUser.data?.password!, async (err, result) => {
            if (err) {
                return res.status(400).json({ status: false, message: err });
            }
            if (!result) {
                return res.status(400).json({ status: false, message: 'Password is incorrect' });
            }

            const access_token = await auth.generateToken(resUser.data);
            res.status(200).json({
                data: {
                    ...resUser.data,
                    access_token: access_token
                }, status: true, message: "success"
            });
        })
    }
}
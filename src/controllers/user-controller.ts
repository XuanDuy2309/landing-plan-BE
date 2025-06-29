import bcrypt from "bcrypt";
import { FollowModel, UserModel } from "../models";
import { AuthController } from "./auth-controller";

export class UserController {
    async index(req: any, res: any) {
        const { page, page_size } = req.query
        const user = new UserModel();
        try {
            const data = await user.getAll(page, page_size, { ...req.query });
            return res.status(200).json(data);
        } catch (error) {
            return res.status(400).json(error);
        }
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
        if (!username || !password || !fullname || !phone_number || !confirm_password) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }
        if (password !== req.body.confirm_password) {
            return res.status(400).json({ message: 'Xác nhận mật khẩu không khớp' });
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
            return res.status(400).json({ message: 'Không tìm thấy thông tin user' });
        }
        bcrypt.compare(old_password, resUser.data?.password!, async (err, result) => {
            if (err) {
                return res.status(400).json({ message: err });
            }
            if (!result) {
                return res.status(400).json({ message: 'Mật khẩu không chính xác' });
            }
            if (new_password !== confirm_password) {
                return res.status(400).json({ message: 'Xác nhận mật khẩu không khớp' });
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
            return res.status(400).json({ message: 'Vui lòng tải ảnh lên' });
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
            return res.status(400).json({ message: 'Vui lòng tải ảnh lên' });
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
            return res.status(400).json({ status: false, message: 'Không tìm thấy thông tin user' });
        }
        bcrypt.compare(password, resUser.data?.password!, async (err, result) => {
            if (err) {
                return res.status(400).json({ status: false, message: err });
            }
            if (!result) {
                return res.status(400).json({ status: false, message: 'Mật khẩu không chính xác' });
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

    async follow(req: any, res: any) {
        const { user } = req;
        const { id } = req.body;
        try {
            if (!user) {
                return res.status(400).json({ message: 'authentication failed' });
            }
            if (!id) {
                return res.status(400).json({ message: 'Không tìm thấy thông tin user' });
            }
            const follow = new FollowModel(user.id, id);
            const data = await follow.follow();
            if (!data) {
                return res.status(500).json(
                    {
                        data: data, status: false, message: "errr"
                    }
                );
            }
            return res.status(200).json({
                data: data, status: true, message: "success"
            });
        } catch (error) {
            return res.status(400).json(error);
        }
    }

    async unfollow(req: any, res: any) {
        const { user } = req;
        const { id } = req.params;
        try {
            if (!user) {
                return res.status(400).json({ message: 'authentication failed' });
            }
            if (!id) {
                return res.status(400).json({ message: 'Không tìm thấy thông tin user' });
            }
            const follow = new FollowModel(user.id, id);
            const data = await follow.unfollow();
            if (!data) {
                return res.status(500).json(
                    {
                        data: true, status: false, message: "errr"
                    }
                );
            }
            return res.status(200).json({
                data: false, status: true, message: "success"
            });
        } catch (error) {
            return res.status(400).json(error);
        }
    }

    async checkFollow(req: any, res: any) {
        const { user } = req;
        const { id } = req.query;
        try {
            if (!user) {
                return res.status(400).json({ message: 'authentication failed' });
            }
            if (!id) {
                return res.status(400).json({ message: 'Không tìm thấy thông tin user' });
            }
            const follow = new FollowModel(user.id, id);
            const data = await follow.isFollowing();
            return res.status(200).json({
                data: data, status: true, message: "success"
            });
        } catch (error) {
            return res.status(400).json(error);
        }
    }

    async getListFollowers(req: any, res: any) {
        const { user } = req;
        const { user_id } = req.query;
        try {
            if (!user) {
                return res.status(400).json({ message: 'authentication failed' });
            }
            const follow = new FollowModel();
            const data = await follow.getFollowers(user_id ? user_id : user.id);
            if (!data) {
                return res.status(500).json(
                    {
                        data: data, status: false, message: "errr"
                    }
                );
            }
            return res.status(200).json({
                data: data, status: true, message: "success"
            });
        } catch (error) {
            return res.status(400).json(error);
        }
    }

    async getListFollowings(req: any, res: any) {
        const { user } = req;
        const { user_id } = req.query;
        try {
            if (!user) {
                return res.status(400).json({ message: 'authentication failed' });
            }
            const follow = new FollowModel();
            const data = await follow.getFollowings(user_id ? user_id : user.id);
            if (!data) {
                return res.status(500).json(
                    {
                        data: data, status: false, message: "errr"
                    }
                );
            }
            return res.status(200).json({
                data: data, status: true, message: "success"
            });
        } catch (error) {
            return res.status(400).json(error);
        }
    }
}

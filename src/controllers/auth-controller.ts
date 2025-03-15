
import jwt from 'jsonwebtoken';
import { Role, UserModel } from '../models';
import { ImageModel } from '../models/image-model';

export class AuthController {

    async generateToken(user: UserModel) {
        try {
            const secret = process.env.JWT_SECRET || "default_access_secret";
            return jwt.sign({ id: user.id, username: user.username }, secret, {
                expiresIn: "7d",
            });
        } catch (err) {
            return ''
        }
    }

    async uploadImage(req: any, res: any) {
        const { user, file } = req;
        if (!user) {
            return res.status(400).json({ message: 'authentication failed' });
        }
        if (!file) {
            return res.status(400).json({ message: 'File not found' });
        }
        const link = `${req.protocol}://${req.get("host")}/uploads/${file.filename
            }`;
        const image = new ImageModel();
        const data = await image.save(link, user.id);
        if (!data.status) {
            return res.status(400).json(data);
        }
        res.status(200).json(data);
    }

    async index(req: any, res: any) {
        const { user } = req
        const image = new ImageModel();
        const data = await image.getAll(user.id);
        res.status(200).json(data);
    }
}
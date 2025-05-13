
import jwt from 'jsonwebtoken';
import { UserModel } from '../models';
import { UploadModel } from '../models/uploads-model';

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

    async upload(req: any, res: any) {
        const { user, files } = req;
        const { type } = req.body
        if (!user) {
            return res.status(400).json({ message: 'authentication failed' });
        }
        if (!files || files.length == 0) {
            return res.status(400).json({ message: 'File not found' });
        }
        const listLinks = files.map((file: any) => {
            return `${req.protocol}://${req.get("host")}/uploads/${file.filename
                }`;
        })
        const image = new UploadModel();
        const data = await image.upload(listLinks, user.id, type);
        if (!data.status) {
            return res.status(400).json(data);
        }
        res.status(200).json(data);
    }

    async getListMedia(req: any, res: any) {
        const { user } = req
        const { type } = req.query
        const image = new UploadModel();
        const data = await image.getListMediaByUserID(user.id, type);
        res.status(200).json(data);
    }

    async getListMediaByID(req: any, res: any) {
        const { id } = req.params
        const { type } = req.query
        const image = new UploadModel();
        const data = await image.getListMediaByUserID(id, type);
        res.status(200).json(data);
    }

    async delete(req: any, res: any) {
        const { id } = req.params
        const image = new UploadModel();
        const data = await image.delete(id);
        res.status(200).json(data);
    }
}
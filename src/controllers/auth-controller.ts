
import jwt from 'jsonwebtoken';
import { Role, UserModel } from '../models';
import { ImageModel } from '../models/uploads-model';

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
        const data = await image.saveImage(link, user.id);
        if (!data.status) {
            return res.status(400).json(data);
        }
        res.status(200).json(data);
    }

    async saveListImage(req: any, res: any) {
        const { user, files } = req;
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
        const image = new ImageModel();
        const data = await image.saveListImage(listLinks, user.id);
        if (!data.status) {
            return res.status(400).json(data);
        }
        res.status(200).json(data);
    }

    async saveListVideo(req: any, res: any) {
        const { user, files } = req;
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
        const image = new ImageModel();
        const data = await image.saveListVideo(listLinks, user.id);
        if (!data.status) {
            return res.status(400).json(data);
        }
        res.status(200).json(data);
    }

    async getAllImage(req: any, res: any) {
        const { user } = req
        const image = new ImageModel();
        const data = await image.getAllImageByUserID(user.id);
        res.status(200).json(data);
    }

    async getAllImageByID(req: any, res: any) {
        const { id } = req.params
        const image = new ImageModel();
        const data = await image.getAllImageByUserID(id);
        res.status(200).json(data);
    }

    async deleteImage(req: any, res: any) {
        const { id } = req.params
        const image = new ImageModel();
        const data = await image.deleteImage(id);
        res.status(200).json(data);
    }

    async getAllVideoByUserID(req: any, res: any) {
        const { id } = req.params
        const image = new ImageModel();
        const data = await image.getAllVideoByUserID(id);
        res.status(200).json(data);
    }

    async deleteVideo(req: any, res: any) {
        const { id } = req.params
        const image = new ImageModel();
        const data = await image.deleteVideo(id);
        res.status(200).json(data);
    }

    async uploadVideo(req: any, res: any) {
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
        const data = await image.saveVideo(link, user.id);
        res.status(200).json(data);
    }

    async getAllVideo(req: any, res: any) {
        const { user } = req
        const image = new ImageModel();
        const data = await image.getAllVideoByUserID(user.id);
        res.status(200).json(data);
    }

    async getAllVideoByID(req: any, res: any) {
        const { id } = req.params
        const image = new ImageModel();
        const data = await image.getAllVideoByUserID(id);
        res.status(200).json(data);
    }
}
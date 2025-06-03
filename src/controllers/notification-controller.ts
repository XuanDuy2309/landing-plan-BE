import { NotificationModel } from "../models";

export class NotificationController {
    async getAllByUserId(req: any, res: any) {
        const { user } = req;
        const { page, page_size } = req.query;
        const notification = new NotificationModel();
        const data = await notification.getAllByUserId(user.id, page, page_size, { ...req.query });
        return res.status(200).json(data);
    }

    async create(req: any, res: any) {
        const { user } = req;
        const { post_id, type } = req.body;
        if (!post_id || !type) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }
        const notification = new NotificationModel();
        Object.assign(notification, req.body);
        const data = await notification.create();
        return res.status(200).json(data);
    }

    async readNotification(req: any, res: any) {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Id không được để trống' });
        }
        const notification = new NotificationModel();
        notification.id = Number(id);
        const data = await notification.readNotification();
        return res.status(200).json(data);
    }

    async readAllNotification(req: any, res: any) {
        const { user } = req;
        if (!user) {
            return res.status(400).json({ message: 'authentication failed' });
        }
        const notification = new NotificationModel();
        notification.receiver_id = Number(user.id);
        const data = await notification.readAllNotification();
        return res.status(200).json(data);
    }
}
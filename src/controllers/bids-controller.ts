import { BidsModel, NotificationModel, NotificationType, PostLikeModel, PostModel, UserModel } from "../models";
import { socketService } from "../service";

export class BidsController {
    async getAllByPostId(req: any, res: any) {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Id bài viết không được để trống' });
        }
        const post = new BidsModel();
        const data = await post.getAllByPostId(Number(id));
        return res.status(200).json(data);
    }

    async create(req: any, res: any) {
        const { user } = req;
        const { post_id, price } = req.body;

        const postId = Number(post_id);
        const bidPrice = Number(price);

        if (!postId || !bidPrice || bidPrice <= 0) {
            return res.status(400).json({ message: 'Thiếu thông tin' });
        }

        const bid = new BidsModel();
        const post = new PostModel();
        const notification = new NotificationModel();
        bid.post_id = postId;
        bid.user_id = user.id;
        bid.price = bidPrice;

        try {
            const data = await bid.create();
            if (!data.status) {
                return res.status(400).json(data);
            }

            const postData: any = await post.getDetailPost(postId);
            if (!postData.status) {
                return res.status(404).json(postData);
            }
            const post_like = new PostLikeModel();
            const likesData: any = await post_like.getAllByPostId(postId);
            const likedUserIds = likesData.data?.map((like: any) => like.create_by_id) || [];

            const userModel = new UserModel();
            const userInfo: any = await userModel.findUserById(user.id);

            const notifications = likedUserIds
                .filter((id: number) => id !== user.id && id !== postData.data.create_by_id)
                .map((receiverId: number) => {
                    const notif = new NotificationModel();
                    const message = `${userInfo.data.fullname} đã đặt giá mới.`;

                    notif.post_id = postId;
                    notif.receiver_id = receiverId;
                    notif.sender_id = user.id;
                    notif.type = NotificationType.SET_BID;
                    notif.message = message;

                    socketService.emitToUser(receiverId, 'notification', {
                        post_id: postId,
                        sender_id: user.id,
                        message,
                    });

                    return notif.create();
                });

            await Promise.all(notifications);

            // Emit to room using the new method
            socketService.emitToAll('bid_create', {
                post_id: postId,
                user_id: user.id,
                price: bidPrice,
                message: `${userInfo.data.fullname} đã đặt giá mới.`,
            });

            notification.type = NotificationType.SET_BID;
            notification.post_id = postId;
            notification.sender_id = user.id;
            notification.receiver_id = postData.data.create_by_id;
            notification.message = `${userInfo.data.fullname} đã đặt giá mới trên bài đấu giá của bạn.`;
            await notification.create()
                .then((res) => {
                    socketService.emitToUser(postData.data.create_by_id, 'notification', {
                        ...notification
                    });
                }).catch((err) => console.log(err));

            return res.status(200).json(data);
        } catch (err: any) {
            return res.status(500).json({ message: err.message || 'An error occurred' });
        }
    }

}
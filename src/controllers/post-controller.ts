
import { NotificationModel, NotificationType, PostLikeModel, PostModel, PostSharingModel, UserModel } from "../models";
import { socketService } from "../service";


export class PostController {
    async index(req: any, res: any) {
        const { page, page_size, purpose } = req.query;
        const post = new PostModel();
        try {
            const data: any = await post.getAll(page, page_size, { ...req.query });
            return res.status(200).json(data);
        } catch (err: any) {
            return res.status(400).json({ message: err.message || 'Failed to fetch posts' });
        }
    }

    async show(req: any, res: any) {
        try {
            const { id } = req.params;

            const post = new PostModel();
            const likeModel = new PostLikeModel();
            const shareModel = new PostSharingModel();

            // Get post details
            const postData: any = await post.getDetailPost(id);
            if (!postData || !postData.data) {
                return res.status(404).json(postData);
            }

            // Get like and share counts
            const likeCount: any = await likeModel.getAllByPostId(id);
            const shareCount: any = await shareModel.getAllByPostId(id);
            return res.status(200).json({
                data: {
                    ...postData.data,
                    like_count: likeCount.data ? likeCount.data.map((like: any) => like.create_by_id) : 0,
                    share_count: shareCount.data ? shareCount.data.length : 0
                },
                status: postData.status,
                message: postData.message
            });
        } catch (err: any) {
            return res.status(400).json({ message: err.errors || 'Invalid post ID' });
        }
    }

    async store(req: any, res: any) {
        const { user } = req;
        try {
            const post = new PostModel();
            Object.assign(post, req.body);
            post.create_by_id = user.id;
            const data = await post.createPost();
            return res.status(200).json(data);
        } catch (err: any) {
            return res.status(400).json({ message: err.errors || 'Invalid data' });
        }
    }

    async update(req: any, res: any) {
        const { id } = req.params;
        try {
            const post = new PostModel();
            Object.assign(post, req.body);
            if (!id) {
                return res.status(400).json({ message: 'Id không được để trống' });
            }
            post.id = Number(id);
            const data = await post.updatePost();
            return res.status(200).json(data);
        } catch (err: any) {
            return res.status(400).json({ message: err.errors || 'Invalid data' });
        }
    }

    async delete(req: any, res: any) {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Id không được để trống' });
        }
        const post = new PostModel();
        post.id = Number(id);
        const data = await post.deletePost();
        return res.status(200).json(data);
    }

    async sharePost(req: any, res: any) {
        const { id } = req.params;
        const { user } = req;
        if (!id) {
            return res.status(400).json({ message: 'Id không được để trống' });
        }
        const post = new PostSharingModel();
        post.post_id = Number(id);
        post.create_by_id = user.id;
        const data = await post.create();
        return res.status(200).json(data);
    }

    async likePost(req: any, res: any) {
        const { id } = req.params;
        const { user } = req;

        if (!id) {
            return res.status(400).json({ message: 'Id không được để trống' });
        }

        const postLike = new PostLikeModel();
        const post = new PostModel();
        const notification = new NotificationModel();
        const userModel = new UserModel();

        try {
            const userData: any = await userModel.findUserById(user.id);
            const postData: any = await post.getDetailPost(Number(id));
            if (!postData.status) {
                return res.status(404).json(postData);
            }

            // 🔒 Kiểm tra xem đã like chưa
            const existed = await postLike.findOne({ post_id: Number(id), create_by_id: user.id });
            if (existed) {
                return res.status(200).json(existed);
            }

            // Thêm like
            postLike.post_id = Number(id);
            postLike.create_by_id = user.id;
            const likeData = await postLike.create();

            if (!likeData.status) {
                return res.status(400).json(likeData);
            }

            // Gửi thông báo
            notification.post_id = Number(id);
            notification.receiver_id = postData.data.create_by_id;
            notification.type = NotificationType.LIKE;
            notification.sender_id = user.id;
            notification.message = `${userData.data.fullname} đã thích bài viết của bạn.`;
            await notification.create();

            socketService.emitToUser(notification.receiver_id || 0, 'notification', {
                ...notification
            });

            return res.status(200).json(likeData);
        } catch (err: any) {
            return res.status(500).json({ message: err.message || 'An error occurred' });
        }
    }


    async unlikePost(req: any, res: any) {
        const { id } = req.params;
        const { user } = req;
        if (!id) {
            return res.status(400).json({ message: 'Id không được để trống' });
        }
        const post = new PostLikeModel();
        post.post_id = Number(id);
        post.create_by_id = user.id;
        const data = await post.delete();
        return res.status(200).json(data);
    }

    async getPostLikes(req: any, res: any) {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Id không được để trống' });
        }
        const postLike = new PostLikeModel();
        const data = await postLike.getAllByPostId(Number(id));
        return res.status(200).json(data);
    }

    async getPostFolowings(req: any, res: any) {
        const { page, page_size, purpose } = req.query;
        const { user } = req;
        const post = new PostModel();
        try {
            const data: any = await post.getLikedAndSharedPosts(user.id, page, page_size, { ...req.query });
            return res.status(200).json(data);
        } catch (err: any) {
            return res.status(400).json({ message: err.message || 'Failed to fetch posts' });
        }
    }

    async checkLiked(req: any, res: any) {
        const { id } = req.params;
        const { user } = req;
        if (!id) {
            return res.status(400).json({ message: 'Id không được để trống' });
        }
        const postLike = new PostLikeModel();
        const data = await postLike.findOne({ post_id: Number(id), create_by_id: user.id });
        return res.status(200).json(data);
    }
}
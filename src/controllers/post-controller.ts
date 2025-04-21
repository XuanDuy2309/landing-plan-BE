
import { io } from "..";
import { PostLikeModel, PostModel, PostSharingModel, UserModel } from "../models";


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
                return res.status(404).json({ message: 'Post not found' });
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
                return res.status(400).json({ message: 'id not found' });
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
            return res.status(400).json({ message: 'id not found' });
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
            return res.status(400).json({ message: 'id not found' });
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
            return res.status(400).json({ message: 'id not found' });
        }

        const post = new PostLikeModel();
        post.post_id = Number(id);
        post.create_by_id = user.id;

        const data = await post.create();

        io.emit('post_liked', {
            post_id: id,
            user_id: user.id,
            message: `User ${user.id} liked post ${id}`,
        });

        return res.status(200).json(data);
    }

    async unlikePost(req: any, res: any) {
        const { id } = req.params;
        const { user } = req;
        if (!id) {
            return res.status(400).json({ message: 'id not found' });
        }
        const post = new PostLikeModel();
        post.post_id = Number(id);
        post.create_by_id = user.id;
        const data = await post.delete();
        return res.status(200).json(data);
    }


}
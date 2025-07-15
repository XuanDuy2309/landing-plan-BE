import { PostModel, UserModel } from '../models';

export class DashboardController {
    async getDashboardStats(req: any, res: any) {
        try {
            const userModel = new UserModel()
            const postModel = new PostModel()

            const user = await userModel.getCountUser()
            const post = await postModel.getCountPost()

            let result = {
                number_auction: 0,
                number_new_post: 0,
                number_user: 0,
            }

            if (user.status) {
                result = {
                    ...result,
                    number_user: user.data || 0
                }
            }

            if (post.status) {
                result = {
                    ...result,
                    number_auction: post.data?.postsPurpose || 0,
                    number_new_post: post.data?.postsStatus || 0
                }
            }

            return res.status(200).json({
                data: {
                    ...result
                },
                status: true,
                message: 'ok'
            });
        } catch (error: any) {
            return res.status(500).json({ status: false, message: error.message });
        }
    }
}
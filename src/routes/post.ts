import express from "express";
import { postSchema } from "../config";
import { PostController } from "../controllers";
import { authMiddleware, validateData } from "../middleware";

export const PostRouter = express.Router();
const postController = new PostController();

PostRouter.get("/", authMiddleware, postController.index);
PostRouter.get("/type", authMiddleware, postController.getListLandingTypes);
PostRouter.get("/folowings", authMiddleware, postController.getPostFolowings);
PostRouter.get("/:id", authMiddleware, postController.show);
PostRouter.post("/", authMiddleware, validateData(postSchema), postController.store);
PostRouter.put("/:id", authMiddleware, postController.update);
PostRouter.delete("/:id", authMiddleware, postController.delete);
PostRouter.get("/:id/like", authMiddleware, postController.checkLiked);
PostRouter.post("/share/:id", authMiddleware, postController.sharePost);
PostRouter.post("/like/:id", authMiddleware, postController.likePost);
PostRouter.delete("/like/:id", authMiddleware, postController.unlikePost);
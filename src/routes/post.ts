import express from "express";
import { PostController } from "../controllers";
import { authMiddleware, validateData } from "../middleware";
import { postSchema } from "../config";

export const PostRouter = express.Router();
const postController = new PostController();

PostRouter.get("/", authMiddleware, postController.index);
PostRouter.get("/:id", authMiddleware, postController.show);
PostRouter.post("/", authMiddleware, validateData(postSchema), postController.store);
PostRouter.put("/:id", authMiddleware, validateData(postSchema), postController.update);
PostRouter.delete("/:id", authMiddleware, postController.delete);
PostRouter.post("/share/:id", authMiddleware, postController.sharePost);
PostRouter.post("/like/:id", authMiddleware, postController.likePost);
PostRouter.delete("/like/:id", authMiddleware, postController.unlikePost);
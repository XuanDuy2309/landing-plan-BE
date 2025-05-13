import { Router } from "express";
import { ConversationsController } from "../controllers";
import { authMiddleware } from "../middleware";

const ConversationRouter = Router();
const conversationsController = new ConversationsController();

ConversationRouter.get("/", authMiddleware, conversationsController.index);
ConversationRouter.get("/:id", authMiddleware, conversationsController.store);
ConversationRouter.get("/:id/messages", authMiddleware, conversationsController.getMessagesInConversation);
ConversationRouter.post("/", authMiddleware, conversationsController.create);
ConversationRouter.post("/:id/messages", authMiddleware, conversationsController.sendMessagesInConversation);
ConversationRouter.put("/:id/members", authMiddleware, conversationsController.updateMember);
ConversationRouter.put("/:id/name", authMiddleware, conversationsController.updateNameGroupConversation);
ConversationRouter.delete("/:id", authMiddleware, conversationsController.leaveConversation);
ConversationRouter.delete("/:id/members/:user_id", authMiddleware, conversationsController.deleteMemberInGroupConversation);
ConversationRouter.delete("/:id/messages/:user_id", authMiddleware, conversationsController.deleteMessagesInConversation);

export default ConversationRouter;

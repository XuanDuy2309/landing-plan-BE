import { Router } from "express";
import { ChatBotController } from "../controllers";

const ChatbotRouter = Router();
const coordinatesLocationControllerInstance = new ChatBotController();

ChatbotRouter.post('/chat', ChatBotController.chat);

export default ChatbotRouter;

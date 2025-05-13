import { Router } from 'express';
import { ConversationsController } from '../controllers';
import { authMiddleware } from '../middleware';

const router = Router();
const controller = new ConversationsController();

// Basic conversation routes
router.get('/', authMiddleware, controller.getConversations.bind(controller));
router.get('/:conversationId', authMiddleware, controller.getDetailConversation.bind(controller));
router.post('/', authMiddleware, controller.createConversation.bind(controller));
router.post('/:conversationId/members', authMiddleware, controller.addMembersToGroup.bind(controller));

// Message routes
router.get('/:conversationId/messages', authMiddleware, controller.getMessages.bind(controller));
router.post('/:conversationId/messages', authMiddleware, controller.sendMessage.bind(controller));
router.put('/:conversationId/messages/:messageId', authMiddleware, controller.editMessage.bind(controller));
router.delete('/:conversationId/messages/:messageId', authMiddleware, controller.deleteMessage.bind(controller));

// Mention routes
router.get('/mentions', authMiddleware, controller.getMentionedMessages.bind(controller));
router.get('/:conversationId/mentions', authMiddleware, controller.getMentionedMessages.bind(controller));
router.get('/:conversationId/mentions/users', authMiddleware, controller.searchMentionUsers.bind(controller));

export default router;

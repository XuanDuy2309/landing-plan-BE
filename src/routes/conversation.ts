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

// Member management routes
router.get('/:conversationId/users', authMiddleware, controller.getListMentionUsers.bind(controller));
router.delete('/:conversationId/members/:memberId', authMiddleware, controller.removeMemberFromGroup.bind(controller));
router.patch('/:conversationId/members/:memberId/role', authMiddleware, controller.updateMemberRole.bind(controller));

// Conversation settings routes
router.patch('/:conversationId/settings', authMiddleware, controller.updateConversationSettings.bind(controller));
router.patch('/:conversationId/last-seen', authMiddleware, controller.updateLastSeen.bind(controller));

// Message routes
router.get('/:conversationId/messages', authMiddleware, controller.getMessages.bind(controller));
router.post('/:conversationId/messages', authMiddleware, controller.sendMessage.bind(controller));
router.put('/:conversationId/messages/:messageId', authMiddleware, controller.editMessage.bind(controller));
router.delete('/:conversationId/messages/:messageId', authMiddleware, controller.deleteMessage.bind(controller));

// Mention routes
router.get('/:conversationId/mentions', authMiddleware, controller.getMentionedMessages.bind(controller));

export default router;

import pool from '../config/db';
import { ConversationMemberModel, ConversationsModel, MessageModel } from "../models";
import { MemberRole } from "../models/conversation-member-model";
import { ConversationType } from "../models/conversations-model";
import { MessageType } from "../models/message-model";
import { socketService } from "../service";

export class ConversationsController {
    async createConversation(req: any, res: any) {
        try {
            const { name, type, members } = req.body;
            const { user } = req;

            // Validate request
            if (type === ConversationType.GROUP && !name) {
                return res.status(400).json({
                    status: false,
                    message: 'Group name is required'
                });
            }

            if (!members || members.length === 0) {
                return res.status(400).json({
                    status: false,
                    message: 'At least one member is required'
                });
            }

            // For direct chat, check if conversation already exists
            if (type === ConversationType.DIRECT) {
                const conversation = new ConversationsModel();
                const existingConversation = await conversation.findDirectChat(user.id, members[0]);
                if (existingConversation.status && existingConversation.data) {
                    return res.status(200).json(existingConversation);
                }
            }

            // Create conversation
            const conversation = new ConversationsModel();
            conversation.name = name;
            conversation.type = type;
            const result = await conversation.create();

            if (!result.status || !result.data) {
                return res.status(400).json(result);
            }

            // Add members including the creator
            const allMembers = [...new Set([...members, user.id])];
            await this.addMembersToConversation(result.data.id, allMembers, user.id);

            // Get complete conversation data
            const conversationData = await conversation.getById(result.data.id);

            return res.status(200).json(conversationData);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getConversations(req: any, res: any) {
        try {
            const { user } = req;
            const { page = 1, page_size = 20, query } = req.query;

            const member = new ConversationMemberModel();
            const result = await member.getConversationsByUserId(
                user.id,
                parseInt(page),
                parseInt(page_size),
                query
            );

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getMessages(req: any, res: any) {
        try {
            const { conversationId } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const { user } = req;

            // Check if user is member of conversation
            const member = new ConversationMemberModel();
            const isMember = await member.isMember(parseInt(conversationId), user.id);

            if (!isMember.data) {
                return res.status(403).json({
                    status: false,
                    message: 'You are not a member of this conversation'
                });
            }

            const message = new MessageModel();
            const result = await message.getMessagesByConversationId(
                parseInt(conversationId),
                parseInt(page),
                parseInt(limit)
            );

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async sendMessage(req: any, res: any) {
        try {
            const { conversationId } = req.params;
            const { content, type = MessageType.TEXT, replyId } = req.body;
            const { user } = req;

            // Check if user is member of conversation
            const member = new ConversationMemberModel();
            const isMember = await member.isMember(parseInt(conversationId), user.id);

            if (!isMember.data) {
                return res.status(403).json({
                    status: false,
                    message: 'You are not a member of this conversation'
                });
            }

            // Create message
            const message = new MessageModel();
            message.conversation_id = parseInt(conversationId);
            message.sender_id = user.id;
            message.content = content;
            message.type = type;
            message.reply_id = replyId;

            const result = await message.create();

            if (!result.status || !result.data) {
                return res.status(400).json(result);
            }

            // Update conversation last message time
            const conversation = new ConversationsModel();
            await conversation.updateLastMessage(parseInt(conversationId));

            // Emit message to conversation room
            const messageData = {
                ...result.data,
                sender_name: user.full_name,
                sender_avatar: user.avatar
            };

            socketService.emitToConversation(conversationId, 'new_message', messageData);

            // Send mention notifications to mentioned use

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async editMessage(req: any, res: any) {
        try {
            const { conversationId, messageId } = req.params;
            const { content, type = MessageType.TEXT } = req.body;
            const { user } = req;

            const message = new MessageModel();
            const messageData = await message.edit(parseInt(messageId), content, type);

            if (!messageData.status) {
                return res.status(400).json(messageData);
            }

            // Notify other members about the edit
            socketService.emitToConversation(conversationId, 'message_edited', {
                ...messageData.data,
                sender_name: user.full_name,
                sender_avatar: user.avatar
            }, user.id);

            return res.status(200).json(messageData);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async deleteMessage(req: any, res: any) {
        try {
            const { conversationId, messageId } = req.params;
            const { user } = req;

            const message = new MessageModel();
            const result = await message.delete(parseInt(messageId));

            if (!result.status) {
                return res.status(400).json(result);
            }

            // Notify other members about the deletion
            socketService.emitToConversation(conversationId, 'message_deleted', {
                messageId,
                conversationId,
                userId: user.id
            }, user.id);

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async searchMessages(req: any, res: any) {
        try {
            const { conversationId } = req.params;
            const { query } = req.query;
            const { user } = req;

            const message = new MessageModel();
            const result = await message.searchMessages(parseInt(conversationId), query);

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async initiateCall(req: any, res: any) {
        try {
            const { conversationId } = req.params;
            const { type = MessageType.AUDIO_CALL } = req.body;
            const { user } = req;

            // Create a call message
            const message = new MessageModel();
            message.conversation_id = parseInt(conversationId);
            message.sender_id = user.id;
            message.type = type;
            message.content = `${type === MessageType.AUDIO_CALL ? 'Audio' : 'Video'} call`;

            const result = await message.create();

            if (!result.status) {
                return res.status(400).json(result);
            }

            // Notify other members about the call
            socketService.emitToConversation(conversationId, 'call_initiated', {
                ...result.data,
                sender_name: user.full_name,
                sender_avatar: user.avatar
            }, user.id);

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async addMembersToGroup(req: any, res: any) {
        try {
            const { conversationId } = req.params;
            const { memberIds } = req.body;
            const { user } = req;

            if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
                return res.status(400).json({
                    status: false,
                    message: 'Member IDs are required'
                });
            }

            // Kiểm tra xem người dùng hiện tại có phải là admin của nhóm không
            const member = new ConversationMemberModel();
            const memberData = await member.getMemberRole(parseInt(conversationId), user.id);

            if (!memberData.data || memberData.data.role !== MemberRole.ADMIN) {
                return res.status(403).json({
                    status: false,
                    message: 'Only group admin can add members'
                });
            }

            // Kiểm tra xem có phải là group conversation không
            const conversation = new ConversationsModel();
            const conversationData = await conversation.getById(parseInt(conversationId));

            if (!conversationData.data || conversationData.data.type !== ConversationType.GROUP) {
                return res.status(400).json({
                    status: false,
                    message: 'This is not a group conversation'
                });
            }

            // Thêm các thành viên mới
            const addedMembers = await this.addMembersToConversation(parseInt(conversationId), memberIds);

            // Lấy thông tin chi tiết của các thành viên mới
            const newMembersData = await member.getMembersByConversationId(parseInt(conversationId));
            if (!newMembersData.status || !newMembersData.data) {
                return res.status(500).json({
                    status: false,
                    message: 'Failed to get members information'
                });
            }

            const newMembers = newMembersData.data.filter((m: any) => memberIds.includes(m.user_id));

            // Thông báo cho các thành viên hiện tại về việc có thành viên mới
            socketService.emitToConversation(conversationId, 'members_added', {
                conversationId: parseInt(conversationId),
                addedBy: {
                    id: user.id,
                    name: user.fullname,
                    avatar: user.avatar
                },
                newMembers
            });

            // Gửi thông báo cho các thành viên mới
            memberIds.forEach(memberId => {
                socketService.emitToUser(memberId, 'added_to_conversation', {
                    conversation: conversationData.data,
                    addedBy: {
                        id: user.id,
                        name: user.fullname,
                        avatar: user.avatar
                    }
                });
            });

            return res.status(200).json({
                status: true,
                data: newMembers,
                message: 'Members added successfully'
            });

        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getDetailConversation(req: any, res: any) {
        try {
            const { conversationId } = req.params;
            const { user } = req;

            // Kiểm tra xem người dùng có phải là thành viên của cuộc trò chuyện không
            const member = new ConversationMemberModel();
            const isMember = await member.isMember(parseInt(conversationId), user.id);

            if (!isMember.data) {
                return res.status(403).json({
                    status: false,
                    message: 'You are not a member of this conversation'
                });
            }

            const conversation = new ConversationsModel();
            const result = await conversation.getById(parseInt(conversationId));

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async updateConversationSettings(req: any, res: any) {
        try {
            const { conversationId } = req.params;
            const { muteDuration } = req.body;
            const { user } = req;

            const member = new ConversationMemberModel();

            // Kiểm tra xem người dùng có trong cuộc trò chuyện không
            const isMember = await member.isMember(parseInt(conversationId), user.id);
            if (!isMember.data) {
                return res.status(403).json({
                    status: false,
                    message: 'You are not a member of this conversation'
                });
            }

            // Cập nhật cài đặt tắt thông báo
            const result = await member.updateMuteSetting(parseInt(conversationId), user.id, muteDuration);

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async removeMemberFromGroup(req: any, res: any) {
        try {
            const { conversationId, memberId } = req.params;
            const { user } = req;

            const member = new ConversationMemberModel();

            // Kiểm tra quyền admin
            const isAdmin = await member.isAdmin(parseInt(conversationId), user.id);
            if (!isAdmin.data) {
                return res.status(403).json({
                    status: false,
                    message: 'Only admin can remove members'
                });
            }

            const result = await member.removeMember(parseInt(conversationId), parseInt(memberId));
            if (result.status) {
                // Thông báo cho các thành viên khác
                socketService.emitToConversation(conversationId, 'member_removed', {
                    conversationId: parseInt(conversationId),
                    removedBy: {
                        id: user.id,
                        name: user.fullname,
                        avatar: user.avatar
                    },
                    removedMemberId: parseInt(memberId)
                });

                // Thông báo cho thành viên bị xóa
                socketService.emitToUser(memberId, 'removed_from_conversation', {
                    conversationId: parseInt(conversationId),
                    removedBy: {
                        id: user.id,
                        name: user.fullname,
                        avatar: user.avatar
                    }
                });
            }

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async updateMemberRole(req: any, res: any) {
        try {
            const { conversationId, memberId } = req.params;
            const { role } = req.body;
            const { user } = req;

            const member = new ConversationMemberModel();

            // Kiểm tra quyền admin
            const isAdmin = await member.isAdmin(parseInt(conversationId), user.id);
            if (!isAdmin.data) {
                return res.status(403).json({
                    status: false,
                    message: 'Only admin can update member roles'
                });
            }

            const result = await member.updateRole(parseInt(conversationId), parseInt(memberId), role);
            if (result.status) {
                // Thông báo cho các thành viên
                socketService.emitToConversation(conversationId, 'member_role_updated', {
                    conversationId: parseInt(conversationId),
                    updatedBy: {
                        id: user.id,
                        name: user.fullname,
                        avatar: user.avatar
                    },
                    memberId: parseInt(memberId),
                    newRole: role
                });
            }

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async processMentionNotification(messageId: number, mentionedUserId: number, conversationId: number) {
        try {
            // Lấy thông tin tin nhắn và người gửi
            const [messageData]: any = await pool.query(
                `SELECT m.*, u.fullname as sender_name, u.avatar as sender_avatar,
                c.name as conversation_name
                FROM messages m 
                JOIN users u ON m.sender_id = u.id
                JOIN conversations c ON m.conversation_id = c.id
                WHERE m.id = ?`,
                [messageId]
            );

            // Lưu thông báo với thông tin chi tiết
            await pool.query(
                `INSERT INTO notifications 
                (user_id, type, reference_id, reference_type, data, created_at)
                VALUES (?, 'mention', ?, 'message', ?, NOW())`,
                [
                    mentionedUserId,
                    messageId,
                    JSON.stringify({
                        conversationId,
                        conversationName: messageData[0].conversation_name,
                        senderName: messageData[0].sender_name,
                        senderAvatar: messageData[0].sender_avatar,
                        messageContent: messageData[0].content
                    })
                ]
            );

            // Gửi thông báo realtime
            socketService.emitToUser(mentionedUserId, 'new_notification', {
                type: 'mention',
                messageId,
                conversationId
            });

        } catch (error) {
            console.error('Error processing mention notification:', error);
        }
    }

    async updateLastSeen(req: any, res: any) {
        try {
            const { conversationId } = req.params;
            const { user } = req;

            // Check if user is member of conversation
            const member = new ConversationMemberModel();
            const isMember = await member.isMember(parseInt(conversationId), user.id);

            if (!isMember.data) {
                return res.status(403).json({
                    status: false,
                    message: 'You are not a member of this conversation'
                });
            }

            // Update last seen timestamp
            const result = await member.updateLastSeen(parseInt(conversationId), user.id);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getMentionedMessages(req: any, res: any) {
        try {
            const { conversationId } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const { user } = req;

            // Check if user is member of conversation
            const member = new ConversationMemberModel();
            const isMember = await member.isMember(parseInt(conversationId), user.id);

            if (!isMember.data) {
                return res.status(403).json({
                    status: false,
                    message: 'You are not a member of this conversation'
                });
            }

            const message = new MessageModel();
            const result = await message.getMentionedMessages(
                parseInt(conversationId),
                user.id,
                parseInt(page),
                parseInt(limit)
            );

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getListMentionUsers(req: any, res: any) {
        try {
            const { conversationId } = req.params;
            const { user } = req;
            const { page = 1, page_size = 20, query } = req.query;

            // Check if user is member of conversation
            const member = new ConversationMemberModel();
            const isMember = await member.isMember(parseInt(conversationId), user.id);

            if (!isMember.data) {
                return res.status(403).json({
                    status: false,
                    message: 'You are not a member of this conversation'
                });
            }

            // Search for members to mention
            const result = await member.getListMembers(parseInt(conversationId), parseInt(page), parseInt(page_size), query);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    private async addMembersToConversation(conversationId: number, memberIds: number[], creatorId?: number) {
        const memberModel = new ConversationMemberModel();
        const promises = memberIds.map(userId => {
            memberModel.conversation_id = conversationId;
            memberModel.user_id = userId;
            memberModel.role = userId === creatorId ? MemberRole.ADMIN : MemberRole.MEMBER;
            return memberModel.create();
        });

        return Promise.all(promises);
    }
}
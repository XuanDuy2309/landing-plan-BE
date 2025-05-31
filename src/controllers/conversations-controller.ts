import { ConversationMemberModel, ConversationsModel, MessageModel, UserModel } from "../models";
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

            for (const member of allMembers) {
                socketService.emitToUser(member, 'conversation_created', {
                    ...conversationData.data
                });
            }

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
            const { page = 1, page_size = 20 } = req.query;
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
                parseInt(page_size)
            );

            await member.updateLastSeen(parseInt(conversationId), user.id);

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    private isMuted(member: ConversationMemberModel): boolean {
        const mutedUntil = new Date(member.muted_until || '').getTime();
        return mutedUntil > Date.now();
    }

    async sendMessage(req: any, res: any) {
        try {
            const { conversationId } = req.params;
            const { content, type = MessageType.TEXT, reply_id } = req.body;
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
            message.reply_id = reply_id;

            const result = await message.create();

            if (!result.status || !result.data) {
                return res.status(400).json(result);
            }

            // Update conversation last message time
            const conversation = new ConversationsModel();
            await conversation.updateLastMessage(parseInt(conversationId));

            // Emit message to conversation room


            socketService.emitToConversation(conversationId, 'new_message', result.data);

            const members = await member.getListMembers(parseInt(conversationId));

            // Notify other members about the new message
            members.data.forEach((member: any) => {
                if (member.id !== user.id && !this.isMuted(member)) {
                    socketService.emitToUser(member.id, 'notification_message', result.data);
                }
            });

            await member.updateLastSeen(parseInt(conversationId), user.id);


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

            const member = new ConversationMemberModel();
            const message = new MessageModel();
            const messageData = await message.edit(parseInt(messageId), content, type);

            if (!messageData.status) {
                return res.status(400).json(messageData);
            }
            // Notify other members about the edit
            socketService.emitToConversation(conversationId, 'message_edited', {
                ...messageData.data,
            });

            await member.updateLastSeen(parseInt(conversationId), user.id);


            return res.status(200).json(messageData);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async deleteMessage(req: any, res: any) {
        try {
            const { conversationId, messageId } = req.params;
            const { user } = req;

            const member = new ConversationMemberModel();
            const message = new MessageModel();
            const result = await message.delete(parseInt(messageId));

            if (!result.status) {
                return res.status(400).json(result);
            }

            // Notify other members about the deletion
            socketService.emitToConversation(conversationId, 'message_deleted', {
                ...result.data
            });

            await member.updateLastSeen(parseInt(conversationId), user.id);


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

            const member = new ConversationMemberModel();
            const memberData = await member.isMember(parseInt(conversationId), user.id);

            if (!memberData.status) {
                return res.status(403).json({
                    status: false,
                    message: 'You are not a member of this conversation'
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

    async deleteConversation(req: any, res: any) {
        try {
            const conversationId = parseInt(req.params.conversationId);
            if (isNaN(conversationId)) {
                return res.status(400).json({ message: 'Invalid conversation ID' });
            }

            const { user } = req;
            const member = new ConversationMemberModel();
            const conversation = new ConversationsModel();

            const [isMember, isAdmin, cInfo] = await Promise.all([
                member.isMember(conversationId, user.id),
                member.isAdmin(conversationId, user.id),
                conversation.getById(conversationId)
            ]);

            if (!cInfo.status) {
                return res.status(404).json({ message: 'Conversation not found' });
            }

            const isDirect = cInfo.data.type === ConversationType.DIRECT;

            if ((isDirect && isMember.data) || isAdmin.data) {
                // Get members BEFORE deletion
                const members = await member.getListMembers(conversationId);

                const rmConversation = await conversation.deleteConversation(conversationId);
                if (!rmConversation.status) {
                    return res.status(500).json({ message: rmConversation.message });
                }

                // Notify other users
                members.data?.forEach((m: any) => {
                    if (m.id !== user.id) {
                        socketService.emitToUser(m.id, 'conversation_deleted', {
                            conversationId
                        });
                    }
                });

                return res.status(200).json({ message: 'Conversation deleted successfully' });
            } else {
                return res.status(403).json({ message: 'You do not have permission to delete this conversation' });
            }
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }



    async removeMemberFromGroup(req: any, res: any) {
        try {
            const { conversationId, memberId } = req.params;
            const { user } = req;

            const member = new ConversationMemberModel();
            const auth = new UserModel();
            const authInfo = await auth.findUserById(user.id);

            if (memberId === user.id) {
                const result = await member.removeMember(parseInt(conversationId), user.id);
                if (!result.status) {
                    return res.status(400).json(result);
                }
                socketService.emitToConversation(conversationId, 'member_removed', {
                    conversationId: parseInt(conversationId),
                    message: `${authInfo.data.fullname} đã rời khỏi cuộc trò chuyện`,
                });

                socketService.emitToUser(user.id, 'removed_from_conversation', {
                    conversationId: parseInt(conversationId),
                });
                return res.status(200).json(result);
            }

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
                    message: `${result.data.fullname} được ${authInfo.data.fullname} xoá khỏi cuộc trò chuyện`,
                });

                // Thông báo cho thành viên bị xóa
                socketService.emitToUser(memberId, 'removed_from_conversation', {
                    conversationId: parseInt(conversationId),
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

    async resetUnreadCount(req: any, res: any) {
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

            const conversation = new ConversationsModel();
            const result = await conversation.resetUnreadCount(parseInt(conversationId), user.id);

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

    async updateConversation(req: any, res: any) {
        try {
            const { conversationId } = req.params;
            const { name, avatar } = req.body;
            const { user } = req;

            const member = new ConversationMemberModel();
            const isMember = await member.isMember(parseInt(conversationId), user.id);

            if (!isMember.data) {
                return res.status(403).json({
                    status: false,
                    message: 'You are not a member of this conversation'
                });
            }

            const conversation = new ConversationsModel();
            const updateConversation = await conversation.updateConversation(parseInt(conversationId), name, avatar);

            if (!updateConversation.status) {
                return res.status(400).json(updateConversation);
            }

            const result = await conversation.getById(parseInt(conversationId));
            if (!result.status) {
                return res.status(400).json(result);
            }
            for (const member of result.data.members) {
                socketService.emitToUser(member.id, 'conversation_updated', {
                    ...result.data,
                });
            }
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
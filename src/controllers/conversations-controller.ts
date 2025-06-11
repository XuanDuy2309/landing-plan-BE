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
                    message: 'Tên nhớm không được để trống'
                });
            }

            if (!members || members.length === 0) {
                return res.status(400).json({
                    status: false,
                    message: 'Thành viên không được để trống'
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
                    message: 'Bạn không phải là thành viên của cuộc trò chuyện này'
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
                    message: 'Bạn không phải là thành viên của cuộc trò chuyện này'
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
                    message: 'Id thành viên không được để trống'
                });
            }

            const member = new ConversationMemberModel();
            const conversation = new ConversationsModel();
            const userModel = new UserModel();
            const userInfos = await userModel.findUserById(parseInt(user.id));

            if (!userInfos.status) {
                return res.status(404).json({
                    status: false,
                    message: 'Không tìm thấy thông tin người thêm'
                });
            }

            // Check if current user is member of conversation
            const memberData = await member.isMember(parseInt(conversationId), user.id);
            if (!memberData.status || !memberData.data) {
                return res.status(403).json({
                    status: false,
                    message: 'Bạn không phải là thành viên của nhóm'
                });
            }

            // Check if conversation is group type
            const conversationData = await conversation.getById(parseInt(conversationId));
            if (!conversationData.status || !conversationData.data || conversationData.data.type !== ConversationType.GROUP) {
                return res.status(400).json({
                    status: false,
                    message: 'Đây không phải nhóm'
                });
            }

            // Add members to conversation
            await this.addMembersToConversation(parseInt(conversationId), memberIds);

            // Get full info of new members added
            const newMembersData = await member.getMembersByConversationId(parseInt(conversationId));
            if (!newMembersData.status || !newMembersData.data) {
                return res.status(500).json({
                    status: false,
                    message: 'Không thể lấy thông tin thành viên'
                });
            }

            const newMembers = newMembersData.data.filter((m: any) => memberIds.includes(m.user_id));

            // Tạo tin nhắn hệ thống thông báo thêm thành viên
            const systemMessage = new MessageModel();
            systemMessage.conversation_id = parseInt(conversationId);
            systemMessage.sender_id = user.id;  // Người thêm
            const newMemberNames = newMembers.map((m: any) => m.fullname || 'Người dùng').join(', ');
            systemMessage.content = `${userInfos.data.fullname} đã thêm ${newMemberNames} vào cuộc trò chuyện`;
            systemMessage.type = MessageType.SYSTEM;

            const message = await systemMessage.create();

            // Thông báo cho các thành viên hiện tại về việc có thành viên mới
            socketService.emitToConversation(conversationId, 'new_message', message.data);

            const infoConversation = await conversation.getById(parseInt(conversationId));

            // Gửi thông báo cho các thành viên mới
            memberIds.forEach(memberId => {
                if (memberId === user.id) return; // Không gửi thông báo cho người thêm
                socketService.emitToUser(memberId, 'added_to_conversation', infoConversation.data);
            });

            return res.status(200).json({
                status: true,
                data: newMembers,
                message: 'Thêm thành viên thành công'
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
                    message: 'Bạn không phải là thành viên của cuộc trò chuyện này'
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
                    message: 'Bạn không phải là thành viên của cuộc trò chuyện này'
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
                return res.status(400).json({ message: 'id cuộc trò chuyện không được để trống' });
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
                return res.status(404).json({ message: 'Cuộc trò chuyện không tồn tại' });
            }

            const isDirect = cInfo.data.type === ConversationType.DIRECT;

            if ((isDirect && isMember.data) || isAdmin.data) {
                // Get members BEFORE deletion
                const members = await member.getListMembers(conversationId);

                const rmConversation = await conversation.deleteConversation(conversationId);
                if (!rmConversation.status) {
                    return res.status(500).json(rmConversation);
                }

                // Notify other users
                members.data?.forEach((m: any) => {
                    socketService.emitToUser(m.id, 'conversation_deleted', {
                        id: conversationId,
                    });
                });

                return res.status(200).json(rmConversation);
            } else {
                return res.status(403).json({ message: 'Bạn chưa được cấp quyền để thực hiện hành động này' });
            }
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }



    async removeMemberFromGroup(req: any, res: any) {
        try {
            const conversationId = parseInt(req.params.conversationId);
            const memberId = parseInt(req.params.memberId);
            const { user } = req;

            const member = new ConversationMemberModel();
            const auth = new UserModel();
            const authInfo = await auth.findUserById(user.id);

            if (!authInfo.status || !authInfo.data) {
                return res.status(404).json({ message: 'Người dùng không tồn tại' });
            }

            // TH: Thành viên tự rời nhóm
            if (memberId === user.id) {
                const result = await member.removeMember(conversationId, user.id);
                if (!result.status) {
                    return res.status(400).json(result);
                }

                // Tạo tin nhắn hệ thống
                const systemMessage = new MessageModel();
                systemMessage.conversation_id = conversationId;
                systemMessage.sender_id = user.id; // hoặc user hệ thống nếu có
                systemMessage.content = `${authInfo.data.fullname} đã rời khỏi cuộc trò chuyện`;
                systemMessage.type = MessageType.SYSTEM; // giả sử bạn có enum này

                const message = await systemMessage.create();

                if (!message.status) {
                    return res.status(400).json(message);
                }

                socketService.emitToConversation(conversationId, 'new_message', message.data);
                socketService.emitToConversation(conversationId, 'leave_conversation', message.data);

                return res.status(200).json(result);
            }

            // TH: Admin xoá thành viên khác
            const isAdmin = await member.isAdmin(conversationId, user.id);
            if (!isAdmin.data) {
                return res.status(403).json({
                    status: false,
                    message: 'Chỉ quản trị viên mới có thể xoá thành viên'
                });
            }

            const removedUser = await auth.findUserById(memberId);
            if (!removedUser.status || !removedUser.data) {
                return res.status(404).json({ message: 'Thành viên cần xoá không tồn tại' });
            }

            const result = await member.removeMember(conversationId, memberId);
            if (result.status) {
                // Tạo tin nhắn hệ thống
                const systemMessage = new MessageModel();
                systemMessage.conversation_id = conversationId;
                systemMessage.sender_id = user.id; // admin xoá thành viên
                systemMessage.content = `${removedUser.data.fullname} được ${authInfo.data.fullname} xoá khỏi cuộc trò chuyện`;
                systemMessage.type = MessageType.SYSTEM;

                const message = await systemMessage.create();

                if (!message.status) return res.status(404).json(message)

                socketService.emitToConversation(conversationId, 'new_message', message.data);
                socketService.emitToConversation(conversationId, 'leave_conversation', message.data);
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
                    message: 'Bạn không phải là thành viên của cuộc trò chuyện này'
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
                    message: 'Bạn không phải là thành viên của cuộc trò chuyện này'
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
                    message: 'Bạn không phải là thành viên của cuộc trò chuyện này'
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
                    message: 'Bạn không phải là thành viên của cuộc trò chuyện này'
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

    async setNickName(req: any, res: any) {
        try {
            const { conversationId, memberId } = req.params;
            const { nickname } = req.body;
            const { user } = req;

            // Check if user is member of conversation
            const member = new ConversationMemberModel();
            const isMember = await member.isMember(parseInt(conversationId), user.id);

            if (!isMember.data) {
                return res.status(403).json({
                    status: false,
                    message: 'Bạn không phải là thành viên của cuộc trò chuyện này'
                });
            }

            // Update nickname
            const result = await member.setNickname(parseInt(conversationId), memberId, nickname);
            if (!result.status) {
                return res.status(400).json(result);
            }
            socketService.emitToConversation(parseInt(conversationId), 'nickname_updated', {
                ...result.data,
            })
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
                    message: 'Chỉ quản trị viên mới có thế thay đổi vai trò của thành viên'
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

    async getListMediaByConversationID(req: any, res: any) {
        try {
            const { conversationId } = req.params;
            if (!conversationId) {
                return res.status(400).json({ message: 'conversationId is required' });
            }
            const messageModel = new MessageModel();
            const result = await messageModel.getAllImageOrVideoMessages(parseInt(conversationId));
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
import { ConversationMemberModel, ConversationModel, MessageModel } from "../models";

export class ConversationsController {
    async index(req: any, res: any) {
        const conversation = new ConversationModel();
        const { user } = req
        const { query, page, page_size } = req.query
        try {

            const data = await conversation.getListConversationsByUserId(user.id, page, page_size, query);
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json(error);
        }
    }

    async store(req: any, res: any) {
        const conversation = new ConversationModel();
        const { id } = req.params;
        try {
            if (!id) {
                return res.status(400).json({
                    status: false,
                    message: 'id not found'
                });
            }
            const data = await conversation.getDetailConversationById(id);
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json(error);
        }
    }

    async create(req: any, res: any) {
        const conversation = new ConversationModel();
        const cm = new ConversationMemberModel();
        const { user, body } = req
        const { member_ids, name } = body
        try {
            if (!user) {
                return res.status(400).json({
                    status: false,
                    message: 'authentication failed'
                });
            }
            if (!member_ids) {
                return res.status(400).json({
                    status: false,
                    message: 'member_ids not found'
                });
            }
            conversation.name = name;
            const data = await conversation.create(user.id, member_ids);
            if (!data.status) {
                return res.status(400).json(data);
            }
            cm.conversation_id = data.data.id;
            const cmRes = await cm.create(member_ids, user.id);
            if (!cmRes.status) {
                return res.status(400).json(cmRes);
            }
            const result = await conversation.getDetailConversationById(data.data.id);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({
                message: error.message
            });
        }
    }

    async updateMember(req: any, res: any) {
        const { user, body, params } = req;
        const { id } = params;
        const { member_ids, name } = body
        const c = new ConversationModel();
        const cm = new ConversationMemberModel();
        try {
            const isGroup = await c.checkIsGroupConversation(id);
            if (!isGroup) {
                return res.status(400).json({
                    status: false,
                    message: 'conversation is not group'
                });
            }
            if (member_ids.length > 0) {
                const delMember = await cm.deleteMemberInConversation(id);
                if (!delMember.status) {
                    return res.status(400).json(delMember);
                }
                cm.conversation_id = id;
                const addMember = await cm.create(member_ids, user.id);
                if (!addMember.status) {
                    return res.status(400).json(addMember);
                }
            }
            const data = await c.getDetailConversationById(id);
            return res.status(200).json(data);
        } catch (error: any) {
            return res.status(500).json({
                message: error.message
            });
        }
    }

    async updateNameGroupConversation(req: any, res: any) {
        const { user, body, params } = req;
        const { id } = params;
        const { name } = body
        const c = new ConversationModel();
        try {
            const isGroup = await c.checkIsGroupConversation(id);
            if (!isGroup) {
                return res.status(400).json({
                    status: false,
                    message: 'conversation is not group'
                });
            }
            const data = await c.updateNameConversation(id, name);
            return res.status(200).json(data);
        } catch (error: any) {
            return res.status(500).json({
                message: error.message
            });
        }
    }

    async leaveConversation(req: any, res: any) {
        const { user, params } = req;
        const { id } = params;
        const c = new ConversationModel();
        const cm = new ConversationMemberModel();
        try {
            const members = await cm.getAllMemberInConversation(id);
            if (!members.status) {
                return res.status(400).json(members);
            }
            if (members.data.length <= 2) {
                const delC = await c.delete(id);
                if (!delC.status) {
                    return res.status(400).json(delC);
                }
                return res.status(200).json(delC);
            }
            const delMember = await cm.leaveConversation(id, user.id);
            if (!delMember.status) {
                return res.status(400).json(delMember);
            }
            const data = await c.getDetailConversationById(id);
            return res.status(200).json(data);
        } catch (error: any) {
            return res.status(500).json({
                message: error.message
            });
        }
    }

    async deleteMemberInGroupConversation(req: any, res: any) {
        const { user, params } = req;
        const { id, user_id } = params;
        const cm = new ConversationMemberModel();
        const c = new ConversationModel();
        try {
            const isCreator = await c.checkIsCreatorConversation(id, user.id);
            if (!isCreator) {
                return res.status(400).json({
                    status: false,
                    message: 'you are not creator'
                });
            }
            const delMember = await cm.deleteMemberInConversationById(id, user_id);
            if (!delMember.status) {
                return res.status(400).json(delMember);
            }
            const data = await c.getDetailConversationById(id);
            return res.status(200).json(data);
        } catch (error: any) {
            return res.status(500).json({
                message: error.message
            });
        }
    }

    async getMessagesInConversation(req: any, res: any) {
        const { user, params, query } = req;
        const { id } = params;
        const { page, page_size } = query
        const m = new MessageModel();
        try {
            m.conversation_id = id;
            const data = await m.getAll(page, page_size, { ...query });
            if (!data.status) {
                return res.status(400).json(data);
            }
            return res.status(200).json(data);
        } catch (error: any) {
            return res.status(500).json({
                message: error.message
            });
        }
    }

    async sendMessagesInConversation(req: any, res: any) {
        const { user, body, params } = req;
        const { id } = params;
        const m = new MessageModel();
        try {
            Object.assign(m, body);
            m.conversation_id = id;
            m.sender_id = user.id;
            const data = await m.create();
            if (!data.status) {
                return res.status(400).json(data);
            }
            return res.status(200).json(data);
        } catch (error: any) {
            return res.status(500).json({
                message: error.message
            });
        }
    }

    async deleteMessagesInConversation(req: any, res: any) {
        const { user, params } = req;
        const { id } = params;
        const m = new MessageModel();
        try {
            m.id = id;
            m.sender_id = user.id;
            const isSender = await m.checkIsSender();
            if (!isSender.status) {
                return res.status(400).json(isSender);
            }
            const data = await m.delete();
            if (!data.status) {
                return res.status(400).json(data);
            }
            return res.status(200).json(data);
        } catch (error: any) {
            return res.status(500).json({
                message: error.message
            });
        }
    }
}
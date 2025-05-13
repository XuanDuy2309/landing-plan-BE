import pool from '../config/db';

export const enum ConversationType {
    DIRECT = 'direct',
    GROUP = 'group'
}

export class ConversationsModel {
    id?: number;
    name?: string;
    type: ConversationType = ConversationType.DIRECT;
    created_at?: string;
    updated_at?: string;

    constructor() {}

    async create() {
        try {
            const [result]: any = await pool.query(
                'INSERT INTO conversations (name, type) VALUES (?, ?)',
                [this.name, this.type]
            );
            
            return {
                status: true,
                data: { ...this, id: result.insertId },
                message: 'Conversation created successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                data: null,
                message: err.message
            };
        }
    }

    async getById(id: number) {
        try {
            const [conversations]: any = await pool.query(
                `SELECT 
                    c.*,
                    COUNT(DISTINCT m.id) as total_messages,
                    COUNT(DISTINCT cm.user_id) as member_count,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', u.id,
                            'fullname', u.fullname,
                            'avatar', u.avatar,
                            'role', cm.role
                        )
                    ) as members,
                    (
                        SELECT JSON_OBJECT(
                            'id', m2.id,
                            'content', m2.content,
                            'type', m2.type,
                            'created_at', m2.created_at,
                            'sender', JSON_OBJECT(
                                'id', u2.id,
                                'fullname', u2.fullname,
                                'avatar', u2.avatar
                            )
                        )
                        FROM messages m2 
                        JOIN users u2 ON m2.sender_id = u2.id
                        WHERE m2.conversation_id = c.id 
                        ORDER BY m2.created_at DESC 
                        LIMIT 1
                    ) as last_message
                FROM conversations c
                LEFT JOIN messages m ON c.id = m.conversation_id
                LEFT JOIN conversation_members cm ON c.id = cm.conversation_id
                LEFT JOIN users u ON cm.user_id = u.id
                WHERE c.id = ?
                GROUP BY c.id`,
                [id]
            );

            if (conversations.length === 0) {
                return {
                    status: false,
                    data: null,
                    message: 'Conversation not found'
                };
            }

            return {
                status: true,
                data: conversations[0],
                message: 'Conversation retrieved successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                data: null,
                message: err.message
            };
        }
    }

    // Removed getUserConversations as it's replaced by getConversationsByUserId in ConversationMemberModel

    async updateLastMessage(id: number) {
        try {
            await pool.query(
                'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );
            
            return {
                status: true,
                message: 'Conversation updated successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                message: err.message
            };
        }
    }

    async findDirectChat(userId1: number, userId2: number) {
        try {
            const [rows]: any = await pool.query(`
                SELECT c.* 
                FROM conversations c
                JOIN conversation_members cm1 ON c.id = cm1.conversation_id
                JOIN conversation_members cm2 ON c.id = cm2.conversation_id
                WHERE c.type = ?
                AND cm1.user_id = ?
                AND cm2.user_id = ?
                LIMIT 1
            `, [ConversationType.DIRECT, userId1, userId2]);
            
            return {
                status: true,
                data: rows[0],
                message: rows[0] ? 'Direct chat found' : 'No direct chat found'
            };
        } catch (err: any) {
            return { 
                status: false, 
                data: null, 
                message: err.message 
            };
        }
    }
}
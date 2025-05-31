import pool from '../config/db';

export const enum ConversationType {
    DIRECT = 'direct',
    GROUP = 'group'
}

export class ConversationsModel {
    id?: number;
    name?: string;
    type: ConversationType = ConversationType.DIRECT;
    avatar?: string;
    last_message_id?: number;
    created_at?: string;
    updated_at?: string;

    constructor() { }

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
            const [rows]: any = await pool.query(
                `
            SELECT 
                c.id,
                c.name,
                c.avatar,
                c.type,
                c.created_at,
                c.updated_at,
                (
                    SELECT COUNT(DISTINCT m.id)
                    FROM messages m
                    WHERE m.conversation_id = c.id
                ) as total_messages,
                (
                    SELECT COUNT(DISTINCT cm.user_id)
                    FROM conversation_members cm
                    WHERE cm.conversation_id = c.id
                ) as member_count,
                (
                    SELECT JSON_OBJECT(
                        'id', m2.id,
                        'content', m2.content,
                        'type', m2.type,
                        'created_at', m2.created_at,
                        'sender_id', u2.id,
                        'sender_name', u2.fullname,
                        'sender_avatar', u2.avatar
                    )
                    FROM messages m2
                    JOIN users u2 ON m2.sender_id = u2.id
                    WHERE m2.conversation_id = c.id
                    ORDER BY m2.created_at DESC, m2.id DESC
                    LIMIT 1
                ) as last_message,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', u3.id,
                            'fullname', u3.fullname,
                            'avatar', u3.avatar
                        )
                    )
                    FROM conversation_members cm3
                    JOIN users u3 ON cm3.user_id = u3.id
                    WHERE cm3.conversation_id = c.id
                ) as members
            FROM conversations c
            WHERE c.id = ?
            LIMIT 1
            `,
                [id]
            );

            if (rows.length === 0) {
                return {
                    status: false,
                    data: null,
                    message: 'Conversation not found'
                };
            }

            return {
                status: true,
                data: rows[0],
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

    async resetUnreadCount(conversationId: number, userId: number) {
        try {
            // Mark all unread messages as read
            const [result]: any = await pool.query(
                `INSERT IGNORE INTO message_reads (message_id, user_id, read_at)
                SELECT m.id, ?, NOW()
                FROM messages m
                LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ?
                WHERE m.conversation_id = ?
                AND m.sender_id != ?
                AND mr.message_id IS NULL`,
                [userId, userId, conversationId, userId]
            );

            // Update last seen timestamp
            await pool.query(
                `UPDATE conversation_members 
                SET last_seen_at = NOW()
                WHERE conversation_id = ? AND user_id = ?`,
                [conversationId, userId]
            );

            return {
                status: true,
                data: {
                    markedCount: result.affectedRows,
                },
                message: 'Unread messages reset successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                data: null,
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

    async updateConversation(id: number, name?: string, avatar?: string) {
        try {
            if (!id) {
                return {
                    status: false,
                    data: null,
                    message: 'Missing conversation ID'
                };
            }

            const fields: string[] = [];
            const values: any[] = [];

            if (name !== undefined) {
                fields.push('name = ?');
                values.push(name);
            }

            if (avatar !== undefined) {
                fields.push('avatar = ?');
                values.push(avatar);
            }

            if (fields.length === 0) {
                return {
                    status: false,
                    data: null,
                    message: 'No fields to update'
                };
            }

            const query = `UPDATE conversations SET ${fields.join(', ')} WHERE id = ?`;
            values.push(id);

            const [result]: any = await pool.query(query, values);

            return {
                status: true,
                data: result,
                message: 'Conversation updated successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                data: null,
                message: err.message
            };
        }
    }

    async deleteConversation(id: number) {
        try {
            const [result]: any = await pool.query('DELETE FROM conversations WHERE id = ?', [id]);

            return {
                status: true,
                data: result,
                message: 'Conversation deleted successfully'
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
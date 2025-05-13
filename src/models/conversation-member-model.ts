import pool from '../config/db';

export const enum MemberRole {
    ADMIN = 'admin',
    MEMBER = 'member'
}

export class ConversationMemberModel {
    id?: number;
    conversation_id?: number;
    user_id?: number;
    role: MemberRole = MemberRole.MEMBER;
    joined_at?: string;

    constructor() {}

    async create() {
        try {
            const [result]: any = await pool.query(
                'INSERT INTO conversation_members (conversation_id, user_id, role) VALUES (?, ?, ?)',
                [this.conversation_id, this.user_id, this.role]
            );
            
            return {
                status: true,
                data: { ...this, id: result.insertId },
                message: 'Member added successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                data: null,
                message: err.message
            };
        }
    }

    async getConversationsByUserId(userId: number, page: number = 1, limit: number = 20, search?: string) {
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT 
                    c.*,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', u.id,
                            'fullname', u.fullname,
                            'avatar', u.avatar,
                            'role', cm2.role
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
                    ) as last_message,
                    (
                        SELECT COUNT(*)
                        FROM messages msg
                        WHERE msg.conversation_id = c.id
                        AND msg.sender_id != ?
                        AND msg.id NOT IN (
                            SELECT message_id 
                            FROM message_reads 
                            WHERE user_id = ?
                        )
                    ) as unread_count
                FROM conversations c
                JOIN conversation_members cm ON c.id = cm.conversation_id
                JOIN conversation_members cm2 ON c.id = cm2.conversation_id
                JOIN users u ON cm2.user_id = u.id
                WHERE c.id IN (
                    SELECT conversation_id 
                    FROM conversation_members 
                    WHERE user_id = ?
                )
            `;

            const params: any[] = [userId, userId, userId];

            if (search) {
                query += ` AND (
                    c.name LIKE ? OR 
                    EXISTS (
                        SELECT 1 FROM users u2 
                        JOIN conversation_members cm3 ON u2.id = cm3.user_id 
                        WHERE cm3.conversation_id = c.id 
                        AND u2.fullname LIKE ?
                    )
                )`;
                params.push(`%${search}%`, `%${search}%`);
            }

            query += `
                GROUP BY c.id
                ORDER BY (
                    SELECT m2.created_at
                    FROM messages m2
                    WHERE m2.conversation_id = c.id
                    ORDER BY m2.created_at DESC
                    LIMIT 1
                ) DESC, c.created_at DESC
                LIMIT ? OFFSET ?
            `;
            params.push(limit, offset);

            // Get conversations with pagination
            const [rows]: any = await pool.query(query, params);

            // Get total count for pagination
            const [totalResult]: any = await pool.query(`
                SELECT COUNT(DISTINCT c.id) as total
                FROM conversations c
                JOIN conversation_members cm ON c.id = cm.conversation_id
                WHERE cm.user_id = ?
                ${search ? `AND (
                    c.name LIKE ? OR 
                    EXISTS (
                        SELECT 1 FROM users u2 
                        JOIN conversation_members cm3 ON u2.id = cm3.user_id 
                        WHERE cm3.conversation_id = c.id 
                        AND u2.fullname LIKE ?
                    )
                )` : ''}
            `, search ? [userId, `%${search}%`, `%${search}%`] : [userId]);
            
            return {
                status: true,
                data: rows,
                total: totalResult[0].total,
                currentPage: page,
                totalPages: Math.ceil(totalResult[0].total / limit),
                message: 'Conversations retrieved successfully'
            };
        } catch (err: any) {
            return { 
                status: false, 
                data: null, 
                message: err.message 
            };
        }
    }

    async getMembersByConversationId(conversationId: number) {
        try {
            const [members]: any = await pool.query(
                `SELECT cm.*, u.fullname, u.avatar, u.email
                FROM conversation_members cm
                INNER JOIN users u ON cm.user_id = u.id
                WHERE cm.conversation_id = ?`,
                [conversationId]
            );

            return {
                status: true,
                data: members,
                message: 'Members retrieved successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                data: null,
                message: err.message
            };
        }
    }

    async removeMember(conversationId: number, userId: number) {
        try {
            await pool.query(
                'DELETE FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
                [conversationId, userId]
            );
            
            return {
                status: true,
                message: 'Member removed successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                message: err.message
            };
        }
    }

    async updateRole(conversationId: number, userId: number, role: MemberRole) {
        try {
            await pool.query(
                'UPDATE conversation_members SET role = ? WHERE conversation_id = ? AND user_id = ?',
                [role, conversationId, userId]
            );
            
            return {
                status: true,
                message: 'Member role updated successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                message: err.message
            };
        }
    }

    async isMember(conversationId: number, userId: number) {
        try {
            const [members]: any = await pool.query(
                'SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
                [conversationId, userId]
            );

            return {
                status: true,
                data: members.length > 0,
                message: members.length > 0 ? 'User is a member' : 'User is not a member'
            };
        } catch (err: any) {
            return {
                status: false,
                data: false,
                message: err.message
            };
        }
    }

    // Moved to ConversationsModel

    async getMemberRole(conversationId: number, userId: number) {
        try {
            const [member]: any = await pool.query(
                'SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
                [conversationId, userId]
            );

            return {
                status: true,
                data: member[0],
                message: member[0] ? 'Member role found' : 'Member not found'
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
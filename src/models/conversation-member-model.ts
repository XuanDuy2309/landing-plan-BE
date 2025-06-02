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
    nickname?: string;
    joined_at?: string;
    last_seen_at?: string;
    muted_until?: string;

    constructor() { }

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

    async createMany(conversationId: number, members: Array<{ userId: number; role: MemberRole }>) {
        try {
            const values = members.map(member => [
                conversationId,
                member.userId,
                member.role,
                new Date()
            ]);

            const [result]: any = await pool.query(
                'INSERT INTO conversation_members (conversation_id, user_id, role, joined_at) VALUES ?',
                [values]
            );

            return {
                status: true,
                data: { affectedRows: result.affectedRows },
                message: 'Members added successfully'
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

            const params: any[] = [userId, userId, userId]; // unread_count và main query

            let searchFilter = '';
            if (search) {
                searchFilter = `
                AND (
                    c.name LIKE ? OR 
                    EXISTS (
                        SELECT 1 FROM users u2 
                        JOIN conversation_members cm3 ON u2.id = cm3.user_id 
                        WHERE cm3.conversation_id = c.id 
                        AND u2.fullname LIKE ?
                    )
                )
            `;
                params.push(`%${search}%`, `%${search}%`);
            }

            const query = `
            SELECT 
                c.*,
                (
                    SELECT JSON_OBJECT(
                        'id', m2.id,
                        'content', m2.content,
                        'type', m2.type,
                        'created_at', m2.created_at,
                        'sender_id', u2.id,
                        'sender_name', u2.fullname,
                        'sender_avatar', u2.avatar,
                        'sender_nickname', cm2.nickname
                    )
                    FROM messages m2 
                    JOIN users u2 ON m2.sender_id = u2.id
                    LEFT JOIN conversation_members cm2 ON m2.sender_id = cm2.user_id AND m2.conversation_id = cm2.conversation_id
                    WHERE m2.conversation_id = c.id 
                    ORDER BY m2.created_at DESC 
                    LIMIT 1
                ) AS last_message,

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
                ) AS unread_count,

                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', u.id,
                            'fullname', u.fullname,
                            'avatar', u.avatar,
                            'nickname', cm.nickname
                        )
                    )
                    FROM conversation_members cm
                    JOIN users u ON cm.user_id = u.id
                    WHERE cm.conversation_id = c.id
                ) AS members

            FROM conversations c
            JOIN conversation_members cm ON cm.conversation_id = c.id
            WHERE cm.user_id = ?
            ${searchFilter}
            ORDER BY (
                SELECT m.created_at 
                FROM messages m 
                WHERE m.conversation_id = c.id 
                ORDER BY m.created_at DESC 
                LIMIT 1
            ) DESC, c.updated_at DESC
            LIMIT ? OFFSET ?
        `;

            params.push(limit, offset);

            const [rows]: any = await pool.query(query, params);

            // Total count for pagination
            const countParams: any = [userId];
            let countQuery = `
            SELECT COUNT(DISTINCT c.id) as total
            FROM conversations c
            JOIN conversation_members cm ON cm.conversation_id = c.id
            WHERE cm.user_id = ?
        `;

            if (search) {
                countQuery += `
                AND (
                    c.name LIKE ? OR 
                    EXISTS (
                        SELECT 1 FROM users u2 
                        JOIN conversation_members cm3 ON u2.id = cm3.user_id 
                        WHERE cm3.conversation_id = c.id 
                        AND u2.fullname LIKE ?
                    )
                )
            `;
                countParams.push(`%${search}%`, `%${search}%`);
            }

            const [totalResult]: any = await pool.query(countQuery, countParams);
            const total = totalResult[0]?.total || 0;

            return {
                status: true,
                data: rows,
                total,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
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
                `SELECT 
                    cm.*,
                    u.fullname,
                    u.avatar,
                    u.email,
                    (
                        SELECT COUNT(*)
                        FROM messages m
                        WHERE m.conversation_id = cm.conversation_id
                        AND m.sender_id = cm.user_id
                    ) as total_messages
                FROM conversation_members cm
                INNER JOIN users u ON cm.user_id = u.id
                WHERE cm.conversation_id = ?
                ORDER BY cm.role = 'admin' DESC, cm.joined_at ASC`,
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

            const [users]: any = await pool.query(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );

            return {
                data: users[0],
                status: true,
                message: 'Member removed successfully'
            };
        } catch (err: any) {
            return {
                data: null,
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

    async isAdmin(conversationId: number, userId: number) {
        try {
            const [members]: any = await pool.query(
                'SELECT role FROM conversation_members WHERE conversation_id = ? AND user_id = ? AND role = ?',
                [conversationId, userId, MemberRole.ADMIN]
            );

            return {
                status: true,
                data: members.length > 0,
                message: members.length > 0 ? 'User is admin' : 'User is not admin'
            };
        } catch (err: any) {
            return {
                status: false,
                data: false,
                message: err.message
            };
        }
    }

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

    async updateLastSeen(conversationId: number, userId: number) {
        try {
            await pool.query(
                `UPDATE conversation_members 
                SET last_seen_at = NOW()
                WHERE conversation_id = ? AND user_id = ?`,
                [conversationId, userId]
            );

            return {
                status: true,
                data: null,
                message: 'Last seen updated successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                data: null,
                message: err.message
            };
        }
    }

    async updateMuteSetting(conversationId: number, userId: number, muteDuration?: number) {
        try {
            const muteUntil = muteDuration
                ? new Date(Date.now() + muteDuration * 1000) // muteDuration in seconds
                : null;

            await pool.query(
                'UPDATE conversation_members SET muted_until = ? WHERE conversation_id = ? AND user_id = ?',
                [muteUntil, conversationId, userId]
            );

            return {
                status: true,
                message: muteUntil ? 'Conversation muted successfully' : 'Conversation unmuted successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                message: err.message
            };
        }
    }

    async getListMembers(conversationId: number, page: number = 1, limit: number = 10, search: string = '') {
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT 
                    u.id,
                    u.fullname,
                    u.username,
                    u.email,
                    u.avatar,
                    cm.role,
                    cm.joined_at,
                    cm.last_seen_at,
                    cm.muted_until,
                    cm.nickname,
                    muted_until,
                    CASE 
                        WHEN cm.last_seen_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN true 
                        ELSE false 
                    END as is_online,
                    (
                        SELECT COUNT(*)
                        FROM messages m
                        WHERE m.conversation_id = cm.conversation_id
                        AND m.sender_id = cm.user_id
                    ) as message_count
                FROM conversation_members cm
                JOIN users u ON cm.user_id = u.id
                WHERE cm.conversation_id = ?`;

            const queryParams: any[] = [conversationId];

            if (search) {
                query += ` AND (
                    u.fullname LIKE ? OR 
                    u.username LIKE ? OR 
                    u.email LIKE ?
                )`;
                queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            query += `
                ORDER BY 
                    cm.role = 'admin' DESC,
                    is_online DESC,
                    u.fullname ASC
                LIMIT ? OFFSET ?`;

            queryParams.push(limit, offset);

            const [members]: any = await pool.query(query, queryParams);

            // Get total count for pagination
            const [totalResult]: any = await pool.query(
                `SELECT COUNT(*) as total
                FROM conversation_members cm
                JOIN users u ON cm.user_id = u.id
                WHERE cm.conversation_id = ?
                ${search ? 'AND (u.fullname LIKE ? OR u.username LIKE ? OR u.email LIKE ?)' : ''}`,
                search ? [conversationId, `%${search}%`, `%${search}%`, `%${search}%`] : [conversationId]
            );

            return {
                status: true,
                data: members,
                total: totalResult[0].total,
                page,
                page_size: limit,
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

    async setNickname(conversationId: number, userId: number, nickname: string) {
        try {
            await pool.query(
                'UPDATE conversation_members SET nickname = ? WHERE conversation_id = ? AND user_id = ?',
                [nickname, conversationId, userId]
            );

            const [result]: any = await pool.query(`
                SELECT u.id,
                u.fullname,
                cm.nickname,
                cm.conversation_id
                FROM conversation_members cm
                JOIN users u ON cm.user_id = u.id
                WHERE cm.conversation_id = ? AND cm.user_id = ?
            `, [conversationId, userId]);

            return {
                data: result[0],
                status: true,
                message: 'Nickname updated successfully'
            };
        } catch (err: any) {
            return {
                data: null,
                status: false,
                message: err.message
            };
        }
    }
}
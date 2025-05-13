import pool from "../config/db";

export class ConversationModel {
    id?: number;
    name?: string;
    is_group: boolean = false;
    created_by_id?: number;
    created_at?: string;
    constructor() { }

    async getListConversationsByUserId(user_id?: number, page: number = 1, page_size: number = 10, query?: string) {
        const index = Number(page);
        const pageSize = Number(page_size);
        const offset = (index - 1) * pageSize;

        const str = `
            SELECT DISTINCT 
                c.*, 
                MAX(m.created_at) AS updated_at,
                IFNULL(
                    (
                        SELECT CAST(CONCAT('[', 
                            GROUP_CONCAT(
                                JSON_OBJECT(
                                    'user_id', u2.id,
                                    'user_name', u2.fullname,
                                    'user_avatar', u2.avatar
                                )
                            ), 
                        ']') AS JSON)
                        FROM conversation_members cm2
                        JOIN users u2 ON cm2.user_id = u2.id
                        WHERE cm2.conversation_id = c.id
                        GROUP BY cm2.conversation_id
                    ),
                    '[]'
                ) AS members
            FROM conversations c
            JOIN conversation_members cm ON c.id = cm.conversation_id
            JOIN users u ON cm.user_id = u.id
            LEFT JOIN messages m ON c.id = m.conversation_id
            WHERE c.id IN (
                SELECT c2.id
                FROM conversations c2
                JOIN conversation_members cm2 ON c2.id = cm2.conversation_id
                WHERE cm2.user_id = ?
            )
            ${query ? 'AND u.fullname LIKE ?' : ''}
            GROUP BY c.id
            ORDER BY updated_at DESC
            LIMIT ? OFFSET ?`;

        try {
            const queryParams = query ? [user_id, `%${query}%`, pageSize, offset] : [user_id, pageSize, offset];
            const [rows]: any = await pool.query(str, queryParams);

            return {
                data: rows.map((row: any) => ({
                    ...row,
                    members: typeof row.members === 'string' ? JSON.parse(row.members) : (Array.isArray(row.members) ? row.members : [])
                })),
                status: true,
                message: 'success',
                total: rows.length,
                page,
                totalPages: Math.ceil(rows.length / page_size),
            };
        } catch (err: any) {
            console.error('Error in getListConversationsByUserId:', err);
            return {
                data: null,
                status: false,
                message: err.message || 'An error occurred',
            };
        }
    }

    async getDetailConversationById(id?: number) {
        try {
            const [rows]: any[] = await pool.query(
                `SELECT 
                    c.*,
                    IFNULL(
                        (
                            SELECT CAST(CONCAT('[', 
                                GROUP_CONCAT(
                                    JSON_OBJECT(
                                        'user_id', u2.id,
                                        'user_name', u2.fullname,
                                        'user_avatar', u2.avatar
                                    )
                                ), 
                            ']') AS JSON)
                            FROM conversation_members cm2
                            JOIN users u2 ON cm2.user_id = u2.id
                            WHERE cm2.conversation_id = c.id
                            GROUP BY cm2.conversation_id
                        ),
                        '[]'
                    ) AS members
                FROM conversations c
                WHERE c.id = ?`,
                [id]
            );

            const conversation = rows[0];
            if (!conversation) {
                return {
                    data: null,
                    status: false,
                    message: 'Conversation not found'
                };
            }

            return {
                data: {
                    ...conversation,
                    members: typeof conversation.members === 'string' ? JSON.parse(conversation.members) : (Array.isArray(conversation.members) ? conversation.members : [])
                },
                status: true,
                message: 'success'
            };
        } catch (err: any) {
            console.error('Error in getDetailConversationById:', err);
            return {
                data: null,
                status: false,
                message: err.message || 'An error occurred'
            };
        }
    }

    async create(user_id: number, member_ids: number[]) {
        try {
            this.is_group = member_ids.length > 1;
            if (!this.is_group && member_ids.length === 1) {

                const [rows]: any = await pool.query(
                    `SELECT c.id
                    FROM conversations c
                    JOIN conversation_members cm ON c.id = cm.conversation_id
                    WHERE cm.user_id IN (?) AND c.is_group = false
                    GROUP BY c.id
                    HAVING COUNT(c.id) = 2`,
                    [[user_id, member_ids[0]]]
                );

                if (rows.length > 0) {
                    return {
                        data: rows,
                        status: true,
                        message: 'here'
                    };
                }

            }
            const [conversationResult]: any = await pool.query(
                `INSERT INTO conversations (name, is_group, created_by_id, created_at)
                 VALUES (?, ?,?, NOW())`,
                [this.name || null, this.is_group, user_id, new Date()]
            );

            return {
                data: {
                    id: conversationResult.insertId
                },
                status: true,
                message: 'success'
            }
        } catch (err: any) {
            return {
                data: null,
                status: false,
                message: err.message || 'An error occurred'
            };
        }
    }

    async checkIsGroupConversation(conversation_id: number): Promise<boolean> {
        try {
            const query = `SELECT is_group
                FROM conversations
                WHERE id = ?`;

            const [rows]: any = await pool.query(query, [conversation_id]);
            return rows[0].is_group === 1;
        } catch (err) {
            console.error('Error in checkIsGroupConversation:', err);
            return false;
        }
    }

    async updateNameConversation(conversation_id: number, name: string) {
        try {
            // Check if conversation exists and is a group
            const isGroup = await this.checkIsGroupConversation(conversation_id);
            if (!isGroup) {
                return {
                    data: null,
                    status: false,
                    message: 'Cannot update name of non-group conversation'
                };
            }

            const query = 'UPDATE conversations SET name = ? WHERE id = ?';
            await pool.query(query, [name, conversation_id]);

            return {
                data: { id: conversation_id, name },
                status: true,
                message: 'Conversation name updated successfully'
            };
        } catch (err: any) {
            console.error('Error in updateNameConversation:', err);
            return {
                data: null,
                status: false,
                message: err.message || 'Failed to update conversation name'
            };
        }
    }

    async update(id: number, name?: string, is_group?: boolean) {
        try {
            if (!id) {
                return {
                    data: null,
                    status: false,
                    message: 'Conversation ID is required'
                };
            }

            const updateFields: any = {};
            if (name) updateFields.name = name;
            if (is_group) updateFields.is_group = is_group;

            if (Object.keys(updateFields).length === 0) {
                return {
                    data: null,
                    status: false,
                    message: 'No fields to update'
                };
            }

            const query = 'UPDATE conversations SET ? WHERE id = ?';
            await pool.query(query, [updateFields, id]);

            // Get updated conversation details
            const updatedConversation = await this.getDetailConversationById(id);

            return {
                data: updatedConversation.data,
                status: true,
                message: 'Conversation updated successfully'
            };
        } catch (err: any) {
            console.error('Error in update conversation:', err);
            return {
                data: null,
                status: false,
                message: err.message || 'Failed to update conversation'
            };
        }
    }

    async delete(id: number) {
        try {
            if (!id) {
                return {
                    data: null,
                    status: false,
                    message: 'Conversation ID is required'
                };
            }

            // Start a transaction
            await pool.query('START TRANSACTION');

            try {
                // Delete conversation members first (due to foreign key constraints)
                await pool.query('DELETE FROM conversation_members WHERE conversation_id = ?', [id]);

                // Delete messages
                await pool.query('DELETE FROM messages WHERE conversation_id = ?', [id]);

                // Delete the conversation
                await pool.query('DELETE FROM conversations WHERE id = ?', [id]);

                // Commit the transaction
                await pool.query('COMMIT');

                return {
                    data: { id },
                    status: true,
                    message: 'Conversation and related data deleted successfully'
                };
            } catch (error) {
                // Rollback in case of error
                await pool.query('ROLLBACK');
                throw error;
            }
        } catch (err: any) {
            console.error('Error in delete conversation:', err);
            return {
                data: null,
                status: false,
                message: err.message || 'Failed to delete conversation'
            };
        }
    }

    async checkIsCreatorConversation(conversation_id: number, user_id: number) {
        try {
            const query = `SELECT created_by_id
                FROM conversations
                WHERE id = ?`;

            const [rows]: any = await pool.query(query, [conversation_id]);
            return rows[0].created_by_id === user_id;
        } catch (err) {
            console.error('Error in checkIsCreatorConversation:', err);
            return false;
        }
    }
}
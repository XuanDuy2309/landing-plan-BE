import pool from '../config/db';

interface MentionData {
    userId: number;
    position: {
        start: number;
        end: number;
    };
    username?: string;
}

interface MessageMetadata {
    mentions?: MentionData[];
    [key: string]: any;
}

export const enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    FILE = 'file',
    LOCATION = 'location',
    STICKER = 'sticker',
    EMOJI = 'emoji',
    AUDIO_CALL = 'audio_call',
    VIDEO_CALL = 'video_call',
    MENTION = 'mention'
}

export const enum MessageStatus {
    SENT = 'sent',
    EDITED = 'edited',
    DELETED = 'deleted'
}

export class MessageModel {
    id?: number;
    conversation_id?: number;
    sender_id?: number;
    reply_id?: number;
    content?: string;
    type: MessageType = MessageType.TEXT;
    status: MessageStatus = MessageStatus.SENT;
    metadata?: MessageMetadata;
    is_favorite?: boolean;
    created_at?: string;
    updated_at?: string;

    constructor() { }

    async createMention(messageId: number, mentionedUserIds: number[]) {
        try {
            const values = mentionedUserIds.map(userId => [messageId, userId]);
            await pool.query(
                'INSERT INTO message_mentions (message_id, user_id) VALUES ?',
                [values]
            );
            
            return {
                status: true,
                message: 'Mentions created successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                message: err.message
            };
        }
    }

    async getMentions(messageId: number) {
        try {
            const [mentions]: any = await pool.query(
                `SELECT u.id, u.fullname, u.avatar
                FROM message_mentions mm
                JOIN users u ON mm.user_id = u.id
                WHERE mm.message_id = ?`,
                [messageId]
            );
            
            return {
                status: true,
                data: mentions,
                message: 'Mentions retrieved successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                data: null,
                message: err.message
            };
        }
    }

    async getMentionedMessages(userId: number, conversationId?: number) {
        try {
            let query = `
                SELECT m.*, u.fullname as sender_name, u.avatar as sender_avatar,
                c.name as conversation_name
                FROM messages m
                JOIN message_mentions mm ON m.id = mm.message_id
                JOIN users u ON m.sender_id = u.id
                JOIN conversations c ON m.conversation_id = c.id
                WHERE mm.user_id = ?
            `;
            const params = [userId];

            if (conversationId) {
                query += ' AND m.conversation_id = ?';
                params.push(conversationId);
            }

            query += ' ORDER BY m.created_at DESC';

            const [messages]: any = await pool.query(query, params);
            
            return {
                status: true,
                data: messages,
                message: 'Mentioned messages retrieved successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                data: null,
                message: err.message
            };
        }
    }

    async create() {
        try {
            const [result]: any = await pool.query(
                'INSERT INTO messages (conversation_id, sender_id, reply_id, content, type, status, metadata, is_favorite, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [this.conversation_id, this.sender_id, this.reply_id, this.content, this.type, this.status, JSON.stringify(this.metadata), this.is_favorite, new Date()]
            );

            // If there are mentions in metadata, create them
            if ((this.metadata?.mentions ?? []).length > 0) {
                await this.createMention(result.insertId, (this.metadata?.mentions ?? []).map(mention => mention.userId));
            }

            return {
                status: true,
                data: { ...this, id: result.insertId },
                message: 'Message sent successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                data: null,
                message: err.message
            };
        }
    }

    async edit(messageId: number, content: string, type: MessageType = MessageType.TEXT, metadata?: MessageMetadata) {
        try {
            const metadataStr = metadata ? JSON.stringify(metadata) : undefined;
            
            await pool.query(
                `UPDATE messages 
                SET content = ?, type = ?, status = ?, metadata = ?, updated_at = NOW() 
                WHERE id = ?`,
                [content, type, MessageStatus.EDITED, metadataStr, messageId]
            );

            // Update mentions if provided in metadata
            if (metadata?.mentions?.length) {
                // Delete existing mentions
                await pool.query('DELETE FROM message_mentions WHERE message_id = ?', [messageId]);
                // Add new mentions
                await this.createMention(messageId, metadata.mentions.map(mention => mention.userId));
            }

            const [message]: any = await pool.query(
                'SELECT * FROM messages WHERE id = ?',
                [messageId]
            );

            return {
                status: true,
                data: message[0],
                message: 'Message edited successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                data: null,
                message: err.message
            };
        }
    }

    async delete(messageId: number) {
        try {
            await pool.query(
                `UPDATE messages 
                SET status = ?, content = '[This message was deleted]', updated_at = NOW() 
                WHERE id = ?`,
                [MessageStatus.DELETED, messageId]
            );

            return {
                status: true,
                message: 'Message deleted successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                message: err.message
            };
        }
    }

    async toggleFavorite(messageId: number) {
        try {
            await pool.query(
                `UPDATE messages 
                SET is_favorite = NOT is_favorite 
                WHERE id = ?`,
                [messageId]
            );

            const [message]: any = await pool.query(
                'SELECT * FROM messages WHERE id = ?',
                [messageId]
            );

            return {
                status: true,
                data: message[0],
                message: message[0].is_favorite ? 'Message added to favorites' : 'Message removed from favorites'
            };
        } catch (err: any) {
            return {
                status: false,
                message: err.message
            };
        }
    }

    async getFavoriteMessages(conversationId: number, userId: number) {
        try {
            const [messages]: any = await pool.query(
                `SELECT m.*, u.full_name as sender_name, u.avatar as sender_avatar
                FROM messages m
                LEFT JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = ? AND m.is_favorite = true
                ORDER BY m.created_at DESC`,
                [conversationId]
            );

            return {
                status: true,
                data: messages,
                message: 'Favorite messages retrieved successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                data: null,
                message: err.message
            };
        }
    }

    async searchMessages(conversationId: number, query: string) {
        try {
            const [messages]: any = await pool.query(
                `SELECT m.*, u.full_name as sender_name, u.avatar as sender_avatar
                FROM messages m
                LEFT JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = ? 
                AND m.status != ? 
                AND (
                    m.content LIKE ? 
                    OR m.metadata LIKE ?
                )
                ORDER BY m.created_at DESC`,
                [conversationId, MessageStatus.DELETED, `%${query}%`, `%${query}%`]
            );

            return {
                status: true,
                data: messages,
                message: 'Messages found successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                data: null,
                message: err.message
            };
        }
    }

    async getMessagesByConversationId(conversationId: number, page: number = 1, limit: number = 20) {
        try {
            const offset = (page - 1) * limit;
            const [messages]: any = await pool.query(
                `SELECT m.*, 
                    u.fullname as sender_name, 
                    u.avatar as sender_avatar,
                    GROUP_CONCAT(DISTINCT mm.user_id) as mentioned_user_ids
                FROM messages m
                LEFT JOIN users u ON m.sender_id = u.id
                LEFT JOIN message_mentions mm ON m.id = mm.message_id
                WHERE m.conversation_id = ?
                GROUP BY m.id
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?`,
                [conversationId, limit, offset]
            );

            // Parse metadata JSON and process mentions
            messages.forEach((message: any) => {
                try {
                    message.metadata = message.metadata ? JSON.parse(message.metadata) : {};
                    message.mentioned_users = message.mentioned_user_ids ? 
                        message.mentioned_user_ids.split(',').map(Number) : [];
                    delete message.mentioned_user_ids;
                } catch (error) {
                    message.metadata = {};
                    message.mentioned_users = [];
                }
            });

            const [total]: any = await pool.query(
                'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?',
                [conversationId]
            );

            return {
                status: true,
                data: messages,
                total: total[0].count,
                currentPage: page,
                totalPages: Math.ceil(total[0].count / limit),
                message: 'Messages retrieved successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                data: null,
                message: err.message
            };
        }
    }

    async getUnreadCount(userId: number, conversationId: number) {
        try {
            const [result]: any = await pool.query(
                `SELECT COUNT(*) as count 
                FROM messages m
                WHERE m.conversation_id = ? 
                AND m.sender_id != ?
                AND m.id NOT IN (
                    SELECT message_id FROM message_reads 
                    WHERE user_id = ?
                )`,
                [conversationId, userId, userId]
            );

            return {
                status: true,
                data: result[0].count,
                message: 'Unread count retrieved successfully'
            };
        } catch (err: any) {
            return {
                status: false,
                data: null,
                message: err.message
            };
        }
    }

    async markAsRead(messageId: number, userId: number) {
        try {
            await pool.query(
                'INSERT IGNORE INTO message_reads (message_id, user_id, read_at) VALUES (?, ?, ?)',
                [messageId, userId, new Date()]
            );

            return {
                status: true,
                message: 'Message marked as read'
            };
        } catch (err: any) {
            return {
                status: false,
                message: err.message
            };
        }
    }
}
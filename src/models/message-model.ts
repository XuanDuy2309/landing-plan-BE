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
    created_at?: string;
    updated_at?: string;

    constructor() { }

    async create() {
        try {
            const [result]: any = await pool.query(
                'INSERT INTO messages (conversation_id, sender_id, reply_id, content, type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [this.conversation_id, this.sender_id, this.reply_id, this.content, this.type, this.status, new Date()]
            );

            const [message]: any = await pool.query(
                `SELECT m.*,
                u.fullname AS sender_name,
                u.avatar AS sender_avatar,
                rm.content AS reply_content,
                rm.sender_id AS reply_sender_id,
                rm.type AS reply_type,
                ru.fullname AS reply_sender_name,
                ru.id AS reply_sender_id
                 FROM messages m
                 LEFT JOIN users u ON m.sender_id = u.id
                 LEFT JOIN messages rm ON m.reply_id = rm.id
                 LEFT JOIN users ru ON rm.sender_id = ru.id
                 WHERE m.id = ?`,
                [result.insertId]
            );

            return {
                status: true,
                data: { ...message[0] },
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

    async edit(messageId: number, content: string, type: MessageType = MessageType.TEXT) {
        try {
            await pool.query(
                `UPDATE messages 
                SET content = ?, type = ?, status = ?,  updated_at = NOW() 
                WHERE id = ?`,
                [content, type, MessageStatus.EDITED, messageId]
            );

            const [message]: any = await pool.query(
                `SELECT m.*,
                u.fullname AS sender_name,
                u.avatar AS sender_avatar,
                rm.content AS reply_content,
                rm.sender_id AS reply_sender_id,
                rm.type AS reply_type,
                ru.fullname AS reply_sender_name,
                ru.id AS reply_sender_id
                 FROM messages m
                 LEFT JOIN users u ON m.sender_id = u.id
                 LEFT JOIN messages rm ON m.reply_id = rm.id
                 LEFT JOIN users ru ON rm.sender_id = ru.id
                 WHERE m.id = ?`,
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
                SET status = ?, content = '[Tin nhắn đã bị xoá]', updated_at = NOW() 
                WHERE id = ?`,
                [MessageStatus.DELETED, messageId]
            );

            const [message]: any = await pool.query(
                `SELECT m.*,
                u.fullname AS sender_name,
                u.avatar AS sender_avatar,
                rm.content AS reply_content,
                rm.sender_id AS reply_sender_id,
                rm.type AS reply_type,
                ru.fullname AS reply_sender_name,
                ru.id AS reply_sender_id
                 FROM messages m
                 LEFT JOIN users u ON m.sender_id = u.id
                 LEFT JOIN messages rm ON m.reply_id = rm.id
                 LEFT JOIN users ru ON rm.sender_id = ru.id
                 WHERE m.id = ?`,
                [messageId]
            );

            return {
                data: message[0],
                status: true,
                message: 'Message deleted successfully'
            };
        } catch (err: any) {
            return {
                data: null,
                status: false,
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
                    u.fullname AS sender_name, 
                    u.avatar AS sender_avatar,
                    rm.content AS reply_content, 
                    rm.sender_id AS reply_sender_id,
                    rm.type AS reply_type,
                    ru.fullname AS reply_sender_name
                FROM messages m
                LEFT JOIN users u ON m.sender_id = u.id
                LEFT JOIN messages rm ON m.reply_id = rm.id
                LEFT JOIN users ru ON rm.sender_id = ru.id
                WHERE m.conversation_id = ?
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?`,
                [conversationId, limit, offset]
            );

            const [total]: any = await pool.query(
                'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?',
                [conversationId]
            );

            return {
                status: true,
                data: messages,
                total: total[0].count,
                page,
                page_size: limit,
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

    async getMentionedMessages(conversationId: number, userId: number, page: number = 1, limit: number = 20) {
        try {
            const offset = (page - 1) * limit;
            const [messages]: any = await pool.query(
                `SELECT 
                    m.*,
                    JSON_OBJECT(
                        'id', u.id,
                        'fullname', u.fullname,
                        'avatar', u.avatar
                    ) as sender
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = ?
                AND m.type = ?
                AND m.content LIKE ?
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?`,
                [conversationId, MessageType.MENTION, `%@${userId}%`, limit, offset]
            );

            const [total]: any = await pool.query(
                `SELECT COUNT(*) as count
                FROM messages
                WHERE conversation_id = ?
                AND type = ?
                AND content LIKE ?`,
                [conversationId, MessageType.MENTION, `%@${userId}%`]
            );

            return {
                status: true,
                data: messages,
                total: total[0].count,
                page,
                page_size: limit,

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

    async getMessageById(messageId: number) {
        try {
            const [message]: any = await pool.query(
                'SELECT *, u.fullname as sender_name FROM messages m LEFT JOIN users u ON sender_id = u.id WHERE m.id = ?',
                [messageId]
            );

            return {
                status: true,
                data: message[0],
                message: 'Message retrieved successfully'
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
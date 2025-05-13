import pool from "../config/db";

export const enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    File = 'file'
}

export class MessageModel {
    id?: number;
    conversation_id?: number;
    sender_id?: number;
    reply_id?: number;
    content?: string;
    type: MessageType = MessageType.TEXT;
    created_at?: string;
    constructor() { }

    async getAll(page: number = 1, page_size: number = 10, filters: any = {}) {
        const pageTemp = Number(page);
        const pageSize = Number(page_size);
        const offset = (pageTemp - 1) * pageSize;

        try {
            let whereClause = `WHERE m.conversation_id = ?`;
            const queryParams: any = [this.conversation_id];

            if (filters.query) {
                whereClause += ` AND m.type = 'text' AND m.content LIKE ?`;
                queryParams.push(`%${filters.query}%`);
            }

            const str = `
                SELECT 
                    m.*, 
                    u.fullname AS sender_name,
                    u.avatar AS sender_avatar,
                    r.id AS reply_id,
                    r.content AS reply_content,
                    r.type AS reply_type,
                    r.sender_id AS reply_sender_id
                FROM messages m
                LEFT JOIN users u ON m.sender_id = u.id
                LEFT JOIN messages r ON m.reply_id = r.id
                ${whereClause}
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?
            `;

            queryParams.push(pageSize, offset);

            const [rows]: any = await pool.query(str, queryParams);

            const [[total]]: any = await pool.query(
                `SELECT COUNT(*) as total FROM messages m ${whereClause}`,
                queryParams.slice(0, -2) // bỏ limit, offset
            );

            return {
                data: rows,
                total: total.total,
                page: pageTemp,
                totalPages: Math.ceil(total.total / pageSize),
                status: true,
                message: 'success'
            };
        } catch (err) {
            console.error(err);
            return { data: null, status: false, message: err };
        }
    }


    async create() {
        try {
            const [rows]: any = await pool.query('INSERT INTO messages SET ?', [this]);
            if (rows.length === 0) {
                return { data: null, status: false, message: "An error occurred" };
            }
            return { data: rows[0], status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }

    async checkIsSender() {
        try {
            const [rows]: any = await pool.query('SELECT * FROM messages WHERE id = ? AND sender_id = ?', [this.id, this.sender_id]);
            console.log(rows);
            return { data: rows[0], status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }

    async delete() {
        try {
            const [rows]: any = await pool.query('DELETE FROM messages WHERE id = ?', [this.id]);
            return { data: rows[0], status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }
}
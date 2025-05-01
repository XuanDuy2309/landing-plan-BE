import pool from "../config/db";

export const enum NotificationType {
    LIKE = 1,
    SET_BID = 2,
    MESSAGE = 3,
}

export class NotificationModel {
    id?: number;
    post_id?: number;
    receiver_id?: number;
    sender_id?: number;
    message?: string;
    is_read?: number;
    type?: NotificationType;
    created_at?: string;

    constructor() { }

    private buildOrderByClause(sort: string): string {
        // Giả định: sort = "newest" hoặc "oldest"
        if (sort === 'ASC') {
            return ` ORDER BY id ASC`;
        }

        // Mặc định: newest
        return ` ORDER BY id DESC`;
    }

    async getAllByUserId(user_id?: number, page: number = 1, page_size: number = 10, filters: any = {}) {
        const pageTemp = Number(page)
        const pageSize = Number(page_size)
        const offset = (pageTemp - 1) * pageSize;
        try {

            let queryParams: any = [user_id];
            const orderByClause = this.buildOrderByClause(filters.sort);
            const query = `
                SELECT 
                    n.*, 
                    u.fullname AS sender_name,
                    u.avatar AS sender_avatar 
                FROM notification n
                LEFT JOIN users u ON n.sender_id = u.id
                WHERE n.receiver_id = ?
                ${orderByClause}
                LIMIT ? OFFSET ?
            `;

            const countQuery = `
            SELECT COUNT(*) as total 
            FROM notification n 
            WHERE n.receiver_id = ?
        `;
            queryParams.push(pageSize, offset);

            const [rows] = await pool.query(query, queryParams);
            const [[totalCount]]: any = await pool.query(countQuery, [user_id]);
            return {
                data: rows,
                status: true,
                message: "success",
                page: pageTemp,
                page_size: pageSize,
                total: totalCount.total,
            };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }

    async create() {
        try {
            const [rows]: any = await pool.query('INSERT INTO notification SET ?', [this]);
            return { data: rows[0], status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }

    async readNotification() {
        try {
            const [rows]: any = await pool.query('UPDATE notification SET is_read = 1 WHERE id = ?', [this.id]);
            return { data: rows[0], status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }

    async readAllNotification() {
        try {
            const [rows]: any = await pool.query('UPDATE notification SET is_read = 1 WHERE receiver_id = ?', [this.receiver_id]);
            return { data: rows[0], status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }
}
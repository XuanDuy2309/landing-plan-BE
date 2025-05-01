import pool from "../config/db";

export class BidsModel {
    id?: number;
    post_id?: number;
    user_id?: number;
    price?: number;
    created_at?: Date;

    constructor() { }

    async getAllByPostId(post_id?: number) {
        try {
            const query = `
                SELECT 
                    ta.*, 
                    u.fullname AS user_name 
                FROM timeline_auction ta
                LEFT JOIN users u ON ta.user_id = u.id
                WHERE ta.post_id = ?
                ORDER BY id DESC
            `;
            const [rows] = await pool.query(query, [post_id]);
            return { data: rows, status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }

    async create() {
        try {
            const [rows]: any = await pool.query('INSERT INTO timeline_auction SET ?', [this]);
            return { data: rows[0], status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }
}
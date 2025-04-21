import pool from "../config/db";

export class PostLikeModel {
    id?: number;
    post_id?: number;
    create_by_id?: number
    constructor() { }

    async getAllByPostId(post_id?: number) {
        try {
            const [rows] = await pool.query('SELECT * FROM post_likes WHERE post_id = ?', [post_id]);
            return { data: rows, status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }

    async create() {
        try {
            const [rows]: any = await pool.query('INSERT INTO post_likes SET ?', [this]);
            return { data: rows[0], status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }

    async delete() {
        try {
            const [rows]: any = await pool.query('DELETE FROM post_likes WHERE post_id = ? AND create_by_id = ?', [this.post_id, this.create_by_id]);
            return { data: rows[0], status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }
}
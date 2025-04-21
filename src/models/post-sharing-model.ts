import pool from "../config/db";

export class PostSharingModel {
    id?: number;
    post_id?: number;
    create_by_id?: number
    constructor() { }

    async getAllByPostId(post_id?: number) {
        try {
            const [rows] = await pool.query('SELECT * FROM post_sharing WHERE post_id = ?', [post_id]);
            return { data: rows, status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }

    async create() {
        try {
            const [rows]: any = await pool.query('INSERT INTO post_sharing SET ?', [this]);
            return { data: rows[0], status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }
}
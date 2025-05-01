import pool from "../config/db";


export class FollowModel {
    id?: number;
    follower_id?: number;
    following_id?: number;

    constructor(follower_id?: number, following_id?: number) {
        this.follower_id = follower_id;
        this.following_id = following_id;
    }

    // Thêm follow
    async follow() {
        if (!this.follower_id || !this.following_id) throw new Error('Missing user IDs');
        if (this.follower_id === this.following_id) throw new Error('Cannot follow yourself');

        const sql = `INSERT IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)`;
        const [result] = await pool.query(sql, [this.follower_id, this.following_id]);
        return result;
    }

    // Hủy follow
    async unfollow() {
        if (!this.follower_id || !this.following_id) throw new Error('Missing user IDs');

        const sql = `DELETE FROM follows WHERE follower_id = ? AND following_id = ?`;
        const [result] = await pool.query(sql, [this.follower_id, this.following_id]);
        return result;
    }

    // Kiểm tra đã follow chưa
    async isFollowing(): Promise<boolean> {
        if (!this.follower_id || !this.following_id) throw new Error('Missing user IDs');

        const sql = `SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1`;
        const [rows] = await pool.query(sql, [this.follower_id, this.following_id]);
        return (rows as any[]).length > 0;
    }

    // Lấy danh sách followers của 1 user
    async getFollowers(user_id: number) {
        const sql = `
      SELECT u.*
      FROM follows f
      JOIN users u ON u.id = f.follower_id
      WHERE f.following_id = ?
    `;
        const [rows] = await pool.query(sql, [user_id]);
        return rows;
    }

    // Lấy danh sách followings của 1 user
    async getFollowings(user_id: number) {
        const sql = `
      SELECT u.*
      FROM follows f
      JOIN users u ON u.id = f.following_id
      WHERE f.follower_id = ?
    `;
        const [rows] = await pool.query(sql, [user_id]);
        return rows;
    }
}

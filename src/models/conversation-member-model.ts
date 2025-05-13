import pool from "../config/db";

export class ConversationMemberModel {
    id?: number;
    conversation_id?: number;
    user_id?: number;
    created_at?: string;
    constructor() { }

    async create(member_ids: number[], user_id?: number) {
        try {
            const values = [...member_ids, user_id].map(id => [this.conversation_id, id]);
            await pool.query(
                `INSERT INTO conversation_members (conversation_id, user_id)
                 VALUES ?`,
                [values]
            );
            return { data: member_ids, status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }

    async deleteMemberInConversation (conversation_id: number) {
        try {
            await pool.query(
                `DELETE FROM conversation_members WHERE conversation_id = ?`,
                [conversation_id]
            );
            return { data: conversation_id, status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }


    async getAllMemberInConversation (conversation_id: number) {
        try {
            const [rows]: any = await pool.query(
                `SELECT u.* FROM conversation_members cm
                JOIN users u ON cm.user_id = u.id
                WHERE cm.conversation_id = ?
                `,
                [conversation_id]
            );
            return { data: rows, status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }

    async leaveConversation (conversation_id: number, user_id: number) {
        try {
            await pool.query(
                `DELETE FROM conversation_members WHERE conversation_id = ? AND user_id = ?`,
                [conversation_id, user_id]
            );
            return { data: conversation_id, status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }

    async deleteMemberInConversationById (conversation_id: number, user_id: number) {
        try {
            await pool.query(
                `DELETE FROM conversation_members WHERE conversation_id = ? AND user_id = ?`,
                [conversation_id, user_id]
            );
            return { data: conversation_id, status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "An error occurred" };
        }
    }
    
}
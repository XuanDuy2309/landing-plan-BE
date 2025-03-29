import pool from "../config/db";

export class UploadModel {
    id?: number;
    link?: string;
    type?: string;
    group_id?: number;
    user_id?: number;
    constructor() { }

    async upload(links: string[], user_id?: number, type?: string) {
        const data = links.map((link: string) => {
            return [link, user_id, type]
        })
        return await pool.query('INSERT INTO uploads (link, user_id, type) VALUES ?', [data])
            .then(res => {
                return { data: links, status: true, message: 'success' }
            })
            .catch(err => {
                return { data: null, status: false, message: err }
            })
    }

    async getListMediaByUserID(id?: number, type?: string) {
        return await pool.query('SELECT * FROM uploads WHERE user_id = ? AND type = ?', [id, type])
            .then((res: any) => {
                return { data: [...res[0]], status: true, message: 'success' }
            })
            .catch(err => {
                return { data: null, status: false, message: err }
            })
    }

    async delete(id?: number) {
        return await pool.query('DELETE FROM uploads WHERE id = ?', [id])
            .then(res => {
                return { status: true, message: 'success' }
            })
            .catch(err => {
                return { status: false, message: err }
            })
    }
}
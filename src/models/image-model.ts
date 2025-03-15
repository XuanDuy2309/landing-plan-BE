import pool from "../config/db";

export class ImageModel {
    id?: number;
    link?: string;
    user_id?: number;
    constructor() { }

    async save(link?: string, user_id?: number) {
        return await pool.query('INSERT INTO images (link, user_id) VALUES (?, ?)', [link, user_id])
            .then(res => {
                return { data: link, status: true, message: 'success' }
            })
            .catch(err => {
                return { data: null, status: false, message: err }
            })
    }

    async getAll(id?: number) {
        return await pool.query('SELECT * FROM images WHERE user_id = ?', [id])
            .then((res:any) => {
                return { data: [...res[0]], status: true, message: 'success' }
            })
            .catch(err => {
                return { data: null, status: false, message: err }
            })
    }
}
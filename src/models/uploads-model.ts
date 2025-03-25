import pool from "../config/db";

export class ImageModel {
    id?: number;
    image_link?: string;
    video_link?: string;
    group_id?: number;
    user_id?: number;
    constructor() { }

    async saveImage(link?: string, user_id?: number) {
        return await pool.query('INSERT INTO uploads (image_link, user_id) VALUES (?, ?)', [link, user_id])
            .then(res => {
                return { data: link, status: true, message: 'success' }
            })
            .catch(err => {
                return { data: null, status: false, message: err }
            })
    }

    async saveListImage(links: string[], user_id?: number) {
        const data = links.map((link: string) => {
            return [link, user_id]
        })
        return await pool.query('INSERT INTO uploads (image_link, user_id) VALUES ?', [data])
            .then(res => {
                return { data: links, status: true, message: 'success' }
            })
            .catch(err => {
                return { data: null, status: false, message: err }
            })
    }

    async saveListVideo(links: string[], user_id?: number) {
        const data = links.map((link: string) => {
            return [link, user_id]
        })
        return await pool.query('INSERT INTO uploads (video_link, user_id) VALUES ?', [data])
            .then(res => {
                return { data: links, status: true, message: 'success' }
            })
            .catch(err => {
                return { data: null, status: false, message: err }
            })
    }

    async getAllImageByUserID(id?: number) {
        return await pool.query('SELECT id,image_link,user_id FROM uploads WHERE user_id = ? AND image_link is not null', [id])
            .then((res: any) => {
                return { data: [...res[0]], status: true, message: 'success' }
            })
            .catch(err => {
                return { data: null, status: false, message: err }
            })
    }

    async deleteImage(id?: number) {
        return await pool.query('DELETE FROM uploads WHERE id = ?', [id])
            .then(res => {
                return { status: true, message: 'success' }
            })
            .catch(err => {
                return { status: false, message: err }
            })
    }

    async saveVideo(link?: string, user_id?: number) {
        return await pool.query('INSERT INTO uploads (video_link, user_id) VALUES (?, ?)', [link, user_id])
            .then(res => {
                return { data: link, status: true, message: 'success' }
            })
            .catch(err => {
                return { data: null, status: false, message: err }
            })
    }

    async getAllVideoByUserID(id?: number) {
        return await pool.query('SELECT id,video_link,user_id FROM uploads WHERE user_id = ? AND video_link is not null', [id])
            .then((res: any) => {
                return { data: [...res[0]], status: true, message: 'success' }
            })
            .catch(err => {
                return { data: null, status: false, message: err }
            })
    }

    async deleteVideo(id?: number) {
        return await pool.query('DELETE FROM uploads WHERE id = ?', [id])
            .then(res => {
                return { status: true, message: 'success' }
            })
            .catch(err => {
                return { status: false, message: err }
            })
    }
}
import pool from "../config/db";

export class DistrictModel {
    id?: number;
    name?: string;
    gso_id?: number;
    province_id?: number;
    province_gso_id?: number;
    constructor() { }

    async getAll(page: number = 1, page_size: number = 10, query?: string) {
        const offset = (page - 1) * page_size;
        try {
            let sqlQuery = `SELECT * FROM districts`;
            let countQuery = `SELECT COUNT(*) as total FROM districts`;
            let queryParams: any[] = [];

            if (query) {
                sqlQuery += ` WHERE name LIKE ?`;
                countQuery += ` WHERE name LIKE ?`;
                queryParams.push(`%${query}%`);
            }

            sqlQuery += ` LIMIT ? OFFSET ?`;
            queryParams.push(page_size, offset);
            const [rows] = await pool.query(sqlQuery, queryParams);
            const [[totalCount]]: any = await pool.query(countQuery, queryParams.slice(0, -2));

            return {
                data: rows,
                status: true,
                message: 'success',
                total: totalCount.total,
                page,
                totalPages: Math.ceil(totalCount.total / page_size),
            };
        } catch (err) {
            return { data: null, status: false, message: err };
        }
    }

    async getAllByProvinceId(province_id?: number,page: number = 1, page_size: number = 10, query?: string) {
        const offset = (page - 1) * page_size;
        try {
            let sqlQuery = `SELECT * FROM districts WHERE province_id = ?`;
            let countQuery = `SELECT COUNT(*) as total FROM districts WHERE province_id = ?`;
            let queryParams: any[] = [province_id];

            if (query) {
                sqlQuery += ` AND name LIKE ?`;
                countQuery += ` AND name LIKE ?`;
                queryParams.push(`%${query}%`);
            }

            sqlQuery += ` LIMIT ? OFFSET ?`;
            queryParams.push(page_size, offset);
            const [rows] = await pool.query(sqlQuery, queryParams);
            const [[totalCount]]: any = await pool.query(countQuery, queryParams.slice(0, -2));

            return {
                data: rows,
                status: true,
                message: 'success',
                total: totalCount.total,
                page,
                totalPages: Math.ceil(totalCount.total / page_size),
            };
        } catch (err) {
            return { data: null, status: false, message: err };
        }
    }
}
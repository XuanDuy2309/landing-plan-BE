import pool from "../config/db";

export class ProvinceModel {
    id?: number;
    name?: string;
    gso_id?: string;

    constructor() {}

    async getAll(page: number = 1, page_size: number = 10, query?: string) {
        const offset = (page - 1) * page_size;
        try {
            let str = `SELECT * FROM provinces`;
            let countQuery = `SELECT COUNT(*) as total FROM provinces`;
            let queryParams: any[] = [];

            if (query) {
                str += ` WHERE name LIKE ?`;
                countQuery += ` WHERE name LIKE ?`;
                queryParams.push(`%${query}%`);
            }

            str += ` LIMIT ? OFFSET ?`;
            queryParams.push(page_size, offset);

            const [rows] = await pool.query(str, queryParams);
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

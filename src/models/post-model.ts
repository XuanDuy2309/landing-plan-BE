
import moment from "moment";
import pool from "../config/db";

export enum Type_Post {
    Public = 1,
    Follow = 2,
    Private = 3,
}

export enum Purpose_Post {
    For_Sell = 1,
    For_Rent = 2,
    For_Auction = 3
}

export enum Status_Post {
    Coming_Soon = 1,
    Process = 2,
    End = 3
}

export enum Direction_Land_Enum {
    North = 1,
    South = 2,
    East = 3,
    West = 4,
    North_West = 5,
    North_East = 6,
    South_West = 7,
    South_East = 8
}

export enum Type_Asset_Enum {
    Home = 1,
    Land = 2,
    Apartment = 3,
    Warehouse = 4,
    Office = 5,
    Motel = 6,
    Hotel = 7,
    Other = 8
}


export class PostModel {
    id?: number
    type: Type_Post = Type_Post.Public
    purpose: Purpose_Post = Purpose_Post.For_Sell
    type_asset?: Type_Asset_Enum = Type_Asset_Enum.Home
    type_landing_id?: number
    status?: Status_Post = Status_Post.Coming_Soon
    image_links?: string
    video_links?: string
    coordinates?: string
    direction_land: Direction_Land_Enum = Direction_Land_Enum.North
    area?: number
    width?: number
    height?: number
    price_for_buy?: number
    price_for_rent?: number
    price_start?: number
    price_current?: number
    bid_step?: number
    max_bid?: number
    start_date?: string
    end_date?: string
    number_floors?: number
    number_bedrooms?: number
    number_bathrooms?: number
    room_number?: number
    in_alley?: number
    title?: number
    description?: number
    lng?: number
    lat?: number
    address?: number
    owner_name?: number
    owner_phone?: number
    group_id?: number
    create_by_id?: number
    create_at: string = moment().format('YYYY-MM-DD HH:mm:ss')
    update_at?: string

    constructor() { }

    // Helper function to build WHERE clauses dynamically
    private buildWhereClause(filters: any, queryParams: any[]): string {
        const filterConditions: string[] = [];

        if (filters.query) {
            filterConditions.push(`p.address LIKE ?`);
            queryParams.push(`%${filters.query}%`);
        }

        if (filters.user_id) {
            filterConditions.push(`create_by_id = ?`);
            queryParams.push(filters.user_id);
        }

        if (filters.group_id) {
            filterConditions.push(`group_id = ?`);
            queryParams.push(filters.group_id);
        }

        if (filters.purpose && filters.purpose.length > 0) {
            const purposes = filters.purpose.split(',');
            const placeholders = purposes.map(() => '?').join(',');
            filterConditions.push(`purpose IN (${placeholders})`);
            queryParams.push(...purposes);
        }

        if (filters.type_landing_id && filters.type_landing_id.length > 0) {
            const typeLandingIds = filters.type_landing_id.split(',');
            const placeholders = typeLandingIds.map(() => '?').join(',');
            filterConditions.push(`type_landing_id IN (${placeholders})`);
            queryParams.push(...typeLandingIds);
        }

        if (filters.type_asset && filters.type_asset.length > 0) {
            const type_assets = filters.type_asset.split(',');
            const placeholders = type_assets.map(() => '?').join(',');
            filterConditions.push(`type_asset IN (${placeholders})`);
            queryParams.push(...type_assets);
        }

        if (filters.price_min !== undefined) {
            filterConditions.push(`price_for_buy >= ?`);
            queryParams.push(filters.price_min);
        }

        if (filters.price_max !== undefined) {
            filterConditions.push(`price_for_buy <= ?`);
            queryParams.push(filters.price_max);
        }

        if (filters.area_min !== undefined) {
            filterConditions.push(`area >= ?`);
            queryParams.push(filters.area_min);
        }

        if (filters.area_max !== undefined) {
            filterConditions.push(`area <= ?`);
            queryParams.push(filters.area_max);
        }

        if (filters.polygon !== undefined) {
            filterConditions.push(`ST_Contains(ST_GeomFromText(?), POINT(lng, lat))`);
            queryParams.push(filters.polygon);
        }

        if (filters.lng && filters.lat) {
            const range = filters.range || 100;
            filterConditions.push(`ST_Distance_Sphere(POINT(p.lng, p.lat),POINT(?, ?)) <= ${range}`);
            queryParams.push(Number(filters.lng), Number(filters.lat));
        }

        // Only add WHERE if there are conditions
        return filterConditions.length > 0 ? `WHERE ${filterConditions.join(' AND ')}` : '';
    }

    private buildOrderByClause(sort: string): string {
        if (sort === 'ASC') {
            return `ORDER BY id ASC`;
        }
        return `ORDER BY id DESC`; // Default to DESC
    }

    private buildCreateQuery() {
        let fields: string[] = [];
        let values: string[] = [];
        let params: any[] = [];
        if (this.type) {
            fields.push(`type`);
            values.push(`?`);
            params.push(this.type);
        }
        if (this.purpose) {
            fields.push(`purpose`);
            values.push(`?`);
            params.push(this.purpose);
        }
        if (this.type_asset) {
            fields.push(`type_asset`);
            values.push(`?`);
            params.push(this.type_asset);
        }
        if (this.status) {
            fields.push(`status`);
            values.push(`?`);
            params.push(this.status);
        }
        if (this.image_links) {
            fields.push(`image_links`);
            values.push(`?`);
            params.push(this.image_links);
        }
        if (this.video_links) {
            fields.push(`video_links`);
            values.push(`?`);
            params.push(this.video_links);
        }
        if (this.direction_land) {
            fields.push(`direction_land`);
            values.push(`?`);
            params.push(this.direction_land);
        }
        if (this.area) {
            fields.push(`area`);
            values.push(`?`);
            params.push(this.area);
        }
        if (this.width) {
            fields.push(`width`);
            values.push(`?`);
            params.push(this.width);
        }
        if (this.height) {
            fields.push(`height`);
            values.push(`?`);
            params.push(this.height);
        }
        if (this.price_for_buy) {
            fields.push(`price_for_buy`);
            values.push(`?`);
            params.push(this.price_for_buy);
        }
        if (this.price_for_rent) {
            fields.push(`price_for_rent`);
            values.push(`?`);
            params.push(this.price_for_rent);
        }
        if (this.price_start) {
            fields.push(`price_start`);
            values.push(`?`);
            params.push(this.price_start);
        }
        if (this.price_current) {
            fields.push(`price_current`);
            values.push(`?`);
            params.push(this.price_current);
        }
        if (this.bid_step) {
            fields.push(`bid_step`);
            values.push(`?`);
            params.push(this.bid_step);
        }
        if (this.max_bid) {
            fields.push(`max_bid`);
            values.push(`?`);
            params.push(this.max_bid);
        }
        if (this.start_date) {
            fields.push(`start_date`);
            values.push(`?`);
            params.push(this.start_date);
        }
        if (this.end_date) {
            fields.push(`end_date`);
            values.push(`?`);
            params.push(this.end_date);
        }
        if (this.number_floors) {
            fields.push(`number_floors`);
            values.push(`?`);
            params.push(this.number_floors);
        }
        if (this.number_bedrooms) {
            fields.push(`number_bedrooms`);
            values.push(`?`);
            params.push(this.number_bedrooms);
        }
        if (this.number_bathrooms) {
            fields.push(`number_bathrooms`);
            values.push(`?`);
            params.push(this.number_bathrooms);
        }
        if (this.room_number) {
            fields.push(`room_number`);
            values.push(`?`);
            params.push(this.room_number);
        }
        if (this.in_alley) {
            fields.push(`in_alley`);
            values.push(`?`);
            params.push(this.in_alley);
        }
        if (this.title) {
            fields.push(`title`);
            values.push(`?`);
            params.push(this.title);
        }
        if (this.description) {
            fields.push(`description`);
            values.push(`?`);
            params.push(this.description);
        }
        if (this.lng) {
            fields.push(`lng`);
            values.push(`?`);
            params.push(this.lng);
        }
        if (this.lat) {
            fields.push(`lat`);
            values.push(`?`);
            params.push(this.lat);
        }
        if (this.address) {
            fields.push(`address`);
            values.push(`?`);
            params.push(this.address);
        }
        if (this.owner_name) {
            fields.push(`owner_name`);
            values.push(`?`);
            params.push(this.owner_name);
        }
        if (this.owner_phone) {
            fields.push(`owner_phone`);
            values.push(`?`);
            params.push(this.owner_phone);
        }
        if (this.group_id) {
            fields.push(`group_id`);
            values.push(`?`);
            params.push(this.group_id);
        }
        if (this.create_by_id) {
            fields.push(`create_by_id`);
            values.push(`?`);
            params.push(this.create_by_id);
        }
        if (this.update_at) {
            fields.push(`update_at`);
            values.push(`?`);
            params.push(this.update_at);
        }
        if (this.type_landing_id) {
            fields.push(`type_landing_id`);
            values.push(`?`);
            params.push(this.type_landing_id);
        }
        return {
            fields,
            values,
            params,
        };
    }

    private toWKTFromCoordinates(coords: [number, number][]): string {
        if (coords.length === 1) {
            const [lng, lat] = coords[0];
            return `POINT(${lng} ${lat})`;
        } else if (coords.length === 2) {
            const coordStr = coords.map(([lng, lat]) => `${lng} ${lat}`).join(", ");
            return `LINESTRING(${coordStr})`;
        } else if (coords.length > 2) {
            // Đảm bảo polygon khép kín (điểm đầu = điểm cuối)
            const isClosed = coords[0][0] === coords[coords.length - 1][0] &&
                coords[0][1] === coords[coords.length - 1][1];
            if (!isClosed) {
                coords.push(coords[0]); // khép kín polygon
            }
            const coordStr = coords.map(([lng, lat]) => `${lng} ${lat}`).join(", ");
            return `POLYGON((${coordStr}))`;
        } else {
            throw new Error("Tọa độ không hợp lệ để tạo WKT");
        }
    }


    async getAll(page: number = 1, page_size: number = 10, filters: any = {}) {
        const pageTemp = Number(page)
        const pageSize = Number(page_size)
        const offset = (pageTemp - 1) * pageSize;
        try {
            let queryParams: any = [];
            const whereClause = this.buildWhereClause(filters, queryParams);
            const orderByClause = this.buildOrderByClause(filters.sort);

            const query = `
                SELECT
                    p.*,
                    u.fullname AS create_by_name,
                    u.email AS create_by_email,
                    u.phone_number AS create_by_phone,
                    u.avatar AS create_by_avatar,
                    (SELECT GROUP_CONCAT(lp.create_by_id) FROM post_likes lp WHERE lp.post_id = p.id) AS like_by_ids,
                    (SELECT COUNT(*) FROM post_sharing sp WHERE sp.post_id = p.id) AS share_count,
                    t.name AS type_landing_name,
                    t.code AS type_landing_code,
                    t.color AS type_landing_color
                FROM posts p
                LEFT JOIN users u ON p.create_by_id = u.id
                LEFT JOIN land_types t ON p.type_landing_id = t.id
                ${whereClause}
                ${orderByClause}
                LIMIT ? OFFSET ?
            `;

            const countQuery = `SELECT COUNT(*) as total FROM posts p ${whereClause}`;
            queryParams.push(pageSize, offset);

            const [rows]: any = await pool.query(query, queryParams);
            const [[totalCount]]: any = await pool.query(countQuery, queryParams.slice(0, -2));
            return {
                data: rows.map((row: any) => ({
                    ...row,
                    coordinates: row.coordinates ? (row.coordinates[0] as { x: number; y: number }[]).map((coord: { x: number; y: number }) => [coord.x, coord.y]) : [],
                    image_links: row.image_links ? JSON.parse(row.image_links) : [],
                    video_links: row.video_links ? JSON.parse(row.video_links) : [],
                    like_by_ids: row.like_by_ids ? row.like_by_ids.split(',').map(Number) : [],
                    share_count: row.share_count || 0,
                })),
                status: true,
                message: 'success',
                total: totalCount.total,
                page: pageTemp,
                page_size: pageSize,
            };
        } catch (err: any) {
            console.log(err)
            return { data: null, status: false, message: err.message || 'Failed to fetch posts' };
        }
    }

    async getDetailPost(post_id?: number) {
        try {
            const query = `
                SELECT
                    p.*,
                    u.fullname AS create_by_name,
                    u.email AS create_by_email,
                    u.phone_number AS create_by_phone,
                    u.avatar AS create_by_avatar,
                    t.name AS type_landing_name,
                    t.code AS type_landing_code,
                    t.color AS type_landing_color,
                    (SELECT GROUP_CONCAT(lp.create_by_id) FROM post_likes lp WHERE lp.post_id = p.id) AS like_by_ids,
                    (SELECT COUNT(*) FROM post_sharing sp WHERE sp.post_id = p.id) AS share_count
                FROM posts p
                LEFT JOIN land_types t ON p.type_landing_id = t.id
                LEFT JOIN users u ON p.create_by_id = u.id
                WHERE p.id = ?
            `;
            const [rows]: any = await pool.query(query, [post_id]);
            if (rows.length === 0) {
                return { data: null, status: false, message: "Post not found" };
            }
            const post = rows[0];
            post.image_links = post.image_links ? JSON.parse(post.image_links) : [];
            post.video_links = post.video_links ? JSON.parse(post.video_links) : [];
            post.coordinates = post.coordinates ? (post.coordinates[0] as { x: number; y: number }[]).map((coord: { x: number; y: number }) => `${coord.x} ${coord.y}`) : []
            post.like_by_ids = post.like_by_ids ? post.like_by_ids.split(',').map(Number) : [];
            post.share_count = post.share_count || 0;
            return { data: post, status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "Failed to fetch post details" };
        }
    }

    async createPost() {
        try {

            let { fields, values, params } = this.buildCreateQuery();
            if (this.coordinates) {
                fields.push(`coordinates`);
                values.push(`ST_GeomFromText(?)`);
                params.push(this.coordinates);
            }

            fields.push(`create_at`);
            values.push(`?`);
            params.push(this.create_at);

            console.log("fields", fields);

            const query = `INSERT INTO posts (${fields.join(", ")}) VALUES (${values.join(", ")})`;
            const [rows]: any = await pool.query(query, params);
            return { data: { ...this, id: rows.insertId }, status: true, message: "Post created successfully" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "Failed to create post" };
        }
    }

    async updatePost() {
        try {

            let { fields, values, params } = this.buildCreateQuery();
            let str = fields.join(" = ?, ") + " = ?";

            if (this.coordinates) {
                str += `, coordinates = ST_GeomFromText(?)`;
                params.push(this.toWKTFromCoordinates(this.coordinates as any));
            }
            const query = `UPDATE posts SET ${str} WHERE id = ?`;
            params.push(this.id);

            const [result]: any = await pool.query(query, params);
            return { data: result, status: true, message: "Post updated successfully" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "Failed to update post" };
        }
    }

    async deletePost() {
        try {
            const [rows]: any = await pool.query('DELETE FROM posts WHERE id = ?', [this.id]);
            return { data: rows[0], status: true, message: "success" };
        } catch (err) {
            return { data: null, status: false, message: err }
        }
    }

    async getLikedAndSharedPosts(user_id: number, page: number = 1, page_size: number = 10, filters: any = {}) {
        const pageTemp = Number(page);
        const pageSize = Number(page_size);
        const offset = (pageTemp - 1) * pageSize;

        try {
            user_id = Number(user_id);
            let queryParams: any = [user_id, user_id];
            const whereClause = this.buildWhereClause(filters, queryParams);
            const orderByClause = this.buildOrderByClause(filters.sort || 'DESC');

            const query = `
                SELECT DISTINCT
                    p.*,
                    u.fullname AS create_by_name,
                    u.email AS create_by_email,
                    u.avatar AS create_by_avatar,
                    t.name AS type_landing_name,
                    t.code AS type_landing_code,
                    t.color AS type_landing_color,
                    (SELECT GROUP_CONCAT(lp.create_by_id) FROM post_likes lp WHERE lp.post_id = p.id) AS like_by_ids,
                    (SELECT GROUP_CONCAT(ps.create_by_id) FROM post_sharing ps WHERE ps.post_id = p.id) AS share_by_ids
                FROM posts p
                LEFT JOIN land_types t ON p.type_landing_id = t.id
                LEFT JOIN users u ON p.create_by_id = u.id
                JOIN (
                    SELECT post_id FROM post_likes WHERE create_by_id = ?
                    UNION
                    SELECT post_id FROM post_sharing WHERE create_by_id = ?
                ) AS liked_or_shared ON p.id = liked_or_shared.post_id
                ${whereClause}
                ${orderByClause}
                LIMIT ? OFFSET ?
            `;

            const countQuery = `
                SELECT COUNT(*) as total
                FROM (
                    SELECT DISTINCT p.id
                    FROM posts p
                    JOIN (
                        SELECT post_id FROM post_likes WHERE create_by_id = ?
                        UNION
                        SELECT post_id FROM post_sharing WHERE create_by_id = ?
                    ) AS liked_or_shared ON p.id = liked_or_shared.post_id
                    ${whereClause}
                ) AS sub
            `;

            queryParams.push(pageSize, offset);

            const [rows]: any = await pool.query(query, queryParams);
            const [[totalCount]]: any = await pool.query(countQuery, [user_id, user_id, ...queryParams.slice(2, -2)]);

            return {
                data: rows.map((row: any) => ({
                    ...row,
                    video_links: row.video_links ? JSON.parse(row.video_links) : [],
                    image_links: row.image_links ? JSON.parse(row.image_links) : [],
                    like_by_ids: row.like_by_ids ? row.like_by_ids.split(',').map(Number) : [],
                    share_by_ids: row.share_by_ids ? row.share_by_ids.split(',').map(Number) : [],
                    name: row.create_by_name,
                    email: row.create_by_email,
                    avatar: row.create_by_avatar,
                })),
                status: true,
                message: 'success',
                page: pageTemp,
                total: totalCount.total,
                page_size: pageSize,
            };
        } catch (err: any) {
            console.error('SQL Error:', err.message);
            return { data: null, status: false, message: err.message || 'Failed to fetch liked and shared posts' };
        }
    }

    async getListTypePost(query: string = '') {
        try {
            const sql = `
                SELECT id, name, code, color
                FROM land_types
                WHERE name LIKE ? OR code LIKE ?
                ORDER BY id ASC
            `;
            const [rows]: any = await pool.query(sql, [`%${query}%`, `%${query}%`]);
            return { data: rows, status: true, message: "success" };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || "Failed to fetch land types" };
        }

    }
}

import bcrypt from "bcrypt";
import pool from "../config/db";

export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
    OTHER = 'other',
}

export enum Role {
    ADMIN = 'admin',
    USER = 'user'
}

export enum Status {
    ACTIVE = 'active',
    INACTIVE = 'inactive'
}

export class UserModel {
    id?: number;
    username?: string;
    password?: string;
    confirm_password?: string;
    fullname?: string;
    phone_number?: string;
    address?: string;
    gender?: Gender = Gender.MALE;
    dob?: string;
    email?: string;
    avatar?: string;
    background?: string;
    role?: Role = Role.USER;
    status?: Status = Status.ACTIVE;
    created_at?: Date;

    constructor() {

    }

    async getAll(page: number = 1, page_size: number = 10, filters: any = {}, sort: string = 'DESC') {
        const pageTemp = Number(page)
        const pageSize = Number(page_size)
        const offset = (pageTemp - 1) * pageSize;
        try {
            let queryParams: any = [];
            let whereClause = 'WHERE 1=1';

            // Áp dụng bộ lọc
            if (filters.query) {
                whereClause += ' AND fullname LIKE ?';
                queryParams.push(`%${filters.query}%`);
            }
            if (filters.email) {
                whereClause += ' AND email LIKE ?';
                queryParams.push(`%${filters.email}%`);
            }
            if (filters.phone_number) {
                whereClause += ' AND phone_number = ?';
                queryParams.push(filters.phone_number);
            }
            if (filters.role) {
                whereClause += ' AND role = ?';
                queryParams.push(filters.role);
            }

            if (filters.excludeIds) {
                const excludeIds = Array.isArray(filters.excludeIds) ? filters.excludeIds : filters.excludeIds.split(',').map((id: any) => Number(id));
                if (excludeIds.length > 0) {
                    whereClause += ' AND id NOT IN (' + excludeIds.map((id: number) => '?').join(',') + ')';
                    queryParams.push(...excludeIds);
                }
            }

            // Sắp xếp
            const orderByClause = `ORDER BY id ${sort}`;

            // Truy vấn chính
            const query = `
                SELECT 
                    u.*,
                    (SELECT GROUP_CONCAT(following_id) FROM follows WHERE follower_id = u.id) AS following_ids,
                    (SELECT GROUP_CONCAT(follower_id) FROM follows WHERE following_id = u.id) AS follower_ids
                FROM users u
                ${whereClause}
                ${orderByClause}
                LIMIT ? OFFSET ?
            `;

            const countQuery = `
                SELECT COUNT(*) as total
                FROM users
                ${whereClause}
            `;

            queryParams.push(pageSize, offset);

            const [rows]: any = await pool.query(query, queryParams);
            const [[totalCount]]: any = await pool.query(countQuery, queryParams.slice(0, -2));

            return {
                data: rows.map((row: any) => ({
                    ...row,
                    following_ids: row.following_ids ? row.following_ids.split(',').map(Number) : [],
                    follower_ids: row.follower_ids ? row.follower_ids.split(',').map(Number) : [],
                })),
                status: true,
                message: 'success',
                page: pageTemp,
                total: totalCount.total,
                totalPages: Math.ceil(totalCount.total / pageSize),
            };
        } catch (err: any) {
            return { data: null, status: false, message: err.message || 'Failed to fetch users' };
        }
    }

    async findUserById(id?: number) {
        try {
            const [rows]: any = await pool.query(`
    SELECT 
        u.*, 
        (SELECT GROUP_CONCAT(following_id) FROM follows WHERE follower_id = u.id) AS following_ids,
        (SELECT GROUP_CONCAT(follower_id) FROM follows WHERE following_id = u.id) AS follower_ids
    FROM users u 
    WHERE u.id = ?
`, [id]);


            return {
                data: {
                    ...rows[0],
                    following_ids: rows[0].following_ids ? rows[0].following_ids.split(',').map(Number) : [],
                    follower_ids: rows[0].follower_ids ? rows[0].follower_ids.split(',').map(Number) : [],
                }, status: true, message: "success"
            };
        } catch (err) {
            return { data: null, status: false, message: err }
        }
    }

    async checkInvalidUser() {
        try {
            let [rows]: any = await pool.query('SELECT * FROM users WHERE username = ?', [this.username]);
            if (rows.length > 0) {
                return { status: true, message: "Invalid username" }
            }
            [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [this.email]);
            if (rows.length > 0) {
                return { status: true, message: "Invalid email" }
            }
            [rows] = await pool.query('SELECT * FROM users WHERE phone_number = ?', [this.phone_number]);
            if (rows.length > 0) {
                return { status: true, message: "Invalid phone_number" }
            }
            return { status: false, message: "success" }
        } catch (err) {
            return { status: false, message: err }
        }
    }

    async getUserByUserName(username?: string) {
        try {
            const [rows]: any = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
            this.id = rows[0].id
            this.username = rows[0].username
            this.fullname = rows[0].fullname
            this.phone_number = rows[0].phone_number
            this.address = rows[0].address
            this.dob = rows[0].dob
            this.gender = rows[0].gender
            this.email = rows[0].email
            this.avatar = rows[0].avatar
            this.background = rows[0].background
            this.role = rows[0].role
            this.status = rows[0].status
            this.password = rows[0].password
            this.created_at = rows[0].created_at
            return {
                data: this, status: true, message: "success"
            };
        } catch (err) {
            return { data: null, status: false, message: err }
        }
    }


    async save() {
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password || '', salt);

            const [result]: any = await pool.query(
                'INSERT INTO users (username, password, fullname, phone_number, gender, email, avatar,background, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [this.username, this.password, this.fullname, this.phone_number, this.gender, this.email, this.avatar, this.background, this.role, this.status, this.created_at]
            );

            const data = await this.findUserById(result.insertId);

            return {
                ...data
            };

        } catch (err) {
            return { data: null, status: false, message: err }
        }
    }

    async updateInfo() {
        try {
            const [rows] = await pool.query('UPDATE users SET fullname = ?, phone_number = ?, address = ?,dob=?, gender = ?, email = ?, role = ?, status = ? WHERE id = ?',
                [this.fullname, this.phone_number, this.address, this.dob, this.gender, this.email, this.role, this.status, this.id]);
            return {
                data: {
                    id: this.id,
                    username: this.username,
                    fullname: this.fullname,
                    phone_number: this.phone_number,
                    address: this.address,
                    dob: this.dob,
                    gender: this.gender,
                    email: this.email,
                    avatar: this.avatar,
                    role: this.role,
                    status: this.status,
                    created_at: this.created_at
                }, status: true, message: "success"
            };
        } catch (err) {
            return { data: null, status: false, message: err }
        }
    }

    async changePassword(newPassword?: string) {
        try {
            bcrypt.genSalt(10, (err, salt) => {
                if (err) {
                    return { data: null, status: false, message: err }
                }
                bcrypt.hash(newPassword || '', salt, async (err, hash) => {
                    if (err) {
                        return { data: null, status: false, message: err }
                    }
                    const [rows] = await pool.query('UPDATE users SET password = ? WHERE id = ?',
                        [hash, this.id]);
                    return { status: true, message: "success" };
                })
            })

        } catch (err) {
            return { status: false, message: err }
        }
    }

    async changeAvatar(newAvatar?: string) {
        try {
            const [rows] = await pool.query('UPDATE users SET avatar = ? WHERE id = ?',
                [newAvatar, this.id]);
            return { data: newAvatar, status: true, message: "success" };
        } catch (err) {
            return { data: null, status: false, message: err }
        }
    }

    async deleteAvatar() {
        try {
            const [rows] = await pool.query('UPDATE users SET avatar = ? WHERE id = ?',
                [null, this.id]);
            return { status: true, message: "success" };
        } catch (err) {
            return { status: false, message: err }
        }
    }

    async changeBackground(newBackground?: string) {
        try {
            const [rows] = await pool.query('UPDATE users SET background = ? WHERE id = ?',
                [newBackground, this.id]);
            return { data: newBackground, status: true, message: "success" };
        } catch (err) {
            return { data: null, status: false, message: err }
        }
    }

    async deleteBackground() {
        try {
            const [rows] = await pool.query('UPDATE users SET background = ? WHERE id = ?',
                [null, this.id]);
            return { status: true, message: "success" };
        } catch (err) {
            return { status: false, message: err }
        }
    }


}
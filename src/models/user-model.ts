
import bcrypt from "bcrypt";
import moment from "moment";
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
    last_login: moment.Moment = moment();

    constructor() {

    }

    async updateLastLogin() {
        try {
            const [rows] = await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [this.id]);
            return { status: true, message: 'success' };
        } catch (err) {
            return { status: false, message: err };
        }
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
            if (filters.status) {
                whereClause += ' AND status = ?'
                queryParams.push(filters.status)
            }

            console.log(whereClause, queryParams)

            if (filters.excludeIds) {
                const excludeIds = Array.isArray(filters.excludeIds) ? filters.excludeIds : filters.excludeIds.split(',').map((id: any) => Number(id));
                if (excludeIds.length > 0) {
                    whereClause += ' AND id NOT IN (' + excludeIds.map((id: number) => '?').join(',') + ')';
                    queryParams.push(...excludeIds);
                }
            }

            // Sắp xếp
            let orderByClause = `ORDER BY id ${sort}`;
            if (filters.last_login) {
                orderByClause = 'ORDER BY last_login DESC';
            }

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
                page_size
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
                return { status: true, message: "Username đã được sử dụng" }
            }
            [rows] = await pool.query('SELECT * FROM users WHERE phone_number = ?', [this.phone_number]);
            if (rows.length > 0) {
                return { status: true, message: "Số điện thoại đã được sử dụng" }
            }
            return { data: null, status: false, message: "Người dùng không tồn tại" }
        } catch (err) {
            return { status: false, message: err }
        }
    }

    async getUserByUserName(username?: string) {
        try {
            const [rows]: any = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
            return {
                data: rows[0], status: true, message: "success"
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
                'INSERT INTO users (username, password, fullname, phone_number, gender, email,last_login, avatar,background, role, status, created_at, dob) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)',
                [this.username, this.password, this.fullname, this.phone_number, this.gender, this.email, moment(this.last_login).format("YYYY/MM/DD"), this.avatar, this.background, this.role, this.status, moment(this.created_at).format("YYYY/MM/DD"), moment(this.dob).format("YYYY/MM/DD")]
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
            const [rows] = await pool.query('UPDATE users SET fullname = ?, phone_number = ?, address = ?, dob=?, gender = ?, email = ?, role = ?, status = ? WHERE id = ?',
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

    async getCountUser() {
        try {
            const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM users')
            return {
                data: rows[0].count,
                status: true,
                message: 'ok'
            }
        }
        catch (err) {
            return { status: false, message: err }
        }
    }

    async toggleStatus() {
        try {
            const [result] = await pool.query(
                `UPDATE users SET status = ? WHERE id = ?`,
                [this.status, this.id]
            );
            return {
                status: true,
                message: 'Cập nhật trạng thái thành công',
                data: result
            };
        } catch (error) {
            return {
                status: false,
                message: 'Lỗi khi cập nhật trạng thái',
                error
            };
        }
    }

}

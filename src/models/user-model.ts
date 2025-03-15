import pool from "../config/db";
import bcrypt from "bcrypt";

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
    gender?: Gender = Gender.MALE;
    email?: string;
    avatar?: string;
    background?: string;
    role?: Role = Role.USER;
    status?: Status = Status.ACTIVE;
    created_at?: Date;

    constructor() {

    }

    async getAll() {
        try {
            const [rows] = await pool.query('SELECT * FROM users');
            return { data: rows, status: true, message: "success" };
        } catch (err) {
            return { data: null, status: false, message: err }
        }
    }

    async findUserById(id?: number) {
        try {
            const [rows]: any = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
            this.id = rows[0].id
            this.username = rows[0].username
            this.fullname = rows[0].fullname
            this.phone_number = rows[0].phone_number
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
                'INSERT INTO users (username, password, fullname, phone_number, gender, email, avatar,background, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
            const [rows] = await pool.query('UPDATE users SET fullname = ?, phone_number = ?, gender = ?, email = ?, role = ?, status = ? WHERE id = ?',
                [this.fullname, this.phone_number, this.gender, this.email, this.role, this.status, this.id]);
            return {
                data: {
                    id: this.id,
                    username: this.username,
                    fullname: this.fullname,
                    phone_number: this.phone_number,
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
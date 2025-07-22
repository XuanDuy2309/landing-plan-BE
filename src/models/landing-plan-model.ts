import pool from "../config/db";
import { Status } from "./user-model";

export class LandingPlanModel {
    id?: number;
    name?: string;
    description?: string;
    folder_path?: string;
    bounds?: number[][];
    province_id?: number;
    district_id?: number;
    ward_id?: number;
    created_at?: string;
    lat?: number;
    lng?: number;

    constructor() {

    }
    async getListMap(filters: any = {}, page: number = 1, page_size: number = 10) {
        const pageTemp = Number(page)
        const pageSize = Number(page_size)
        const offset = (pageTemp - 1) * pageSize;
        try {
            let params: any = []

            if (filters.query) {
                params = [filters.query]
            }

            params.push(pageSize, offset)
            const [rows]: any = await pool.query(`SELECT 
                *
                FROM planning_maps
                ${filters.query ? 'WHERE name like ?' : ''}
                LIMIT ? OFFSET ?
                `, params);
            const countQuery = `SELECT COUNT(*) as total FROM planning_maps ${filters.query ? 'WHERE name like ?' : ''}`;
            const [[totalCount]]: any = await pool.query(countQuery, params.slice(0, -2))

            // const results = rows.map((row: any) => {
            //     const polygonText = row?.bounds.replace("POLYGON((", "").replace("))", "");
            //     const pointsArray: number[][] = polygonText.split(",").map((point: string) => {
            //         const [lng, lat] = point.trim().split(" ").map(Number);
            //         return [lat, lng];
            //     });

            //     return {
            //         id: row.id,
            //         name: row.name,
            //         description: row.description,
            //         folder_path: row.folder_path,
            //         bounds: pointsArray,
            //         province_id: row.province_id,
            //         district_id: row.district_id,
            //         ward_id: row.ward_id,
            //         created_at: row.created_at,
            //         lat: row.lat,
            //         lng: row.lng
            //     };
            // });

            return {
                data: rows,
                status: true,
                message: 'success',
                total: totalCount.total,
                page: pageTemp,
                page_size: pageSize,
            }

        } catch (e: any) {
            return {
                data: null,
                status: false,
                message: e.message
            }
        }

    }

    async findMapByLatLon(lat: number, lon: number) {
        const query = `
          SELECT
            id,
            name,
            description,
            folder_path,
            ST_AsText(bounds) AS bounds,
            province_id,
            district_id,
            ward_id,
            created_at
          FROM planning_maps
          WHERE ST_Contains(bounds, ST_GeomFromText(?))
          LIMIT 1
        `;

        const pointWKT = `POINT(${lon} ${lat})`;

        try {
            const [rows]: any = await pool.query(query, [pointWKT]);

            if (rows.length === 0) {
                return {
                    data: null,
                    status: false,
                    message: "Không tìm thấy bản đồ quy hoạch cho vị trí này."
                };
            }

            const row = rows[0];

            // Xử lý bounds (POLYGON) từ WKT sang array [lat, lon][]
            const polygonText = row.bounds.replace("POLYGON((", "").replace("))", "");
            const pointsArray: number[][] = polygonText.split(",").map((point: string) => {
                const [lng, lat] = point.trim().split(" ").map(Number);
                return [lat, lng]; // đảo thứ tự thành [lat, lon]
            });

            // Gán dữ liệu vào instance
            this.id = row.id;
            this.name = row.name;
            this.description = row.description;
            this.folder_path = row.folder_path;
            this.bounds = pointsArray;
            this.province_id = row.province_id;
            this.district_id = row.district_id;
            this.ward_id = row.ward_id;
            this.created_at = row.created_at;
            this.lat = lat;
            this.lng = lon;

            return {
                data: [this],
                status: true,
                message: "success"
            };

        } catch (error: any) {
            return {
                data: null,
                status: false,
                message: error.message || "An error occurred"
            };
        }
    }

    async listMapInRange(lat: number, lon: number, range: number) {
        const radiusDegrees = range / 111320;
        const query = `
          SELECT
            id,
            name,
            description,
            folder_path,
            ST_AsText(bounds) AS bounds,
            province_id,
            district_id,
            ward_id,
            created_at,
            lat,
            lng
          FROM planning_maps
          WHERE ST_Intersects(
            bounds,
            ST_Buffer(
              ST_GeomFromText(?),
              ?
            )
          )
        `;

        const pointWKT = `POINT(${lon} ${lat})`;

        try {
            const [rows]: any = await pool.query(query, [pointWKT, radiusDegrees]);

            const results = rows.map((row: any) => {
                const polygonText = row.bounds.replace("POLYGON((", "").replace("))", "");
                const pointsArray: number[][] = polygonText.split(",").map((point: string) => {
                    const [lng, lat] = point.trim().split(" ").map(Number);
                    return [lat, lng];
                });

                return {
                    id: row.id,
                    name: row.name,
                    description: row.description,
                    folder_path: row.folder_path,
                    bounds: pointsArray,
                    province_id: row.province_id,
                    district_id: row.district_id,
                    ward_id: row.ward_id,
                    created_at: row.created_at,
                    lat: row.lat,
                    lng: row.lng
                };
            });

            function pointInPolygon(point: number[], vs: number[][]) {
                let x = point[0], y = point[1];
                let inside = false;
                for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                    let xi = vs[i][0], yi = vs[i][1];
                    let xj = vs[j][0], yj = vs[j][1];
                    let intersect = ((yi > y) !== (yj > y)) &&
                        (x < (xj - xi) * (y - yi) / (yj - yi + 0.0000001) + xi);
                    if (intersect) inside = !inside;
                }
                return inside;
            }

            // Sắp xếp: item nào chứa điểm sẽ lên đầu
            const sortedResults = results.sort((a: any, b: any) => {
                const aContains = pointInPolygon([lat, lon], a.bounds) ? 1 : 0;
                const bContains = pointInPolygon([lat, lon], b.bounds) ? 1 : 0;
                return bContains - aContains;
            });

            return {
                data: sortedResults,
                status: true,
                message: "success",
            };

        } catch (error: any) {
            return {
                data: null,
                status: false,
                message: error.message + 1 || "An error occurred",
            }
        }
    }
}


export class LandTypeChangeModel {
    id?: number
    name?: string
    bounds?: number[][];
    land_type_id?: number
    created_at?: string
    last_updated_at?: string
    status: Status = Status.ACTIVE
    user_id?: number

    constructor() {

    }

    async listMapInRange(lat: number, lon: number, range: number) {
        const radiusDegrees = range / 111320;
        const query = `
          SELECT
            ltc.id,
            ltc.name,
            ST_AsText(ltc.bounds) AS bounds,
            ltc.land_type_id,
            lt.name as land_type_name,
            lt.code as land_type_code,
            lt.color as land_type_color,
            ltc.created_at,
            ltc.last_updated_at,
            ltc.status,
            ltc.user_id as created_by_id,
            u.fullname as create_by_name
          FROM land_type_changes ltc
          LEFT JOIN land_types lt ON lt.id = ltc.land_type_id
          LEFT JOIN users u ON u.id = ltc.user_id
          WHERE ST_Intersects(
            ltc.bounds,
            ST_Buffer(
              ST_GeomFromText(?),
              ?
            )
          )
            AND ltc.status = ?
        `;

        const pointWKT = `POINT(${lon} ${lat})`;

        try {
            const [rows]: any = await pool.query(query, [pointWKT, radiusDegrees, Status.ACTIVE]);

            const results = rows.map((row: any) => {
                const polygonText = row.bounds.replace("POLYGON((", "").replace("))", "");
                const pointsArray: number[][] = polygonText.split(",").map((point: string) => {
                    const [lng, lat] = point.trim().split(" ").map(Number);
                    return [lat, lng];
                });

                return {
                    id: row.id,
                    name: row.name,
                    bounds: pointsArray,
                    land_type_id: row.land_type_id,
                    land_type_name: row.land_type_name,
                    land_type_code: row.land_type_code,
                    land_type_color: row.land_type_color,
                    created_at: row.created_at,
                    last_updated_at: row.last_updated_at,
                    status: row.status,
                    created_by_id: row.created_by_id,
                    create_by_name: row.create_by_name,

                };
            });

            function pointInPolygon(point: number[], vs: number[][]) {
                let x = point[0], y = point[1];
                let inside = false;
                for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                    let xi = vs[i][0], yi = vs[i][1];
                    let xj = vs[j][0], yj = vs[j][1];
                    let intersect = ((yi > y) !== (yj > y)) &&
                        (x < (xj - xi) * (y - yi) / (yj - yi + 0.0000001) + xi);
                    if (intersect) inside = !inside;
                }
                return inside;
            }

            // Sắp xếp: item nào chứa điểm sẽ lên đầu
            const sortedResults = results.sort((a: any, b: any) => {
                const aContains = pointInPolygon([lat, lon], a.bounds) ? 1 : 0;
                const bContains = pointInPolygon([lat, lon], b.bounds) ? 1 : 0;
                return bContains - aContains;
            });

            return {
                data: sortedResults,
                status: true,
                message: "success",
            };

        } catch (error: any) {
            return {
                data: null,
                status: false,
                message: error.message + 1 || "An error occurred",
            }
        }
    }

    async findMapByLatLon(lat: number, lon: number) {
        const query = `
          SELECT
            ltc.id,
            ltc.name,
            ST_AsText(ltc.bounds) AS bounds,
            ltc.land_type_id,
            lt.name as land_type_name,
            lt.code as land_type_code,
            lt.color as land_type_color,
            ltc.created_at,
            ltc.last_updated_at,
            ltc.status,
            ltc.user_id as created_by_id,
            u.fullname as create_by_name
          FROM land_type_changes ltc
          LEFT JOIN land_types lt ON lt.id = ltc.land_type_id
          LEFT JOIN users u ON u.id = ltc.user_id
          WHERE ST_Contains(ltc.bounds, ST_GeomFromText(?)) AND ltc.status = ?
          LIMIT 1
        `;

        const pointWKT = `POINT(${lon} ${lat})`;

        try {
            const [rows]: any = await pool.query(query, [pointWKT, Status.ACTIVE]);

            if (rows.length === 0) {
                return {
                    data: null,
                    status: false,
                    message: "Không tìm thấy bản đồ quy hoạch cho vị trí này."
                };
            }

            const row = rows[0];

            // Xử lý bounds (POLYGON) từ WKT sang array [lat, lon][]
            const polygonText = row.bounds.replace("POLYGON((", "").replace("))", "");
            const pointsArray: number[][] = polygonText.split(",").map((point: string) => {
                const [lng, lat] = point.trim().split(" ").map(Number);
                return [lat, lng]; // đảo thứ tự thành [lat, lon]
            });

            return {
                data: [{
                    ...row,
                    bounds: pointsArray
                }],
                status: true,
                message: "success"
            };

        } catch (error: any) {
            return {
                data: null,
                status: false,
                message: error.message || "An error occurred"
            };
        }
    }

    async getListMap(filters: any = {}, page: number = 1, page_size: number = 10) {
        const pageTemp = Number(page)
        const pageSize = Number(page_size)
        const offset = (pageTemp - 1) * pageSize;
        try {
            let params: any = []

            if (filters.query) {
                params = [filters.query]
            }

            params.push(pageSize, offset)
            const [rows]: any = await pool.query(`SELECT 
                ltc.id,
                ltc.name,
                ST_AsText(ltc.bounds) AS bounds,
                ltc.land_type_id,
                lt.name as land_type_name,
                lt.code as land_type_code,
                lt.color as land_type_color,
                ltc.created_at,
                ltc.last_updated_at,
                ltc.status,
                ltc.user_id as created_by_id,
                u.fullname as create_by_name
                FROM land_type_changes ltc
                LEFT JOIN land_types lt ON lt.id = ltc.land_type_id
                LEFT JOIN users u ON u.id = ltc.user_id
                ${filters.query ? 'WHERE name like ?' : ''}
                LIMIT ? OFFSET ?
                `, params);
            const countQuery = `SELECT COUNT(*) as total FROM land_type_changes ${filters.query ? 'WHERE name like ?' : ''}`;
            const [[totalCount]]: any = await pool.query(countQuery, params.slice(0, -2))


            const results = rows.map((row: any) => {
                const polygonText = row.bounds.replace("POLYGON((", "").replace("))", "");
                const pointsArray: number[][] = polygonText.split(",").map((point: string) => {
                    const [lng, lat] = point.trim().split(" ").map(Number);
                    return [lat, lng];
                });

                return {
                    id: row.id,
                    name: row.name,
                    bounds: pointsArray,
                    land_type_id: row.land_type_id,
                    land_type_name: row.land_type_name,
                    land_type_code: row.land_type_code,
                    land_type_color: row.land_type_color,
                    created_at: row.created_at,
                    last_updated_at: row.last_updated_at,
                    status: row.status,
                    created_by_id: row.created_by_id,
                    create_by_name: row.create_by_name,

                };
            });

            return {
                data: results,
                status: true,
                message: 'success',
                total: totalCount.total,
                page: pageTemp,
                page_size: pageSize,
            }

        } catch (e: any) {
            return {
                data: null,
                status: false,
                message: e.message
            }
        }

    }

    async add() {
        try {
            const [rows]: any = await pool.query(
                `INSERT INTO land_type_changes (
                    name,
                    bounds,
                    land_type_id,
                    created_at,
                    last_updated_at,
                    status,
                    user_id
                    ) VALUES (?, ST_GeomFromText(?), ?, NOW(), NOW(), ?, ?)`,
                [this.name, this.bounds, this.land_type_id, this.status, this.user_id]
            );

            return {
                data: {
                    ...this,
                    id: rows.insertId
                },
                status: true,
                message: 'success',
            };
        } catch (error: any) {
            return {
                data: null,
                status: false,
                message: error.message || 'Failed to add land zone'
            }
        }
    }

    async update() {
        if (!this.id) {
            return {
                data: null,
                status: false,
                message: 'Thiếu ID để cập nhật',
            };
        }

        try {
            const [result]: any = await pool.query(
                `UPDATE land_type_changes
             SET
                name = ?,
                land_type_id = ?,
                last_updated_at = NOW(),
                status = ?,
                user_id = ?
             WHERE id = ?`,
                [this.name, this.land_type_id, this.status, this.user_id, this.id]
            );

            if (result.affectedRows === 0) {
                return {
                    data: null,
                    status: false,
                    message: 'Không tìm thấy bản ghi để cập nhật',
                };
            }

            return {
                data: {
                    ...this
                },
                status: true,
                message: 'Cập nhật thành công',
            };
        } catch (error: any) {
            return {
                data: null,
                status: false,
                message: error.message || 'Cập nhật thất bại'
            };
        }
    }


    async delete() {
        try {
            const [result]: any = await pool.query(
                `DELETE FROM land_type_changes WHERE id = ?`,
                [this.id]
            );

            if (result.affectedRows === 0) {
                return {
                    data: null,
                    status: false,
                    message: 'Không tìm thấy bản ghi để xóa',
                };
            }

            return {
                data: { id: this.id },
                status: true,
                message: 'Xóa thành công',
            };
        } catch (error: any) {
            return {
                data: null,
                status: false,
                message: error.message || 'Xóa thất bại',
            };
        }
    }


}

export class LandTypeModel {
    id?: number
    name?: string
    code?: string
    color?: string

    constructor() {
    }
    async getListLandType(filters: any = {}, page: number = 1, page_size: number = 10) {
        const pageTemp = Number(page);
        const pageSize = Number(page_size);
        const offset = (pageTemp - 1) * pageSize;

        const search = filters.query || '';
        try {
            const sql = `
                    SELECT id, name, code, color
                    FROM land_types
                    WHERE name LIKE ? OR code LIKE ?
                    ORDER BY id ASC
                    LIMIT ? OFFSET ?
                `;

            const [rows]: any = await pool.query(sql, [
                `%${search}%`,
                `%${search}%`,
                pageSize,
                offset
            ]);

            const countQuery = `SELECT COUNT(*) as total FROM land_types WHERE name LIKE ? OR code LIKE ?`;
            const [[totalCount]]: any = await pool.query(countQuery, [
                `%${search}%`,
                `%${search}%`
            ])
            return {
                data: rows,
                status: true,
                message: 'success',
                total: totalCount.total,
                page,
                pageSize
            }
        } catch (e: any) {
            return {
                data: null,
                status: false,
                message: e.message
            }
        }

    }

    async addLandType() {
        try {
            const sql = `
            INSERT INTO land_types (name, code, color)
            VALUES (?, ?, ?)
        `;
            const [result]: any = await pool.query(sql, [this.name, this.code, this.color]);

            return {
                data: { ...this, id: result.insertId },
                status: true,
                message: 'Thêm loại đất thành công',
            };
        } catch (err: any) {
            return {
                data: null,
                status: false,
                message: err.message || 'Thêm loại đất thất bại',
            };
        }
    }

    async updateLandType() {
        try {
            const sql = `
            UPDATE land_types
            SET name = ?, code = ?, color = ?
            WHERE id = ?
        `;
            const [result]: any = await pool.query(sql, [this.name, this.code, this.color, this.id]);

            return {
                data: { ...this },
                status: true,
                message: 'Cập nhật loại đất thành công',
            };
        } catch (err: any) {
            return {
                data: null,
                status: false,
                message: err.message || 'Cập nhật loại đất thất bại',
            };
        }
    }

    async deleteLandType(id: number) {
        try {
            const sql = `DELETE FROM land_types WHERE id = ?`;
            const [result]: any = await pool.query(sql, [id]);

            return {
                data: { id },
                status: true,
                message: 'Xoá loại đất thành công',
            };
        } catch (err: any) {
            return {
                data: null,
                status: false,
                message: err.message || 'Xoá loại đất thất bại',
            };
        }
    }


}

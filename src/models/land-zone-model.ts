import moment from "moment";
import pool from "../config/db";

export class LandZoneModel {
    id?: number;
    name?: string;
    type_landing_id?: number;
    description?: string;
    coordinates?: string;
    created_at: moment.Moment = moment();
    constructor() { }

    async getAll(page: number = 1, page_size: number = 10, sort: string = 'DESC') {
        try {
            const pageTemp = Number(page)
            const pageSize = Number(page_size)
            const offset = (pageTemp - 1) * pageSize;
            const [rows]: any = await pool.query(`
                SELECT lz.* ,
                        lt.name as land_type_name,
                        lt.code as land_type_code,
                        lt.color as land_type_color
                FROM land_zones lz
                LEFT JOIN land_types lt ON lz.type_landing_id = lt.id
                ORDER BY lz.id ${sort}
                 LIMIT ? OFFSET ?`, [pageSize, offset]);
            return {
                data: rows,
                status: true,
                message: 'success',
            };

        } catch (error: any) {
            return {
                data: null,
                status: false,
                message: error.message || 'Failed to fetch land zones'
            }
        }
    }

    async addLandZone() {
        try {
            const [rows]: any = await pool.query(
                `INSERT INTO land_zones (type_landing_id, coordinates) VALUES (?, ST_GeomFromText(?))`,
                [this.type_landing_id, this.coordinates]
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

    async addManyLandZones(type_landing_id: number, coordinates: string[]) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const insertPromises = coordinates.map(coord => 
                connection.query(
                    `INSERT INTO land_zones (type_landing_id, coordinates) VALUES (?, ST_GeomFromText(?))`,
                    [type_landing_id, coord]
                )
            );

            const results = await Promise.all(insertPromises);
            
            const insertedZones = results.map((result: any, index) => ({
                id: result[0].insertId,
                type_landing_id,
                coordinates: coordinates[index]
            }));

            await connection.commit();

            return {
                data: insertedZones,
                status: true,
                message: `Successfully added ${insertedZones.length} land zones`
            };
        } catch (error: any) {
            await connection.rollback();
            return {
                data: null,
                status: false,
                message: error.message || 'Failed to add land zones'
            };
        } finally {
            connection.release();
        }
    }

    async updateLandZone() {
        try {
            const [rows]: any = await pool.query('UPDATE land_zones SET ? WHERE id = ?', [this, this.id]);
            return {
                data: rows[0],
                status: true,
                message: 'success',
            };
        } catch (error: any) {
            return {
                data: null,
                status: false,
                message: error.message || 'Failed to update land zone'
            }
        }
    }

    async deleteLandZone() {
        try {
            const [rows]: any = await pool.query('DELETE FROM land_zones WHERE id = ?', [this.id]);
            return {
                data: rows[0],
                status: true,
                message: 'success',
            };
        } catch (error: any) {
            return {
                data: null,
                status: false,
                message: error.message || 'Failed to delete land zone'
            }
        }
    }

    async getByPoint(lat: number, lng: number) {
        try {
            // Tạo POINT từ lat, lng
            const point = `POINT(${lng} ${lat})`;

            const query = `
                SELECT 
                    lz.*,
                    lt.name as land_type_name,
                    lt.code as land_type_code,
                    lt.color as land_type_color
                FROM land_zones lz
                LEFT JOIN land_types lt ON lz.type_landing_id = lt.id
                WHERE ST_Contains(lz.coordinates, ST_GeomFromText(?))
                LIMIT 1
            `;

            const [rows]: any = await pool.query(query, [point]);

            if (rows.length === 0) {
                return {
                    data: null,
                    status: true,
                    message: 'Không tìm thấy vùng đất tại điểm này',
                };
            }

            // Chuyển đổi geometry từ GeoJSON str

            return {
                data: {
                    ...rows[0],
                    coordinates: rows[0].coordinates ? (rows[0].coordinates[0] as { x: number; y: number }[]).map((coord: { x: number; y: number }) => [coord.x, coord.y]) : [],
                },
                status: true,
                message: 'success',
            };
        } catch (error: any) {
            return {
                data: null,
                status: false,
                message: error.message || 'Failed to get land zone by point'
            }
        }
    }
}
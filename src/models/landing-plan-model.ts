import pool from "../config/db";

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

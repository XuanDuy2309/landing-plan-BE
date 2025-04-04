import pool from "../config/db";

export class CoordinatesLocationModel {
    id?: number;
    points?: string; // POLYGON được lưu dưới dạng WKT (Well-Known Text)
    province_id?: string;
    district_id?: string;
    ward_id?: string;
    area?: number;
    owner_name?: string;
    content?: string;

    constructor() {

    }

    async findByLatLon(lat: number, lon: number) {
        const query = `
          SELECT id, ST_AsText(points) as points, area, content, owner_name
          FROM coordinates_location
          WHERE ST_Contains(points, ST_GeomFromText(?))
        `;

        const pointWKT = `POINT(${lon} ${lat})`;

        try {
            const [rows]: any = await pool.query(query, [pointWKT]);

            // Xử lý chuỗi WKT của Polygon
            const polygonText = rows[0].points.replace("POLYGON((", "").replace("))", "");
            // Tách các điểm tọa độ, sau đó đảo thứ tự (lat, lon)
            const pointsArray = polygonText.split(",").map((point: string) => {
                const [lon, lat] = point.trim().split(" ").map(Number);  // Tách lon và lat đúng thứ tự
                return [lat, lon];  // Đảm bảo giữ nguyên thứ tự [lat, lon]
            });
            this.id = rows[0].id;
            this.points = pointsArray
            this.province_id = rows[0].province_id;
            this.district_id = rows[0].district_id;
            this.ward_id = rows[0].ward_id;
            this.area = Number(rows[0].area);
            this.owner_name = rows[0].owner_name;
            this.content = rows[0].content;
            return {
                data: this,// Trả về danh sách các tọa độ
                status: true,
                message: "success"
            };

        } catch (error) {
            throw new Error(`Error executing query: ${error}`);
        }
    }
}
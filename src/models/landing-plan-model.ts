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
    
    constructor() {

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
    
          return {
            data: this,
            status: true,
            message: "success"
          };
    
        } catch (error) {
          throw new Error(`Error executing query in PlanningMapModel: ${error}`);
        }
      }
}
import axios from "axios";
import sharp from "sharp";
import { LandingPlanModel, PostModel } from "../models";

export class LandingPlanController {
    async findMapByLatLon(req: any, res: any) {
        const { lat, lon, radius } = req.query;
        const latFloat = parseFloat(lat as string);
        const lonFloat = parseFloat(lon as string);
        const radiusFloat = radius !== undefined ? parseFloat(radius as string) : 0;
        if (isNaN(latFloat) || isNaN(lonFloat)) {
            return res.status(400).json({ message: "Lat,lon không được để trống" });
        }

        try {
            const landingPlanModel = new LandingPlanModel();
            if (radiusFloat > 0) {
                const result = await landingPlanModel.listMapInRange(latFloat, lonFloat, radiusFloat);
                if (!result.status) {
                    return res.status(400).json(result);
                }
                res.status(200).json(result);
            } else {
                const result = await landingPlanModel.findMapByLatLon(latFloat, lonFloat);
                if (!result.status) {
                    return res.status(400).json(result);
                }
                res.status(200).json(result);
            }
        } catch (error) {
            res.status(500).json({ message: "Error fetching map(s)", error });
        }
    }

    async getLandingPlanMaps(req: any, res: any) {
        try {
            const { z, x, y } = req.params;
            const fullPath = req.params[0];
            const folderPath = decodeURIComponent(fullPath);

            const tileUrl = `https://cdn.dandautu.vn/quy-hoach/${folderPath}/${z}/${x}/${y}.png`;
            const response = await axios.get(tileUrl, {
                responseType: 'stream',
            });

            res.setHeader('Content-Type', response.headers['content-type'] || 'image/png');
            response.data.pipe(res);
        } catch (err: any) {
            console.error('Tile proxy error:', err.message);
            if (err.response?.status === 404) {
                res.status(404).send('Tile not found from upstream');
            } else {
                res.status(500).send('Internal server error');
            }
        }
    }

    async detectLandType(req: any, res: any) {
        const { lat, lon, zoom } = req.body;
        const latFloat = parseFloat(lat as string);
        const lonFloat = parseFloat(lon as string);
        if (isNaN(latFloat) || isNaN(lonFloat)) {
            return res.status(400).json({ message: "Lat,lon không được để trống" });
        }
        try {
            const landingPlanModel = new LandingPlanModel();
            const result = await landingPlanModel.findMapByLatLon(lat, lon);
            if (!result.status || !result.data) {
                return res.status(404).json({ message: "Không tìm thấy bản đồ quy hoạch tại vị trí này" });
            }
            const folderPath = result?.data[0].folder_path;
            const z = zoom > 18 ? 18 : zoom;
            // const x = long2tileX(lonFloat, z);
            // const y = lat2tileY(latFloat, z);

            const { tileX: x, tileY: y, inTileX, inTileY } = getTileXYAndPixel(latFloat, lonFloat, z);

            // 3. Gọi ảnh tile từ upstream
            const tileUrl = `https://cdn.dandautu.vn/quy-hoach/${folderPath}/${z}/${x}/${y}.png`;
            const response = await axios.get(tileUrl, { responseType: "arraybuffer" });
            const buffer = Buffer.from(response.data);
            // 4. Dùng Sharp để lấy pixel tại center (128, 128)
            const raw = await sharp(buffer)
                .ensureAlpha()
                .extract({ left: inTileX, top: inTileY, width: 1, height: 1 }) // chính xác vị trí click
                .raw()
                .toBuffer();

            const [r, g, b, a] = raw;
            const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b)
                .toString(16)
                .slice(1)}`.toLowerCase();

            const postModel = new PostModel();
            const postRes = await postModel.getListTypePost("")
            if (!postRes.status) {
                return res.status(400).json({ message: "Không thể lấy danh sách loại đất" });
            }
            let closestColor = postRes.data[0];
            let minDistance = getColorDistance(hexColor, postRes.data[0].color);

            for (const landType of postRes.data) {
                const distance = getColorDistance(hexColor, landType.color);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestColor = landType;
                }
            }

            return res.status(200).json({
                status: true,
                data: closestColor,
                message: "success"
            });


        } catch (error) {
            res.status(500).json({ message: "Error fetching map(s)", error });
            console.log("error", error);
        }
    }
    async getListMap(req: any, res: any) {
        const { page_size, page } = req.query
        const landingPlanModel = new LandingPlanModel()
        try {
            const data = await landingPlanModel.getListMap({ ...req.query }, page, page_size)
            return res.status(200).json(data);
        } catch (err: any) {
            return res.status(400).json({ message: err.message || 'Failed to fetch posts' });
        }
    }

}

// function long2tileX(lon: number, zoom: number): number {
//     return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
// }

// function lat2tileY(lat: number, zoom: number): number {
//     return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) +
//         1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
// }

function getColorDistance(color1: string, color2: string): number {
    // Convert hex to RGB
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);

    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);

    // Tính khoảng cách Euclidean giữa 2 màu trong không gian RGB
    return Math.sqrt(
        Math.pow(r1 - r2, 2) +
        Math.pow(g1 - g2, 2) +
        Math.pow(b1 - b2, 2)
    );
}

function getTileXYAndPixel(lat: number, lon: number, zoom: number) {
    const tileSize = 256;
    const scale = Math.pow(2, zoom);

    // World coordinates (0..1 range)
    const x = (lon + 180) / 360;
    const sinLat = Math.sin(lat * Math.PI / 180);
    const y = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);

    // Multiply to get pixel coordinates
    const pixelX = x * scale * tileSize;
    const pixelY = y * scale * tileSize;

    const tileX = Math.floor(pixelX / tileSize);
    const tileY = Math.floor(pixelY / tileSize);
    const inTileX = Math.floor(pixelX % tileSize);
    const inTileY = Math.floor(pixelY % tileSize);

    return { tileX, tileY, inTileX, inTileY };
}

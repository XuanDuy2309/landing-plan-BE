import { LandingPlanModel } from "../models";

export class LandingPlanController {
    async findMapByLatLon(req: any, res: any) {
        const { lat, lon, radius } = req.query;
        const latFloat = parseFloat(lat as string);
        const lonFloat = parseFloat(lon as string);
        const radiusFloat = radius !== undefined ? parseFloat(radius as string) : 0;
        if (isNaN(latFloat) || isNaN(lonFloat)) {
            return res.status(400).json({ message: "Invalid latitude or longitude" });
        }

        try {
            const landingPlanModel = new LandingPlanModel();
            if (radiusFloat > 0) {
                const result = await landingPlanModel.listMapInRange(latFloat, lonFloat, radiusFloat);
                res.status(200).json(result);
            } else {
                const result = await landingPlanModel.findMapByLatLon(latFloat, lonFloat);
                res.status(200).json(result);
            }
        } catch (error) {
            res.status(500).json({ message: "Error fetching map(s)", error });
        }
    }

    async listMapInRange(req: any, res: any) {
        const { lat, lon, range } = req.query;
        const latFloat = parseFloat(lat as string);
        const lonFloat = parseFloat(lon as string);
        const rangeFloat = parseFloat(range as string);

        if (isNaN(latFloat) || isNaN(lonFloat) || isNaN(rangeFloat)) {
            return res.status(400).json({ message: "Invalid lat, lon, or range" });
        }

        try {
            const landingPlanModel = new LandingPlanModel();
            const result = await landingPlanModel.listMapInRange(latFloat, lonFloat, rangeFloat);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: "Error fetching maps in range", error });
        }
    }
}

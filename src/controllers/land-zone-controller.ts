import { LandZoneModel } from "../models";

export class LandZoneController {
    async index(req: any, res: any) {
        try {
            const { page, page_size, sort } = req.query
            const landZoneModel = new LandZoneModel();
            const data = await landZoneModel.getAll(Number(page || 1), Number(page_size || 10), sort);
            if (!data.status){
                return res.status(400).json(data);
            }
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(500).json(error);
        }
    }

    async store(req: any, res: any) {
        try {
            const {type_landing_id,coordinates} = req.body
            const landZoneModel = new LandZoneModel();
            if (!type_landing_id || !coordinates){
                return res.status(400).json({message: 'Id loại đất và đường bao là bắt buộc'});
            }
            landZoneModel.type_landing_id = type_landing_id;
            landZoneModel.coordinates = coordinates;
            const data = await landZoneModel.addLandZone();
            if (!data.status){
                return res.status(400).json(data);
            }
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(500).json(error);
        }
    }

    async update(req: any, res: any) {
        try {
            const { id } = req.params;
            const {type_landing_id,coordinates} = req.body
            const landZoneModel = new LandZoneModel();
            landZoneModel.id = id;
            landZoneModel.type_landing_id = type_landing_id;
            landZoneModel.coordinates = coordinates;
            const data = await landZoneModel.updateLandZone();
            if (!data.status){
                return res.status(400).json(data);
            }
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(500).json(error);
        }
    }

    async delete(req: any, res: any) {
        try {
            const { id } = req.params;
            const landZoneModel = new LandZoneModel();
            landZoneModel.id = id;
            const data = await landZoneModel.deleteLandZone();
            if (!data.status){
                return res.status(400).json(data);
            }
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(500).json(error);
        }
    }

    async getByPoint(req: any, res: any) {
        try {
            const { lat, lng } = req.query;
            const landZoneModel = new LandZoneModel();
            const data = await landZoneModel.getByPoint(Number(lat), Number(lng));
            if (!data.status){
                return res.status(400).json(data);
            }
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(500).json(error);
        }
    }

    async storeMany(req: any, res: any) {
        try {
            const { type_landing_id, coordinates } = req.body;
            
            if (!type_landing_id || !coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
                return res.status(400).json({
                    status: false,
                    message: 'Id loại đất và mảng đường bao là bắt buộc',
                    data: null
                });
            }

            const landZoneModel = new LandZoneModel();
            const data = await landZoneModel.addManyLandZones(type_landing_id, coordinates);
            
            if (!data.status) {
                return res.status(400).json(data);
            }
            
            return res.status(201).json(data);
        } catch (error: any) {
            return res.status(500).json({
                status: false,
                message: error.message || 'Internal server error',
                data: null
            });
        }
    }
}
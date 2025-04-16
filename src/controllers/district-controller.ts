import { DistrictModel } from "../models";

export class DistrictController {
    async index(req: any, res: any) {
        const { page, page_size, query } = req.query
        const district = new DistrictModel();
        const data = await district.getAll(Number(page||1), Number(page_size||10), query);
        res.status(200).json(data);
    }

    async getAllByProvinceId(req: any, res: any) {
        const { id } = req.params;
        const { page, page_size, query } = req.query
        const district = new DistrictModel();
        const data = await district.getAllByProvinceId(id, Number(page||1), Number(page_size||10), query);
        res.status(200).json(data);
    }
}
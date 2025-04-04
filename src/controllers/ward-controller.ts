import { WardModel } from "../models";

export class WardController {

    async index(req: any, res: any) {
        const { page, page_size, query } = req.query
        const ward = new WardModel();
        const data = await ward.getAll(page, page_size, query);
        res.status(200).json(data);
    }

    async getAllByDistrictId(req: any, res: any) {
        const { id } = req.params;
        const ward = new WardModel();
        const data = await ward.getAllByDistrictId(id);
        res.status(200).json(data);
    }
}
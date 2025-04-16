import { WardModel } from "../models";

export class WardController {

    async index(req: any, res: any) {
        const { page, page_size, query } = req.query
        const ward = new WardModel();
        const data = await ward.getAll( Number(page || 1), Number(page_size || 10), query);
        res.status(200).json(data);
    }

    async getAllByDistrictId(req: any, res: any) {
        const { id } = req.params;
        const { page, page_size, query } = req.query
        const ward = new WardModel();
        const data = await ward.getAllByDistrictId(id, Number(page || 1), Number(page_size || 10), query);
        res.status(200).json(data);
    }
}
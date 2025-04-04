import { ProvinceModel } from "../models";

export class ProvinceController {
    async index(req: any, res: any) {
        const { page, page_size, query } = req.query
        const province = new ProvinceModel();
        const data = await province.getAll(page, page_size, query);
        res.status(200).json(data);
    }
}
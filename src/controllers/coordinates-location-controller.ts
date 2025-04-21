
import { Request, Response } from "express";
import path from "path";
import { CoordinatesLocationModel } from "../models";

const TILE_DIR = path.resolve(__dirname, "../../dong-anh-2030");

export const getTile = (req: Request, res: Response) => {
    const { z, x, y } = req.params;
    const zoom = parseInt(z);
    const yTile = parseInt(y);
    const maxY = Math.pow(2, zoom) - 1;

    const adjustedY = maxY - yTile;


    const tilePath = path.join(__dirname, "../../", TILE_DIR, z, x, `${adjustedY}.png`);
    res.sendFile(tilePath, (err) => {
        if (err) {
            res.status(404).send("Tile not found");
        }
    });
};

export class CoordinatesLocationController {
    async findCoordinatesLocation(req: any, res: any) {
        const { lat, lon } = req.query;
        const latFloat = parseFloat(lat as string);
        const lonFloat = parseFloat(lon as string);

        if (isNaN(latFloat) || isNaN(lonFloat)) {
            return res.status(400).json({ message: "Invalid latitude or longitude" });
        }

        try {
            const coordinatesLocationModel = new CoordinatesLocationModel();
            const result = await coordinatesLocationModel.findByLatLon(latFloat, lonFloat);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ message: "Error fetching coordinates location", error });
        }
    }
}
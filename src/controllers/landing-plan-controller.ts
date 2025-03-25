
import { Request, Response } from "express";
import path from "path";

const TILE_DIR = path.resolve(__dirname, "../../dong-anh-2030");

export const getTile = (req: Request, res: Response) => {
    const { z, x, y } = req.params;
    const zoom = parseInt(z);
    const yTile = parseInt(y);
    const maxY = Math.pow(2, zoom) - 1;

    const adjustedY = maxY - yTile;

    
    const tilePath = path.join(__dirname, "../../", TILE_DIR, z, x, `${adjustedY}.png`);
    console.log(tilePath)
    res.sendFile(tilePath, (err) => {
        if (err) {
            res.status(404).send("Tile not found");
        }
    });
};

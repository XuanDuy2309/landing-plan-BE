import express, { Request, Response } from 'express';
import { Route } from './routes';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // Chỉ cho phép từ frontend
  credentials: true, // Nếu có gửi cookie hoặc header Authorization
}))

const TILE_FOLDER = path.join(__dirname, "../dong-anh-2030");

// Endpoint để phục vụ tile theo định dạng /tiles/z/x/y.png
app.get("/tiles/:z/:x/:y.png", (req, res) => {
  const { z, x, y } = req.params;
  const flippedY = Math.pow(2, parseInt(z)) - 1 - parseInt(y); // Đảo ngược trục Y
  const tilePath = path.join(TILE_FOLDER, z, x, `${flippedY}.png`);
  res.sendFile(tilePath, (err) => {
        if (err) {
            
        }
    });
});

Route(app);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

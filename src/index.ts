import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { Route } from './routes';
import { socketService } from './service';

dotenv.config();

const app = express();
const httpServer = createServer(app); // Tạo HTTP server


const PORT = 3000;

app.use(express.json());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://landing-plan-fe.vercel.app'
];

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Áp dụng CORS cho Express
app.use(cors(corsOptions));

// Khởi tạo socket với cấu hình CORS tương ứng
socketService.init(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  }
});

const TILE_FOLDER = path.join(__dirname, "../dong-anh-2030");

// Endpoint để phục vụ tile theo định dạng /tiles/z/x/y.png
app.get("/tiles/:z/:x/:y.png", (req, res) => {
  const { z, x, y } = req.params;
  const flippedY = Math.pow(2, parseInt(z)) - 1 - parseInt(y); // Đảo ngược trục Y
  const tilePath = path.join(TILE_FOLDER, z, x, `${flippedY}.png`);
  res.sendFile(tilePath, (err) => {
    if (err) {
      res.status(404).send("Tile not found");
    }
  });
});

Route(app);

httpServer.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
import express, { Request, Response } from 'express';
import { Route } from './routes';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app); // Tạo HTTP server
export const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173', // Chỉ cho phép từ frontend
    credentials: true,
  },
});

const PORT = 3000;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

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

// Socket.io logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

Route(app);

httpServer.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
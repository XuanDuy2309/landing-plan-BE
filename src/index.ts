import express, { Request, Response } from 'express';
import { Route } from './routes';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // Chỉ cho phép từ frontend
  credentials: true, // Nếu có gửi cookie hoặc header Authorization
}))
Route(app);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

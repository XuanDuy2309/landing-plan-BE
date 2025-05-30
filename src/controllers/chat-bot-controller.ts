// src/controllers/ChatController.ts
import { Request, Response } from 'express';
import { ChatBotModel } from '../models';
import { GeminiService } from '../service';

export class ChatBotController {
    public static async chat(req: Request, res: Response): Promise<void> {
        const { message } = req.body;

        if (!message || typeof message !== 'string') {
            res.status(400).json({ message: 'Vui lòng nhập nội dung' });
            return;
        }

        try {
            const chat = new ChatBotModel(message);
            const reply = await GeminiService.getChatResponse(chat.message);
            res.json({ data: { message: reply }, status: true, message: 'success' });
        } catch (err) {
            console.error('Gemini error:', err);
            res.status(500).json({ message: 'Có lỗi từ server' });
        }
    }
}

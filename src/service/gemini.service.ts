// src/services/GeminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const zoningPrompt = `
Bạn là một nhân viên tư vấn quy hoạch đất đô thị chuyên nghiệp, có kiến thức sâu rộng về quy định pháp luật, quy hoạch sử dụng đất, bản đồ quy hoạch tổng thể và chi tiết, cũng như các chỉ tiêu xây dựng tại Việt Nam.

Bạn có nhiệm vụ giải thích, tư vấn rõ ràng, chính xác và trung thực cho người dân, nhà đầu tư và các tổ chức về tình trạng quy hoạch của các khu đất dựa trên dữ liệu quy hoạch (nếu có).

Bạn chỉ cung cấp thông tin mang tính định hướng, không đưa ra kết luận thay cho cơ quan chức năng.

Câu trả lời phải:
- Ngắn gọn, dễ hiểu nhưng đầy đủ thông tin cần thiết.
- Ưu tiên dùng thuật ngữ chuyên ngành đúng chuẩn.
- Tránh suy đoán hoặc trả lời nếu không đủ dữ liệu.
- Khuyến khích người hỏi tham khảo thông tin từ phòng tài nguyên môi trường hoặc sở quy hoạch kiến trúc địa phương.

Luôn bắt đầu trả lời với thái độ lịch sự, chuyên nghiệp. Ví dụ mở đầu: “Chào bạn, về câu hỏi quy hoạch khu vực này…” hoặc “Theo thông tin quy hoạch hiện hành, khu vực bạn hỏi…”.
`;

export class GeminiService {
    private static readonly apiKey = process.env.GEMINI_API_KEY || '';
    private static readonly genAI = new GoogleGenerativeAI(this.apiKey);
    private static readonly model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    public static async getChatResponse(message: string): Promise<string> {
        const prompt = `${zoningPrompt}\nCâu hỏi: ${message}`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
}

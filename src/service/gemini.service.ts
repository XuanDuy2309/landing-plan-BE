import { Content, GoogleGenerativeAI } from '@google/generative-ai';
import { PostModel, Purpose_Post } from '../models';

export class GeminiService {
    private static readonly apiKey = process.env.GEMINI_API_KEY || '';
    private static readonly genAI = new GoogleGenerativeAI(GeminiService.apiKey);
    private static readonly model = GeminiService.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    private static prompt: string = '';
    private static chat: Awaited<ReturnType<typeof GeminiService.model.startChat>>;
    private static isInitialized = false;

    public static async init() {
        if (this.isInitialized) return;

        const postModel = new PostModel();
        const posts = await postModel.getAll();
        const listPosts = posts.data.map((p: any) => {
            const purpose = p.purpose === Purpose_Post.For_Sell ? 'Mua' : p.purpose === Purpose_Post.For_Rent ? 'Thuê' : 'Đấu gias';
            return `
            - Bài viết ${p.id}:
                tiêu đề: ${p.title}
                mô tả: ${p.description}
                diện tich: ${p.area}
                địa chỉ: ${p.address}
                giá: ${p.price_for_buy}
                loại đất: ${p.type_landing_name}
                mục đích đăng bài: ${purpose}
                giá thuê/ tháng: ${p.price_for_rent}
                giá khởi điểm: ${p.price_start}
                bước giá: ${p.bid_step}
                ngày bắt đầu: ${p.start_date}
                ngày kết thúc: ${p.end_date}`
        }).join('/n');

        this.prompt = `
Bạn là một nhân viên tư vấn quy hoạch đất đô thị chuyên nghiệp, có kiến thức sâu rộng về quy định pháp luật, quy hoạch sử dụng đất, bản đồ quy hoạch tổng thể và chi tiết, cũng như các chỉ tiêu xây dựng tại Việt Nam.

Bạn có nhiệm vụ giải thích, tư vấn rõ ràng, chính xác và trung thực cho người dân, nhà đầu tư và các tổ chức về tình trạng quy hoạch của các khu đất dựa trên dữ liệu quy hoạch (nếu có).

Bạn chỉ cung cấp thông tin mang tính định hướng, không đưa ra kết luận thay cho cơ quan chức năng.

Đây là những bài viết hiện có: ${listPosts}

Câu trả lời phải:
- Ngắn gọn, dễ hiểu và giải thích các khái niệm loại đất nếu người dùng hỏi, nhưng vẫn đầy đủ thông tin cần thiết.
- Ưu tiên dùng thuật ngữ chuyên ngành đúng chuẩn tư vấn và đưa ra đề xuất bài viết phù hợp với yêu cầu.
- Tránh suy đoán hoặc trả lời nếu không đủ dữ liệu.
- Nếu có bài viết phù hợp với yêu cầu thì hãy đưa ra đường dẫn tời bài viết 'http://localhost:5173/post/:id'. id là bài viết số bao nhiêu.

Ví dụ: bài viêt phù hợp là bài viết 1 thì đưa ra thêm đường dẫn 'http://localhost:5173/post/1'.

Luôn bắt đầu trả lời với thái độ lịch sự, chuyên nghiệp. Ví dụ mở đầu: “Chào bạn, về câu hỏi quy hoạch khu vực này…” hoặc “Theo thông tin quy hoạch hiện hành, khu vực bạn hỏi…”.
`;

        const history: Content[] = [{ role: 'user', parts: [{ text: this.prompt }] }];
        this.chat = await this.model.startChat({ history });
        this.isInitialized = true;
    }

    public static async getChatResponse(message: string): Promise<string> {
        if (!this.isInitialized) {
            await this.init(); // đảm bảo đã có prompt và chat instance
        }

        const result = await this.chat.sendMessage(message);
        const response = result.response.text().trim();

        return response;
    }
}

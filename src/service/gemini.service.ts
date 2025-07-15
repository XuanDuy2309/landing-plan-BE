import { Content, GoogleGenerativeAI } from '@google/generative-ai';
import moment from 'moment';
import { PostModel, Purpose_Post } from '../models';

export class GeminiService {
    private static readonly apiKey = process.env.GEMINI_API_KEY || '';
    private static readonly genAI = new GoogleGenerativeAI(GeminiService.apiKey);
    private static readonly model = GeminiService.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    private static prompt: string = '';
    private static chat: Awaited<ReturnType<typeof GeminiService.model.startChat>>;
    private static isInitialized = false;

    private static formatMoney = (number:any, digits = 1, local = 'en') => {
  if (number === 0) return "0";
  const si =
    local === 'vn'
      ? [
        { value: 1, symbol: '' },
        { value: 1e3, symbol: ' nghìn' },
        { value: 1e6, symbol: ' triệu' },
        { value: 1e9, symbol: ' tỷ' },
        { value: 1e12, symbol: 'T' },
        { value: 1e15, symbol: 'P' },
        { value: 1e18, symbol: 'E' },
        { value: 1e21, symbol: 'Z' },
        { value: 1e24, symbol: 'Y' },
      ]
      : [
        { value: 1, symbol: '' },
        { value: 1e3, symbol: 'K' },
        { value: 1e6, symbol: 'M' },
        { value: 1e9, symbol: 'B' },
        { value: 1e12, symbol: 'T' },
        { value: 1e15, symbol: 'P' },
        { value: 1e18, symbol: 'E' },
        { value: 1e21, symbol: 'Z' },
        { value: 1e24, symbol: 'Y' },
      ];
  let isNegative = false;
  if (number < 0) {
     
    number = Math.abs(number);
    isNegative = true;
  }
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;
  for (i = si.length - 1; i > 0; i -= 1) {
    if (number >= si[i].value) {
      break;
    }
  }
  return isNegative
    ? `(${(number / si[i].value).toFixed(digits).replace(rx, '$1')})${si[i].symbol
    }`
    : `${(number / si[i].value).toFixed(digits).replace(rx, '$1')}${si[i].symbol
    }`;
};

    public static async init() {
        if (this.isInitialized) return;

        const postModel = new PostModel();
        const posts = await postModel.getAll();
        const listPosts = posts.data.map((p: any) => {
            const purpose = Number(p.purpose) === Purpose_Post.For_Sell ? 'Bán' : Number(p.purpose) === Purpose_Post.For_Rent ? 'Cho thuê' : 'Đấu giá';

            
            return `
            - Bài viết ${p.id}:
                tiêu đề: ${p.title}
                diện tich: ${p.area}
                địa chỉ: ${p.address}
                giá: ${this.formatMoney(p.price_for_buy, 1, 'vn')}
                loại đất: ${p.type_landing_name}
                mục đích đăng bài: ${purpose}
                giá thuê/ tháng: ${p.price_for_rent}
                giá khởi điểm: ${p.price_start}
                bước giá: ${p.bid_step}
                ngày bắt đầu: ${p.start_date ? moment(p.start_date).format('HH:mm DD/MM/YYYY') : 'Chưa xác định'}
                ngày kết thúc: ${p.end_date ? moment(p.end_date).format('HH:mm DD/MM/YYYY') : 'Chưa xác định'}`
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
- Khi giới thiệu các bài viết hoặc đề suất bất kì thông tin bài viết thì phải đảm bảo sử dụng format sau (giữ nguyên dấu - và cấu trúc):
 - Bài viết [id]
    tiêu đề: [tiêu đề]
    diện tich: [diện tích]
    địa chỉ: [địa chỉ]
    giá: [giá]
    loại đất: [loại đất]
    mục đích đăng bài: [mục dích đăng bài]
    giá thuê/ tháng: [giá thuê]
    giá khởi điểm: [giá khởi điểm]
    bước giá: [bước giá]
    ngày bắt đầu: [ngày bắt đầu]
    ngày kết thúc: [ngày kết thúc]
    link: http://localhost:5173/post/{id} (nếu có)
- hãy đưa ra các lưu ý cho người dùng nếu thấy thông tin bài viết bất thường như diện tích, giá, loại đất và tiêu đề (giữ nguyên dấu * và cấu trúc):
"Ví dụ: "*Lưu ý: Diện tích bài viết này là 1000m2, nhưng giá chỉ 1 triệu đồng, có vẻ không hợp lý. Bạn nên kiểm tra lại thông tin này."

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
        let aswer = response
            .replace(/\*\*/g, '') // Xóa markdown bold
            .replace(/\*/g, '') // Xóa markdown italic
            .replace(/#{1,6}\s/g, '') // Xóa markdown headers
            .trim();

        aswer = aswer.replace(/^-\s*/gm, '- ');; // Đảm bảo định dạng bài viết
        return aswer;
    }
}

// Phân tích câu ghi sổ bằng Claude. Nếu không có thông tin xác thực hoặc gọi lỗi,
// server sẽ dùng bộ phân tích luật (parser.js) thay thế.
import Anthropic from '@anthropic-ai/sdk';
import { toISODate } from './parser.js';

const MODEL = process.env.SOSACH_MODEL || 'claude-opus-5-5';

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['transactions'],
  properties: {
    transactions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['date', 'type', 'description', 'quantity', 'amount'],
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD' },
          type: { type: 'string', enum: ['thu', 'chi'] },
          description: { type: 'string' },
          quantity: { type: 'number' },
          amount: { type: 'integer', description: 'Tổng số tiền, đơn vị đồng' },
        },
      },
    },
  },
};

const SYSTEM = `Bạn là trợ lý ghi sổ cho hộ kinh doanh nhỏ ở Việt Nam.
Chuyển lời ghi chép (có thể viết tắt, không dấu, giọng địa phương) thành danh sách giao dịch.
- "thu": tiền bán hàng, dịch vụ khách trả. "chi": tiền mua hàng, nhập hàng, điện nước, thuê, lương...
- amount là tổng tiền của dòng đó (số lượng x đơn giá nếu có đơn giá), đơn vị đồng.
  Quy ước: k = nghìn, tr/củ/m = triệu, "1tr2" = 1.200.000, "lít" trong tiền bạc = 100.000.
- description ngắn gọn, viết có dấu, giữ tên hàng hóa.
- Nếu không nói ngày thì dùng ngày hôm nay; "hôm qua" là ngày trước đó.
- Bỏ qua câu không có số tiền.`;

export function aiAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.SOSACH_AI === '1');
}

let client;

export async function parseWithAI(text, today = new Date()) {
  client ??= new Anthropic();
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema: SCHEMA },
    },
    system: SYSTEM,
    messages: [{ role: 'user', content: `Hôm nay là ${toISODate(today)}.\n\n${text}` }],
  });

  if (response.stop_reason === 'refusal') throw new Error('AI từ chối yêu cầu');
  if (response.stop_reason === 'max_tokens') throw new Error('Phản hồi AI bị cắt ngắn');

  const json = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const { transactions } = JSON.parse(json);
  return transactions.map((t) => ({ ...t, source: 'ai' }));
}

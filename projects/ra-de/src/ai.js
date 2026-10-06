// Tạo câu hỏi bằng Claude theo cấu trúc đề định dạng mới (3 phần), trả về cùng cấu trúc
// với parseExam() để đi tiếp qua bước trộn đề và xuất Word.
import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.RADE_MODEL || 'claude-opus-5-5';

const option = { type: 'object', additionalProperties: false, required: ['text', 'correct'], properties: { text: { type: 'string' }, correct: { type: 'boolean' } } };
const level = { type: 'string', enum: ['biet', 'hieu', 'van_dung'] };

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['mcq', 'truefalse', 'short'],
  properties: {
    mcq: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['stem', 'options', 'level'], properties: { stem: { type: 'string' }, options: { type: 'array', items: option }, level } },
    },
    truefalse: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['stem', 'statements', 'level'], properties: { stem: { type: 'string' }, statements: { type: 'array', items: option }, level } },
    },
    short: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['stem', 'answer', 'level'], properties: { stem: { type: 'string' }, answer: { type: 'string' }, level } },
    },
  },
};

const SYSTEM = `Bạn là giáo viên giỏi, ra đề kiểm tra theo chương trình GDPT 2018 của Việt Nam.
Đề theo định dạng 3 phần:
- Phần I: trắc nghiệm nhiều phương án lựa chọn, đúng 4 phương án, chỉ 1 phương án đúng.
- Phần II: trắc nghiệm đúng sai. Mỗi câu có đoạn dẫn (tư liệu, tình huống, số liệu) và đúng 4 ý, có cả ý đúng lẫn ý sai.
- Phần III: trả lời ngắn, đáp án là một số hoặc một cụm từ rất ngắn, chấm được không mơ hồ.
Yêu cầu:
- Chính xác về kiến thức. Không bịa sự kiện, số liệu. Dùng thuật ngữ và cách viết tên riêng như sách giáo khoa Việt Nam.
- Phương án nhiễu hợp lý, độ dài tương đương đáp án đúng. Không dùng "tất cả các ý trên".
- Phân bổ mức độ biết/hiểu/vận dụng theo tỷ lệ được yêu cầu.
- Không đánh số câu, không ghi chữ A/B/C/D hay a)/b) trong nội dung.`;

export function aiAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.RADE_AI === '1');
}

let client;

export async function generateExam({ subject, grade, topic, material = '', counts = { mcq: 12, truefalse: 2, short: 4 }, mix = '40-30-30' }) {
  client ??= new Anthropic();
  const prompt = [
    `Môn: ${subject}, lớp ${grade}.`,
    `Nội dung kiểm tra: ${topic}.`,
    `Số câu: Phần I ${counts.mcq} câu, Phần II ${counts.truefalse} câu, Phần III ${counts.short} câu.`,
    `Tỷ lệ biết-hiểu-vận dụng: ${mix}.`,
    material && `Ra đề dựa trên tài liệu sau của giáo viên:\n<tai_lieu>\n${material}\n</tai_lieu>`,
  ].filter(Boolean).join('\n');

  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'high', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  });
  const response = await stream.finalMessage();
  if (response.stop_reason === 'refusal') throw new Error('AI từ chối yêu cầu');
  if (response.stop_reason === 'max_tokens') throw new Error('Đề quá dài, hãy giảm số câu');

  const data = JSON.parse(response.content.filter((b) => b.type === 'text').map((b) => b.text).join(''));
  return toExam(data);
}

const LETTERS = 'ABCD';

// Chuyển kết quả AI sang cấu trúc đề chung
export function toExam(data) {
  const parts = [
    { number: 1, type: 'mcq', title: '', questions: data.mcq.map((q) => ({ type: 'mcq', stem: q.stem, level: q.level, statements: [], answer: null, options: q.options.map((o, i) => ({ letter: LETTERS[i], text: o.text, correct: o.correct })) })) },
    { number: 2, type: 'truefalse', title: '', questions: data.truefalse.map((q) => ({ type: 'truefalse', stem: q.stem, level: q.level, options: [], answer: null, statements: q.statements.map((s, i) => ({ letter: 'abcd'[i], text: s.text, correct: s.correct })) })) },
    { number: 3, type: 'short', title: '', questions: data.short.map((q) => ({ type: 'short', stem: q.stem, level: q.level, options: [], statements: [], answer: q.answer })) },
  ].filter((p) => p.questions.length);
  return { parts, errors: [] };
}

// Xuất lại đề sang dạng văn bản để giáo viên xem, sửa trước khi trộn.
export function toText(exam) {
  const titles = { mcq: 'Câu trắc nghiệm nhiều phương án lựa chọn', truefalse: 'Câu trắc nghiệm đúng sai', short: 'Câu trắc nghiệm trả lời ngắn', essay: 'Tự luận' };
  const roman = ['', 'I', 'II', 'III', 'IV'];
  const lines = [];
  for (const p of exam.parts) {
    lines.push(`PHẦN ${roman[p.number]}. ${p.title || titles[p.type]}`);
    p.questions.forEach((q, i) => {
      lines.push(`Câu ${i + 1}. ${q.stem}`);
      for (const o of q.options) lines.push(`${o.correct ? '*' : ''}${o.letter}. ${o.text}`);
      for (const s of q.statements) lines.push(`${s.correct ? '*' : ''}${s.letter}) ${s.text}`);
      if (q.answer) lines.push(`Đáp án: ${q.answer}`);
    });
    lines.push('');
  }
  return lines.join('\n');
}

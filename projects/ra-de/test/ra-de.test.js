import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseExam, splitOptions } from '../src/parse.js';
import { mixExam, mixVersion, optionsLocked, versionCodes } from '../src/mix.js';
import { buildDocx } from '../src/docx.js';
import { toExam, toText } from '../src/ai.js';

const sample = readFileSync(new URL('../data/de-mau.txt', import.meta.url), 'utf8');

test('tách nhiều phương án trên một dòng', () => {
  assert.deepEqual(splitOptions('A. 1   *B. 2\tC. 3   D. 4').map((o) => [o.letter, o.text, o.correct]),
    [['A', '1', false], ['B', '2', true], ['C', '3', false], ['D', '4', false]]);
  assert.equal(splitOptions('Theo A. Smith thì...'), null);
  assert.equal(splitOptions('Ánh sáng'), null);
});

test('đọc đề mẫu đủ 3 phần, không lỗi', () => {
  const exam = parseExam(sample);
  assert.deepEqual(exam.errors, []);
  assert.deepEqual(exam.parts.map((p) => [p.type, p.questions.length]), [['mcq', 6], ['truefalse', 2], ['short', 2]]);
  const q3 = exam.parts[0].questions[2];
  assert.equal(q3.options.length, 4);
  assert.equal(q3.options.find((o) => o.correct).text, 'Liên Xô, Mĩ, Anh');
  assert.deepEqual(exam.parts[1].questions[0].statements.map((s) => s.correct), [true, false, true, false]);
  assert.equal(exam.parts[2].questions[1].answer, '193');
});

test('đọc được chữ dạng tổ hợp (NFD), chữ thường và không có tiêu đề phần', () => {
  const nfd = 'phần i. Trắc nghiệm\nCâu 1. Hỏi?\nA. x  *B. y  C. z  D. t'.normalize('NFD');
  const exam = parseExam(nfd);
  assert.deepEqual(exam.errors, []);
  assert.equal(exam.parts[0].type, 'mcq');
  const auto = parseExam('Câu 1. Hỏi?\na) Một\n*b) Hai\nc) Ba\n*d) Bốn');
  assert.equal(auto.parts[0].type, 'truefalse');
});

test('nội dung câu hỏi và phương án nhiều dòng', () => {
  const exam = parseExam('Câu 1. Cho đoạn văn:\n"Dòng thứ hai"\nHỏi gì?\n*A. Có\nnối tiếp\nB. Không');
  const q = exam.parts[0].questions[0];
  assert.equal(q.stem, 'Cho đoạn văn:\n"Dòng thứ hai"\nHỏi gì?');
  assert.equal(q.options[0].text, 'Có\nnối tiếp');
});

test('báo lỗi dễ hiểu cho giáo viên', () => {
  const { errors } = parseExam('PHẦN I.\nCâu 1. Hỏi?\nA. x  B. y\nCâu 2. Hỏi?\n*A. x  *B. y\nPHẦN II.\nCâu 1. Dẫn\na) 1\nb) 2\nPHẦN III.\nCâu 1. Hỏi?');
  assert.deepEqual(errors, [
    'Phần 1, câu 1: chưa đánh dấu đáp án đúng (thêm * trước phương án)',
    'Phần 1, câu 2: có 2 đáp án đúng, chỉ được 1',
    'Phần 2, câu 1: câu đúng/sai cần đủ 4 ý a), b), c), d)',
    'Phần 3, câu 1: thiếu dòng "Đáp án: ..."',
  ]);
});

test('trộn đề: cùng mã cho cùng kết quả, đáp án luôn khớp nội dung', () => {
  const exam = parseExam(sample);
  const a = mixVersion(exam, 101);
  const b = mixVersion(exam, 101);
  assert.deepEqual(a, b);
  const versions = mixExam(exam, versionCodes(8));
  const keys = new Set(versions.map((v) => v.key[0].answers.map((x) => x.answer).join('')));
  assert.ok(keys.size >= 6, 'các mã đề phải khác nhau');
  for (const v of versions) {
    v.parts[0].questions.forEach((q, i) => {
      const correct = q.options.find((o) => o.correct);
      assert.equal(v.key[0].answers[i].answer, correct.letter);
      const original = exam.parts[0].questions.find((x) => x.stem === q.stem);
      assert.equal(correct.text, original.options.find((o) => o.correct).text);
      assert.deepEqual(q.options.map((o) => o.letter), ['A', 'B', 'C', 'D']);
    });
    assert.equal(v.parts[0].questions.length, 6);
  }
});

test('không đảo phương án kiểu "Tất cả các ý trên", "Cả A và B"', () => {
  assert.equal(optionsLocked({ options: [{ text: 'x' }, { text: 'Tất cả các ý trên' }] }), true);
  assert.equal(optionsLocked({ options: [{ text: 'x' }, { text: 'Cả A và B đều đúng' }] }), true);
  assert.equal(optionsLocked({ options: [{ text: 'A và B' }] }), true);
  assert.equal(optionsLocked({ options: [{ text: 'Hà Nội' }, { text: 'Đà Nẵng' }] }), false);
  const exam = parseExam(sample);
  for (const v of mixExam(exam, versionCodes(5))) {
    const q = v.parts[0].questions.find((x) => x.stem.startsWith('Mục đích'));
    assert.equal(q.options[3].text, 'Tất cả các ý trên');
  }
});

test('kết quả AI chuyển về văn bản rồi đọc lại không mất gì', () => {
  const ai = toExam({
    mcq: [{ stem: 'Thủ đô?', level: 'biet', options: [{ text: 'Huế', correct: false }, { text: 'Hà Nội', correct: true }, { text: 'Vinh', correct: false }, { text: 'Hội An', correct: false }] }],
    truefalse: [{ stem: 'Dẫn', level: 'hieu', statements: [true, false, false, true].map((c, i) => ({ text: `Ý ${i}`, correct: c })) }],
    short: [{ stem: 'Bao nhiêu tỉnh?', level: 'biet', answer: '34' }],
  });
  const back = parseExam(toText(ai));
  assert.deepEqual(back.errors, []);
  assert.equal(back.parts[0].questions[0].options[1].correct, true);
  assert.deepEqual(back.parts[1].questions[0].statements.map((s) => s.correct), [true, false, false, true]);
  assert.equal(back.parts[2].questions[0].answer, '34');
});

test('xuất file Word hợp lệ', async () => {
  const buf = await buildDocx(mixExam(parseExam(sample), versionCodes(2)), { school: 'TRƯỜNG <A&B>', subject: 'Sử', minutes: 45 });
  assert.equal(buf.subarray(0, 2).toString(), 'PK'); // file .docx là file zip
  assert.ok(buf.length > 5000);
});

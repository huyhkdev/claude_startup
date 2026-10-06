// Trộn đề: đảo thứ tự câu trong từng phần và đảo phương án A–D của câu trắc nghiệm.
// Cùng một mã đề luôn cho ra cùng một đề, nên in lại hay chấm lại không bị lệch.

const LETTERS = ['A', 'B', 'C', 'D'];

// Phương án nhắc tới phương án khác thì không được đảo thứ tự.
const PINNED_RE = /(tất cả|các (đáp án|phương án|ý) trên|cả (hai|ba|A|B|C|D)|đều (đúng|sai)|không có (đáp án|phương án|ý) nào|(?<![\p{L}])[A-D] và [A-D](?![\p{L}]))/iu;

export function rng(seed) {
  let a = typeof seed === 'number' ? seed : [...String(seed)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761), 1779033703);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function optionsLocked(q) {
  return q.options.some((o) => PINNED_RE.test(o.text));
}

export function mixVersion(exam, code, { shuffleQuestions = true, shuffleOptions = true } = {}) {
  const rand = rng(`ra-de:${code}`);
  const parts = exam.parts.map((p) => {
    const questions = (shuffleQuestions ? shuffle(p.questions, rand) : p.questions).map((q) => {
      if (q.type !== 'mcq') return q;
      const options = shuffleOptions && !optionsLocked(q) ? shuffle(q.options, rand) : q.options;
      return { ...q, options: options.map((o, i) => ({ ...o, letter: LETTERS[i] })) };
    });
    return { ...p, questions };
  });
  return { code: String(code), parts, key: answerKey(parts) };
}

export function answerKey(parts) {
  return parts.map((p) => ({
    number: p.number,
    type: p.type,
    answers: p.questions.map((q, i) => {
      const n = i + 1;
      if (q.type === 'mcq') return { n, answer: q.options.find((o) => o.correct)?.letter ?? '?' };
      if (q.type === 'truefalse') return { n, answer: q.statements.map((s) => `${s.letter}) ${s.correct ? 'Đ' : 'S'}`).join('  ') };
      if (q.type === 'short') return { n, answer: q.answer ?? '' };
      return { n, answer: '' };
    }),
  }));
}

// Mã đề kiểu 101, 102... hoặc theo danh sách giáo viên nhập.
export function versionCodes(count, start = 101) {
  return Array.from({ length: count }, (_, i) => String(start + i));
}

export function mixExam(exam, codes, options) {
  return codes.map((c) => mixVersion(exam, c, options));
}

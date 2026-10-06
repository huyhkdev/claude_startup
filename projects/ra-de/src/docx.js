// Xuất file Word: mỗi mã đề một trang (hoặc nhiều trang), cuối file là bảng đáp án.
import {
  AlignmentType, Document, Packer, PageBreak, Paragraph, Table, TableCell, TableRow, TabStopType, TextRun, WidthType,
} from 'docx';

const PART_TITLES = {
  mcq: 'Câu trắc nghiệm nhiều phương án lựa chọn',
  truefalse: 'Câu trắc nghiệm đúng sai',
  short: 'Câu trắc nghiệm trả lời ngắn',
  essay: 'Tự luận',
};
const ROMAN = ['', 'I', 'II', 'III', 'IV'];
const CONTENT_WIDTH = 9638; // A4 trừ lề 2 cm mỗi bên, đơn vị twip

// Văn bản nhiều dòng thành các TextRun có ngắt dòng
function runs(text, opts = {}) {
  return String(text).split('\n').map((t, i) => new TextRun({ text: t, break: i ? 1 : 0, ...opts }));
}

const p = (children, opts = {}) => new Paragraph({ spacing: { after: 60 }, ...opts, children });

// Phương án ngắn xếp 4 cột, vừa thì 2 cột, dài thì mỗi phương án một dòng.
function optionParagraphs(options) {
  const longest = Math.max(...options.map((o) => o.text.length));
  const perLine = options.some((o) => o.text.includes('\n')) ? 1 : longest <= 16 ? 4 : longest <= 40 ? 2 : 1;
  const step = Math.floor((CONTENT_WIDTH - 284) / perLine);
  const tabStops = Array.from({ length: perLine - 1 }, (_, i) => ({ type: TabStopType.LEFT, position: 284 + step * (i + 1) }));
  const out = [];
  for (let i = 0; i < options.length; i += perLine) {
    const children = options.slice(i, i + perLine).flatMap((o, j) => [
      ...(j ? [new TextRun({ text: '\t' })] : []),
      new TextRun({ text: `${o.letter}. `, bold: true }),
      ...runs(o.text),
    ]);
    out.push(p(children, { indent: { left: 284 }, tabStops }));
  }
  return out;
}

function questionParagraphs(q, n) {
  const out = [p([new TextRun({ text: `Câu ${n}. `, bold: true }), ...runs(q.stem)], { alignment: AlignmentType.JUSTIFIED })];
  if (q.type === 'mcq') out.push(...optionParagraphs(q.options));
  if (q.type === 'truefalse') {
    for (const s of q.statements) out.push(p([new TextRun({ text: `${s.letter}) ` }), ...runs(s.text)], { indent: { left: 284 } }));
  }
  if (q.type === 'essay') out.push(p([new TextRun({ text: '' })]));
  return out;
}

function versionSection(v, meta, isLast) {
  const children = [
    p(runs(meta.school || 'TRƯỜNG ....................', { bold: true }), { alignment: AlignmentType.CENTER }),
    p(runs(meta.title || 'ĐỀ KIỂM TRA', { bold: true, size: 26 }), { alignment: AlignmentType.CENTER }),
    p(runs(`Môn: ${meta.subject || '..........'}${meta.minutes ? ` – Thời gian làm bài: ${meta.minutes} phút` : ''}`, { italics: true }), { alignment: AlignmentType.CENTER }),
    p([new TextRun({ text: `Mã đề ${v.code}`, bold: true, border: { style: 'single', size: 6, color: '000000' } })], { alignment: AlignmentType.RIGHT }),
    p(runs('Họ và tên: ................................................................  Số báo danh: ...................'), { spacing: { after: 160 } }),
  ];
  for (const part of v.parts) {
    const title = part.title || PART_TITLES[part.type];
    children.push(p([new TextRun({ text: `PHẦN ${ROMAN[part.number] ?? part.number}. `, bold: true }), new TextRun({ text: title, bold: true })], { spacing: { before: 120, after: 60 } }));
    part.questions.forEach((q, i) => children.push(...questionParagraphs(q, i + 1)));
  }
  children.push(p(runs('------ HẾT ------', { bold: true }), { alignment: AlignmentType.CENTER, spacing: { before: 200 } }));
  if (!isLast) children.push(new Paragraph({ children: [new PageBreak()] }));
  return children;
}

const cell = (text, opts = {}) => new TableCell({
  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(text), size: 20, ...opts })] })],
});

// Bảng đáp án trắc nghiệm: mỗi hàng một mã đề, mỗi cột một câu.
function mcqKeyTable(versions, partIdx) {
  const count = versions[0].key[partIdx].answers.length;
  const header = new TableRow({ tableHeader: true, children: [cell('Mã đề', { bold: true }), ...Array.from({ length: count }, (_, i) => cell(i + 1, { bold: true }))] });
  const rows = versions.map((v) => new TableRow({ children: [cell(v.code, { bold: true }), ...v.key[partIdx].answers.map((a) => cell(a.answer))] }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [header, ...rows] });
}

function listKeyTable(versions, partIdx) {
  const rows = [new TableRow({ tableHeader: true, children: [cell('Mã đề', { bold: true }), cell('Câu', { bold: true }), cell('Đáp án', { bold: true })] })];
  for (const v of versions) {
    for (const a of v.key[partIdx].answers) rows.push(new TableRow({ children: [cell(v.code), cell(a.n), cell(a.answer)] }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

function answerSection(versions) {
  const children = [
    new Paragraph({ children: [new PageBreak()] }),
    p(runs('ĐÁP ÁN', { bold: true, size: 28 }), { alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
  ];
  versions[0].key.forEach((k, idx) => {
    if (k.type === 'essay') return;
    children.push(p(runs(`PHẦN ${ROMAN[k.number] ?? k.number}. ${PART_TITLES[k.type]}`, { bold: true }), { spacing: { before: 200, after: 100 } }));
    children.push(k.type === 'mcq' ? mcqKeyTable(versions, idx) : listKeyTable(versions, idx));
  });
  return children;
}

export async function buildDocx(versions, meta = {}) {
  const doc = new Document({
    creator: 'Ra Đề',
    title: meta.title || 'Đề kiểm tra',
    styles: { default: { document: { run: { font: 'Times New Roman', size: 24 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      children: [...versions.flatMap((v, i) => versionSection(v, meta, i === versions.length - 1)), ...answerSection(versions)],
    }],
  });
  return Packer.toBuffer(doc);
}

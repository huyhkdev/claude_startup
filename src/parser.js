// Bộ phân tích câu ghi sổ tiếng Việt, không cần AI.
// Ví dụ: "bán 3 tô phở x 45k", "nhập 20kg thịt 2tr4", "tiền điện 1.250.000đ"

const EXPENSE_WORDS = [
  'mua', 'nhập', 'nhap', 'trả', 'tra ', 'chi ', 'chi phí', 'tiền điện', 'tiền nước',
  'tiền nhà', 'thuê', 'lương', 'phí', 'sửa', 'ship', 'vận chuyển', 'đóng',
];
const INCOME_WORDS = ['bán', 'ban ', 'thu ', 'thu tiền', 'khách trả', 'doanh thu', 'nhận'];

const UNIT_MULTIPLIERS = [
  [/^(tỷ|ty|tỉ)$/, 1_000_000_000],
  [/^(tr|triệu|trieu|m)$/, 1_000_000],
  [/^(k|nghìn|nghin|ngàn|ngan|n)$/, 1_000],
  [/^(đ|d|đồng|dong|vnd|vnđ)?$/, 1],
];

function normalizeNumber(raw) {
  // "1.250.000" -> 1250000 ; "1,5" -> 1.5 ; "1.5" -> 1.5
  if (/^\d{1,3}([.,]\d{3})+$/.test(raw)) return Number(raw.replace(/[.,]/g, ''));
  return Number(raw.replace(',', '.'));
}

// Tìm tất cả số tiền trong câu, trả về [{value, index, length}]
export function findAmounts(text) {
  const re = /(\d+(?:[.,]\d+)*)\s*(tỷ|tỉ|ty|triệu|trieu|tr|nghìn|nghin|ngàn|ngan|k|m|n|đồng|dong|vnđ|vnd|đ|d)?(\d{1,3})?(?![\p{L}\d])/giu;
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const [whole, numRaw, unitRaw = '', tail] = m;
    const unit = unitRaw.toLowerCase();
    const mult = UNIT_MULTIPLIERS.find(([r]) => r.test(unit))?.[1] ?? 1;
    let value = normalizeNumber(numRaw) * mult;
    // "1tr2" = 1.2 triệu, "2k5" = 2.5 nghìn
    if (tail && mult > 1) value += Number(tail) * mult / 10 ** tail.length;
    out.push({ value: Math.round(value), index: m.index, length: whole.length, hasUnit: mult > 1 || unit !== '' });
  }
  return out;
}

export function detectType(text) {
  const t = ` ${text.toLowerCase()} `;
  const exp = EXPENSE_WORDS.findIndex((w) => t.includes(` ${w}`));
  const inc = INCOME_WORDS.findIndex((w) => t.includes(` ${w}`));
  if (exp >= 0 && inc < 0) return 'chi';
  if (inc >= 0 && exp < 0) return 'thu';
  if (exp >= 0 && inc >= 0) {
    return t.indexOf(` ${EXPENSE_WORDS[exp]}`) < t.indexOf(` ${INCOME_WORDS[inc]}`) ? 'chi' : 'thu';
  }
  return 'thu';
}

// Phân tích một dòng thành một giao dịch, hoặc null nếu không có số tiền.
export function parseLine(line, today = new Date()) {
  const text = line.trim();
  if (!text) return null;
  const amounts = findAmounts(text);
  if (amounts.length === 0) return null;

  // Tiền là số có đơn vị cuối cùng; nếu không có đơn vị thì lấy số lớn nhất.
  const withUnit = amounts.filter((a) => a.hasUnit);
  const price = withUnit.length ? withUnit[withUnit.length - 1] : amounts.reduce((a, b) => (b.value > a.value ? b : a));

  let amount = price.value;
  let quantity = 1;
  const perUnit = /(?:^|\s)(?:x|×|\*)\s*$/i.test(text.slice(0, price.index))
    || /^\s*(?:\/|mỗi|một)/i.test(text.slice(price.index + price.length));
  if (perUnit) {
    const qty = amounts.find((a) => a !== price && a.index < price.index && !a.hasUnit);
    if (qty) {
      quantity = qty.value;
      amount = qty.value * price.value;
    }
  }

  const description = text
    .slice(0, price.index)
    .replace(/(?:^|\s)(?:x|×|\*)\s*$/i, '')
    .trim() || text;

  return {
    date: toISODate(today),
    type: detectType(text),
    description,
    quantity,
    amount,
    source: 'rule',
  };
}

export function parseText(input, today = new Date()) {
  return input
    .split(/\r?\n|;/)
    .map((l) => parseLine(l, today))
    .filter(Boolean);
}

export function toISODate(d) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

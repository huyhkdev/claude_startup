// Xuất sổ sách dạng CSV (mở được bằng Excel), bố cục theo mẫu sổ doanh thu
// bán hàng hóa, dịch vụ (S1-HKD) của Thông tư 88/2021/TT-BTC.

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows) {
  // BOM để Excel nhận đúng tiếng Việt UTF-8
  return '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function revenueLedgerCsv(transactions, { businessName = '', period = '' } = {}) {
  const income = transactions.filter((t) => t.type === 'thu').sort((a, b) => a.date.localeCompare(b.date));
  const total = income.reduce((s, t) => s + t.amount, 0);
  const rows = [
    ['SỔ DOANH THU BÁN HÀNG HÓA, DỊCH VỤ (Mẫu S1-HKD)'],
    ['Hộ kinh doanh', businessName],
    ['Kỳ', period],
    [],
    ['STT', 'Ngày tháng', 'Diễn giải', 'Số lượng', 'Doanh thu (đồng)'],
    ...income.map((t, i) => [i + 1, formatDate(t.date), t.description, t.quantity ?? 1, t.amount]),
    ['', '', 'Tổng cộng', '', total],
  ];
  return toCsv(rows);
}

export function expenseLedgerCsv(transactions) {
  const exp = transactions.filter((t) => t.type === 'chi').sort((a, b) => a.date.localeCompare(b.date));
  const total = exp.reduce((s, t) => s + t.amount, 0);
  return toCsv([
    ['STT', 'Ngày tháng', 'Diễn giải', 'Số tiền chi (đồng)'],
    ...exp.map((t, i) => [i + 1, formatDate(t.date), t.description, t.amount]),
    ['', '', 'Tổng cộng', total],
  ]);
}

export function summarizeByMonth(transactions) {
  const map = new Map();
  for (const t of transactions) {
    const key = t.date.slice(0, 7);
    const m = map.get(key) ?? { month: key, thu: 0, chi: 0 };
    m[t.type] += t.amount;
    map.set(key, m);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month)).map((m) => ({ ...m, lai: m.thu - m.chi }));
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

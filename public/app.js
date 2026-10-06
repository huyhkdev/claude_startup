import { parseText } from '/src/parser.js';
import { CATEGORIES, TAX_CONFIG, estimateTax, nextDeadline, projectAnnualRevenue } from '/src/tax.js';
import { expenseLedgerCsv, revenueLedgerCsv } from '/src/ledger.js';

const KEY = 'sosach:v1';
const $ = (id) => document.getElementById(id);
const vnd = (n) => n.toLocaleString('vi-VN') + ' đ';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? { transactions: [], category: 'san_xuat' };
  } catch {
    return { transactions: [], category: 'san_xuat' };
  }
}
const state = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* bộ nhớ trình duyệt bị chặn */ }
}

async function parse(text) {
  try {
    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch {
    return { engine: 'rule (offline)', transactions: parseText(text) };
  }
}

$('quick-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = $('quick-input').value.trim();
  if (!text) return;
  const { engine, transactions } = await parse(text);
  if (transactions.length === 0) {
    $('engine').textContent = 'Không tìm thấy số tiền nào trong câu.';
    return;
  }
  for (const t of transactions) state.transactions.push({ ...t, id: crypto.randomUUID() });
  $('quick-input').value = '';
  $('engine').textContent = `Đã ghi ${transactions.length} giao dịch (bộ phân tích: ${engine}).`;
  save();
  render();
});

$('category').addEventListener('change', (e) => {
  state.category = e.target.value;
  save();
  render();
});

function download(name, content) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}
$('export-thu').addEventListener('click', () =>
  download('so-doanh-thu-S1-HKD.csv', revenueLedgerCsv(state.transactions, { period: `Năm ${TAX_CONFIG.year}` })));
$('export-chi').addEventListener('click', () => download('so-chi-phi.csv', expenseLedgerCsv(state.transactions)));

function render() {
  const year = String(TAX_CONFIG.year);
  const txs = state.transactions.filter((t) => t.date.startsWith(year));
  const thu = txs.filter((t) => t.type === 'thu').reduce((s, t) => s + t.amount, 0);
  const chi = txs.filter((t) => t.type === 'chi').reduce((s, t) => s + t.amount, 0);
  $('stat-thu').textContent = vnd(thu);
  $('stat-chi').textContent = vnd(chi);
  $('stat-lai').textContent = vnd(thu - chi);

  document.querySelector('.year').textContent = year;
  const { projected, days } = projectAnnualRevenue(state.transactions);
  const tax = estimateTax(projected, state.category);
  $('tax-result').innerHTML = `
    <div class="tax-grid">
      <span>Doanh thu dự kiến cả năm${days >= 14 ? ` (ngoại suy từ ${days} ngày)` : ''}</span><span>${vnd(projected)}</span>
      <span>Thuế GTGT (${(tax.rate.vat * 100).toFixed(1)}%)</span><span>${vnd(tax.vat)}</span>
      <span>Thuế TNCN (${(tax.rate.pit * 100).toFixed(1)}%)</span><span>${vnd(tax.pit)}</span>
      <span class="total">Tổng thuế ước tính</span><span class="total">${vnd(tax.total)}</span>
    </div>
    ${tax.exempt ? `<p class="muted">Doanh thu dưới ngưỡng ${vnd(TAX_CONFIG.exemptThreshold)}/năm: chưa phải nộp thuế GTGT và TNCN.</p>` : ''}
    ${!tax.exempt && tax.total > 0 ? `<p class="muted">Nên để dành khoảng <strong>${vnd(Math.round(tax.total / 12))}</strong> mỗi tháng.</p>` : ''}`;

  const d = nextDeadline();
  const [y, m, dd] = d.due.split('-');
  $('deadline').textContent = `Hạn nộp tờ khai quý ${d.quarter} (nếu kê khai theo quý): ${dd}/${m}/${y}`;

  const list = $('tx-list');
  list.replaceChildren(...[...state.transactions].reverse().map((t) => {
    const li = document.createElement('li');
    li.innerHTML = `<div><span class="desc"></span><span class="date"></span></div>
      <span class="amt ${t.type}">${t.type === 'thu' ? '+' : '−'}${vnd(t.amount)}</span>
      <button title="Xóa" aria-label="Xóa">✕</button>`;
    li.querySelector('.desc').textContent = t.description;
    li.querySelector('.date').textContent = t.date.split('-').reverse().join('/');
    li.querySelector('button').addEventListener('click', () => {
      state.transactions = state.transactions.filter((x) => x.id !== t.id);
      save();
      render();
    });
    return li;
  }));
  $('empty').hidden = state.transactions.length > 0;
}

$('category').replaceChildren(...Object.entries(CATEGORIES).map(([value, c]) => {
  const o = new Option(`${c.label} (${((c.vat + c.pit) * 100).toFixed(1)}%)`, value);
  o.selected = value === state.category;
  return o;
}));
render();

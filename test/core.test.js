import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findAmounts, parseLine, parseText } from '../src/parser.js';
import { estimateTax, nextDeadline, projectAnnualRevenue } from '../src/tax.js';
import { revenueLedgerCsv, summarizeByMonth } from '../src/ledger.js';

const DAY = new Date('2026-10-06T08:00:00');

test('đọc các cách viết số tiền phổ biến', () => {
  const v = (s) => findAmounts(s).map((a) => a.value);
  assert.deepEqual(v('150k'), [150_000]);
  assert.deepEqual(v('1tr2'), [1_200_000]);
  assert.deepEqual(v('1,5 triệu'), [1_500_000]);
  assert.deepEqual(v('2 tỷ'), [2_000_000_000]);
  assert.deepEqual(v('1.250.000đ'), [1_250_000]);
  assert.deepEqual(v('500 ngàn'), [500_000]);
  assert.deepEqual(v('2k5'), [2_500]);
});

test('không nhầm đơn vị đo lường với tiền', () => {
  const t = parseLine('nhập 20kg thịt 2tr4', DAY);
  assert.equal(t.amount, 2_400_000);
  assert.equal(t.type, 'chi');
});

test('nhân số lượng với đơn giá', () => {
  const t = parseLine('bán 3 tô phở x 45k', DAY);
  assert.equal(t.amount, 135_000);
  assert.equal(t.quantity, 3);
  assert.equal(t.type, 'thu');
  assert.equal(t.description, 'bán 3 tô phở');
  assert.equal(parseLine('bán 10 ly cà phê 25k/ly', DAY).amount, 250_000);
});

test('nhận diện thu/chi', () => {
  assert.equal(parseLine('tiền điện tháng 9 1.250.000đ', DAY).type, 'chi');
  assert.equal(parseLine('khách trả nợ 300k', DAY).type, 'thu');
  assert.equal(parseLine('thuê mặt bằng 8 triệu', DAY).type, 'chi');
});

test('tách nhiều dòng và bỏ dòng không có tiền', () => {
  const txs = parseText('bán 2 bánh mì x 20k\nhôm nay mưa\nmua rau 50k', DAY);
  assert.equal(txs.length, 2);
  assert.equal(txs[0].date, '2026-10-06');
});

test('miễn thuế dưới ngưỡng, tính đúng tỷ lệ khi vượt ngưỡng', () => {
  assert.equal(estimateTax(150_000_000, 'san_xuat').total, 0);
  const t = estimateTax(1_000_000_000, 'san_xuat');
  assert.equal(t.vat, 30_000_000);
  assert.equal(t.pit, 15_000_000);
  const excess = estimateTax(1_000_000_000, 'phan_phoi', { exemptThreshold: 200_000_000, taxOnExcessOnly: true });
  assert.equal(excess.total, 12_000_000);
});

test('ngoại suy doanh thu cả năm', () => {
  const txs = Array.from({ length: 30 }, (_, i) => ({
    type: 'thu', amount: 1_000_000, date: `2026-03-${String(i + 1).padStart(2, '0')}`,
  }));
  const p = projectAnnualRevenue(txs, 2026);
  assert.equal(p.actual, 30_000_000);
  assert.equal(p.projected, 365_000_000);
});

test('hạn nộp tờ khai quý tiếp theo', () => {
  assert.deepEqual(nextDeadline(new Date('2026-10-06')), { quarter: 3, due: '2026-10-31' });
  assert.deepEqual(nextDeadline(new Date('2026-01-15')), { quarter: 4, due: '2026-01-31' });
});

test('xuất sổ S1-HKD dạng CSV', () => {
  const csv = revenueLedgerCsv([
    { type: 'thu', date: '2026-10-02', description: 'bán phở, quẩy', quantity: 1, amount: 50_000 },
    { type: 'chi', date: '2026-10-01', description: 'mua rau', amount: 20_000 },
  ]);
  assert.ok(csv.startsWith('﻿'));
  assert.match(csv, /02\/10\/2026,"bán phở, quẩy",1,50000/);
  assert.match(csv, /Tổng cộng,,50000/);
  assert.ok(!csv.includes('mua rau'));
});

test('tổng hợp theo tháng', () => {
  const s = summarizeByMonth([
    { type: 'thu', date: '2026-10-02', amount: 100 },
    { type: 'chi', date: '2026-10-05', amount: 30 },
  ]);
  assert.deepEqual(s, [{ month: '2026-10', thu: 100, chi: 30, lai: 70 }]);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { areaHa, overlapRatio, selfIntersects, validateRing } from '../src/geo.js';
import { assessLots, assessPlots, toDdsGeoJSON } from '../src/eudr.js';
import { renderReport } from '../src/report.js';

// Hình vuông cạnh ~100 m quanh Buôn Ma Thuột
const LAT = 12.7;
const dLat = 100 / 111_320;
const dLon = 100 / (111_320 * Math.cos((LAT * Math.PI) / 180));
const square = (x = 0, y = 0, s = 1) => [
  [108 + x * dLon, LAT + y * dLat], [108 + (x + s) * dLon, LAT + y * dLat],
  [108 + (x + s) * dLon, LAT + (y + s) * dLat], [108 + x * dLon, LAT + (y + s) * dLat],
];

test('diện tích hình vuông 100 m ≈ 1 ha', () => {
  assert.ok(Math.abs(areaHa(square()) - 1) < 0.005);
  assert.ok(Math.abs(areaHa(square(0, 0, 2)) - 4) < 0.02);
});

test('phát hiện đa giác tự cắt và tọa độ bị đảo', () => {
  const [a, b, c, d] = square();
  assert.equal(selfIntersects([a, c, b, d]), true);
  assert.equal(selfIntersects(square()), false);
  assert.deepEqual(validateRing(square()), []);
  assert.match(validateRing(square().map(([lon, lat]) => [lat, lon]))[0], /ngoài Việt Nam/);
});

test('tỷ lệ chồng lấn', () => {
  assert.equal(overlapRatio(square(0, 0), square(5, 5)), 0);
  assert.ok(Math.abs(overlapRatio(square(0, 0), square(0.5, 0)) - 0.5) < 0.03);
  assert.equal(overlapRatio(square(0, 0), square(-1, -1, 3)), 1);
});

const farmer = (id) => ({ id, name: `Hộ ${id}` });
const polyPlot = (id, ring, f = farmer(id), extra = {}) => ({ id, farmer: f, geometry: { type: 'Polygon', coordinates: [ring] }, ...extra });

test('mất rừng trước mốc 31/12/2020 không bị tính', () => {
  const plots = [polyPlot('A', square())];
  const layers = { forestLoss: [{ name: 'cũ', date: '2020-06-01', ring: square(-1, -1, 3) }] };
  assert.equal(assessPlots(plots, layers)[0].status, 'green');
  layers.forestLoss[0].date = '2021-01-01';
  assert.equal(assessPlots(plots, layers)[0].status, 'red');
});

test('chạm nhẹ vùng mất rừng chỉ là cảnh báo', () => {
  const plots = [polyPlot('A', square())];
  const layers = { forestLoss: [{ name: 'mép', date: '2023-01-01', ring: square(0.98, 0, 1) }] };
  const r = assessPlots(plots, layers)[0];
  assert.equal(r.status, 'yellow');
  assert.match(r.issues[0].message, /sai số GPS/);
});

test('thửa > 4 ha chỉ có điểm thì không đạt; ≤ 4 ha thì được', () => {
  const pt = { type: 'Point', coordinates: [108.1, 12.7] };
  const [big, small] = assessPlots([
    { id: 'B', farmer: farmer('B'), geometry: pt, declaredAreaHa: 4.5 },
    { id: 'S', farmer: farmer('S'), geometry: pt, declaredAreaHa: 3 },
  ]);
  assert.equal(big.status, 'red');
  assert.equal(small.status, 'green');
});

test('thửa trong rừng phòng hộ không đạt; thửa trùng hộ khác cần kiểm tra', () => {
  const plots = [polyPlot('A', square()), polyPlot('B', square(0.5, 0)), polyPlot('C', square(10, 10))];
  const layers = { protectedAreas: [{ name: 'PH', ring: square(9, 9, 3) }] };
  const [a, b, c] = assessPlots(plots, layers);
  assert.equal(a.status, 'yellow');
  assert.equal(b.status, 'yellow');
  assert.equal(c.status, 'red');
});

test('cân bằng khối lượng cộng dồn qua các lô', () => {
  const plots = [polyPlot('A', square())]; // 1 ha → tối đa 4.500 kg
  const results = assessPlots(plots, {});
  const lots = [
    { id: 'L1', deliveries: [{ plotId: 'A', kg: 3000 }] },
    { id: 'L2', deliveries: [{ plotId: 'A', kg: 2000 }] },
    { id: 'L3', deliveries: [{ plotId: 'X', kg: 10 }] },
  ];
  const [l1, l2, l3] = assessLots(lots, plots, results);
  assert.equal(l1.status, 'green');
  assert.equal(l2.status, 'red');
  assert.match(l2.issues[0].message, /5\.000 kg/);
  assert.equal(l3.status, 'red');
});

test('GeoJSON cho tờ khai DDS', () => {
  const plots = [
    polyPlot('A', square(), farmer('A'), { commune: 'Xã X', province: 'Đắk Lắk' }),
    { id: 'P', farmer: farmer('P'), geometry: { type: 'Point', coordinates: [108.1234567, 12.7654321] }, declaredAreaHa: 2 },
  ];
  const g = toDdsGeoJSON(['A', 'P'], plots);
  assert.equal(g.type, 'FeatureCollection');
  const [a, p] = g.features;
  assert.equal(a.properties.ProducerCountry, 'VN');
  assert.equal(a.properties.ProductionPlace, 'Xã X, Đắk Lắk');
  assert.ok(Math.abs(a.properties.Area - 1) < 0.01);
  const ring = a.geometry.coordinates[0];
  assert.deepEqual(ring[0], ring[ring.length - 1]);
  assert.deepEqual(p.geometry, { type: 'Point', coordinates: [108.123457, 12.765432] });
  assert.equal(p.properties.Area, 2);
});

test('dữ liệu mẫu chạy trọn luồng và báo cáo thoát ký tự HTML', () => {
  const { plots, layers, lots } = JSON.parse(readFileSync(new URL('../data/demo.json', import.meta.url)));
  const plotResults = assessPlots(plots, layers);
  const lotResults = assessLots(lots, plots, plotResults);
  assert.deepEqual(lotResults.map((l) => l.status), ['yellow', 'red']);
  plots[0].farmer.name = '<script>x</script>';
  const html = renderReport({ plots, layers, plotResults: assessPlots(plots, layers), lotResults });
  assert.ok(!html.includes('<script>x'));
  assert.ok(html.includes('&lt;script&gt;'));
});

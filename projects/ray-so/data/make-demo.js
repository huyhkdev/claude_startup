// Sinh dữ liệu MẪU (hư cấu) quanh Buôn Ma Thuột, Đắk Lắk để chạy thử.
// Tên hộ, thửa và các lớp mất rừng đều không có thật.
import { writeFileSync } from 'node:fs';

const LAT0 = 12.712;
const LON0 = 108.021;
const M_LAT = 1 / 111_320; // độ vĩ / mét
const M_LON = 1 / (111_320 * Math.cos((LAT0 * Math.PI) / 180));
const r6 = (v) => Number(v.toFixed(6));
// Đa giác từ các đỉnh tính bằng mét so với gốc (dx, dy)
const poly = (dx, dy, pts) => pts.map(([x, y]) => [r6(LON0 + (dx + x) * M_LON), r6(LAT0 + (dy + y) * M_LAT)]);
const rect = (dx, dy, w, h) => poly(dx, dy, [[0, 0], [w, 0], [w, h], [0, h], [0, 0]]);
const plot = (id, farmer, geometry, extra = {}) => ({
  id, farmer, commune: 'Xã Hòa Phú (mẫu)', district: 'TP. Buôn Ma Thuột', province: 'Đắk Lắk', crop: 'coffee', geometry, ...extra,
});
const P = (ring) => ({ type: 'Polygon', coordinates: [ring] });

const f = (id, name) => ({ id, name });
const A = f('H01', 'Y Thơ Niê (mẫu)');
const B = f('H02', 'Nguyễn Văn Hùng (mẫu)');
const C = f('H03', 'H\'Lan Byă (mẫu)');
const D = f('H04', 'Trần Thị Mai (mẫu)');
const E = f('H05', 'Lê Văn Tâm (mẫu)');

const plots = [
  plot('T01', A, P(rect(0, 0, 120, 100)), { declaredAreaHa: 1.2 }),
  plot('T02', B, P(poly(200, 0, [[0, 0], [180, 10], [170, 150], [10, 140], [0, 0]])), { declaredAreaHa: 2.5 }),
  plot('T03', C, { type: 'Point', coordinates: [r6(LON0 + 500 * M_LON), r6(LAT0 + 50 * M_LAT)] }, { declaredAreaHa: 1.0 }),
  plot('T04', D, { type: 'Point', coordinates: [r6(LON0 + 700 * M_LON), r6(LAT0 + 50 * M_LAT)] }, { declaredAreaHa: 5.5 }),
  plot('T05', E, P(rect(0, 400, 150, 120)), { declaredAreaHa: 1.8 }),
  plot('T06', D, P(rect(300, 60, 120, 120)), { declaredAreaHa: 1.4 }),
  plot('T07', A, P(poly(0, 200, [[0, 0], [100, 100], [100, 0], [0, 100], [0, 0]])), { declaredAreaHa: 1.0 }),
  plot('T08', C, P(rect(500, 200, 80, 80).map(([lon, lat]) => [lat, lon])), { declaredAreaHa: 0.6 }),
  plot('T09', B, P(rect(250, 250, 100, 100)), { declaredAreaHa: 3.0 }),
];

const layers = {
  forestLoss: [
    { id: 'FL-2022-01', name: 'Mất rừng mẫu A', date: '2022-03-15', ring: rect(-50, 450, 400, 300) },
    { id: 'FL-2019-07', name: 'Mất rừng mẫu B (trước mốc)', date: '2019-07-01', ring: rect(0, 0, 120, 100) },
  ],
  protectedAreas: [
    { id: 'PA-01', name: 'Rừng phòng hộ mẫu', ring: rect(650, 0, 300, 300) },
  ],
};

const lots = [
  {
    id: 'LO-2026-001', exporter: 'Công ty XK mẫu', buyer: 'EU Roaster (mẫu)',
    deliveries: [
      { id: 'PG-01', plotId: 'T01', kg: 3200 },
      { id: 'PG-02', plotId: 'T02', kg: 6000 },
      { id: 'PG-03', plotId: 'T03', kg: 2500 },
    ],
  },
  {
    id: 'LO-2026-002', exporter: 'Công ty XK mẫu', buyer: 'EU Trader (mẫu)',
    deliveries: [
      { id: 'PG-04', plotId: 'T09', kg: 4000 },
      { id: 'PG-05', plotId: 'T05', kg: 3000 },
      { id: 'PG-06', plotId: 'T01', kg: 4500 },
    ],
  },
];

writeFileSync(new URL('./demo.json', import.meta.url), JSON.stringify({ plots, layers, lots }, null, 1) + '\n');
console.log(`Đã ghi ${plots.length} thửa, ${lots.length} lô vào data/demo.json`);

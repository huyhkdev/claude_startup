// Đánh giá rủi ro thửa đất và lô hàng theo Quy định chống phá rừng của EU (EUDR, 2023/1115).
// Các điểm chính được mô hình hóa:
//  - Không có mất rừng sau ngày 31/12/2020 trên thửa sản xuất.
//  - Thửa > 4 ha phải có ranh giới đa giác; thửa ≤ 4 ha được phép dùng một điểm.
//  - Dữ liệu định vị dạng GeoJSON, WGS84.
// Đây là công cụ sàng lọc, không thay thế thẩm định của doanh nghiệp hay tư vấn pháp lý.
import { areaHa, closeRing, overlapRatio, pointInRing, validateRing } from './geo.js';

export const CONFIG = {
  cutoffDate: '2020-12-31',
  polygonRequiredAboveHa: 4,
  // Dưới ngưỡng này, chồng lấn với vùng mất rừng coi là sai số GPS cần kiểm tra lại.
  forestLossRedRatio: 0.05,
  areaMismatchRatio: 0.2,
  plotOverlapRatio: 0.1,
  // Năng suất tối đa hợp lý (kg cà phê nhân/ha/vụ) dùng để phát hiện "rửa" hàng.
  maxYieldKgPerHa: 4500,
};

const RANK = { green: 0, yellow: 1, red: 2 };
const worse = (a, b) => (RANK[a] >= RANK[b] ? a : b);

function plotRing(plot) {
  return plot.geometry?.type === 'Polygon' ? plot.geometry.coordinates[0] : null;
}

export function assessPlot(plot, layers = {}, allPlots = [], config = CONFIG) {
  const issues = [];
  const add = (level, message) => issues.push({ level, message });
  const ring = plotRing(plot);
  let area = plot.declaredAreaHa ?? null;

  if (ring) {
    const errors = validateRing(ring);
    errors.forEach((e) => add('red', e));
    if (errors.length === 0) {
      area = areaHa(ring);
      if (plot.declaredAreaHa && Math.abs(area - plot.declaredAreaHa) / plot.declaredAreaHa > config.areaMismatchRatio) {
        add('yellow', `Diện tích đo ${area.toFixed(2)} ha lệch nhiều so với khai báo ${plot.declaredAreaHa} ha`);
      }
    }
  } else if (plot.geometry?.type === 'Point') {
    if ((plot.declaredAreaHa ?? 0) > config.polygonRequiredAboveHa) {
      add('red', `Thửa ${plot.declaredAreaHa} ha (> ${config.polygonRequiredAboveHa} ha) bắt buộc có ranh giới đa giác`);
    }
  } else {
    add('red', 'Thiếu dữ liệu định vị');
  }

  const geometryOk = !issues.some((i) => i.level === 'red');
  if (geometryOk) {
    for (const loss of layers.forestLoss ?? []) {
      if (loss.date <= config.cutoffDate) continue;
      const ratio = ring ? overlapRatio(ring, loss.ring) : pointInRing(plot.geometry.coordinates, closeRing(loss.ring)) ? 1 : 0;
      if (ratio === 0) continue;
      const pct = (ratio * 100).toFixed(1);
      if (ratio >= config.forestLossRedRatio) add('red', `${pct}% diện tích trùng vùng mất rừng "${loss.name}" (${loss.date})`);
      else add('yellow', `${pct}% diện tích chạm vùng mất rừng "${loss.name}", có thể do sai số GPS, cần đo lại`);
    }
    for (const pa of layers.protectedAreas ?? []) {
      const hit = ring ? overlapRatio(ring, pa.ring) > 0 : pointInRing(plot.geometry.coordinates, closeRing(pa.ring));
      if (hit) add('red', `Nằm trong khu rừng đặc dụng/phòng hộ "${pa.name}", cần chứng minh tính hợp pháp`);
    }
    if (ring) {
      for (const other of allPlots) {
        const otherRing = plotRing(other);
        if (other.id === plot.id || other.farmer.id === plot.farmer.id || !otherRing) continue;
        const ratio = overlapRatio(ring, otherRing);
        if (ratio > config.plotOverlapRatio) {
          add('yellow', `Trùng ${(ratio * 100).toFixed(0)}% với thửa ${other.id} của hộ ${other.farmer.name}`);
        }
      }
    }
  }

  const status = issues.reduce((s, i) => worse(s, i.level), 'green');
  return { plotId: plot.id, farmer: plot.farmer.name, areaHa: area, status, issues };
}

export function assessPlots(plots, layers, config = CONFIG) {
  return plots.map((p) => assessPlot(p, layers, plots, config));
}

// Cân bằng khối lượng: tổng hàng giao từ một thửa trong vụ (cộng dồn qua các lô trước,
// truyền qua priorKg) không được vượt năng suất tối đa hợp lý.
export function assessLot(lot, plots, plotResults, priorKg = new Map(), config = CONFIG) {
  const byId = new Map(plots.map((p) => [p.id, p]));
  const resultById = new Map(plotResults.map((r) => [r.plotId, r]));
  const issues = [];
  const delivered = new Map();
  for (const d of lot.deliveries) {
    if (!byId.has(d.plotId)) {
      issues.push({ level: 'red', message: `Phiếu giao ${d.id ?? ''} tham chiếu thửa không tồn tại: ${d.plotId}` });
      continue;
    }
    delivered.set(d.plotId, (delivered.get(d.plotId) ?? 0) + d.kg);
  }

  for (const [plotId, kg] of delivered) {
    const r = resultById.get(plotId);
    if (r.status === 'red') issues.push({ level: 'red', message: `Thửa ${plotId} (${r.farmer}) không đạt: ${r.issues.find((i) => i.level === 'red').message}` });
    else if (r.status === 'yellow') issues.push({ level: 'yellow', message: `Thửa ${plotId} (${r.farmer}) cần kiểm tra thêm` });
    const seasonKg = kg + (priorKg.get(plotId) ?? 0);
    if (r.areaHa) {
      const cap = r.areaHa * config.maxYieldKgPerHa;
      if (seasonKg > cap) {
        issues.push({ level: 'red', message: `Thửa ${plotId} đã giao ${fmt(seasonKg)} kg trong vụ, vượt năng suất tối đa ${fmt(Math.round(cap))} kg (${r.areaHa.toFixed(2)} ha), nghi trộn hàng không rõ nguồn gốc` });
      }
    }
  }

  const totalKg = lot.deliveries.reduce((s, d) => s + d.kg, 0);
  const status = issues.reduce((s, i) => worse(s, i.level), 'green');
  return { lotId: lot.id, totalKg, plotIds: [...delivered.keys()], delivered, status, issues };
}

// Đánh giá các lô theo thứ tự thời gian, cộng dồn sản lượng từng thửa.
export function assessLots(lots, plots, plotResults, config = CONFIG) {
  const running = new Map();
  return lots.map((lot) => {
    const result = assessLot(lot, plots, plotResults, new Map(running), config);
    for (const [id, kg] of result.delivered) running.set(id, (running.get(id) ?? 0) + kg);
    return result;
  });
}

// GeoJSON cho Tờ khai thẩm định (DDS) trên hệ thống thông tin EU.
// Thửa có đa giác giữ nguyên đa giác; thửa chỉ có điểm (≤ 4 ha) xuất dạng Point.
export function toDdsGeoJSON(plotIds, plots) {
  const byId = new Map(plots.map((p) => [p.id, p]));
  return {
    type: 'FeatureCollection',
    features: plotIds.map((id) => {
      const p = byId.get(id);
      const ring = plotRing(p);
      return {
        type: 'Feature',
        properties: {
          ProducerName: p.farmer.name,
          ProducerCountry: 'VN',
          ProductionPlace: [p.commune, p.district, p.province].filter(Boolean).join(', '),
          Area: Number((ring ? areaHa(ring) : p.declaredAreaHa ?? 0).toFixed(4)),
        },
        geometry: ring
          ? { type: 'Polygon', coordinates: [closeRing(ring).map(round6)] }
          : { type: 'Point', coordinates: round6(p.geometry.coordinates) },
      };
    }),
  };
}

const round6 = ([lon, lat]) => [Number(lon.toFixed(6)), Number(lat.toFixed(6))];
const fmt = (n) => n.toLocaleString('vi-VN');

// Hình học cho thửa đất nhỏ (vài ha): tọa độ [kinh độ, vĩ độ] WGS84 như GeoJSON.
// Chiếu phẳng đẳng diện tích quanh tâm thửa, sai số không đáng kể ở quy mô vài km.

const R = 6_371_008.8; // bán kính Trái Đất trung bình (m)
const rad = (d) => (d * Math.PI) / 180;

// Bounding box lãnh thổ đất liền Việt Nam (gần đúng) để bắt lỗi đảo kinh/vĩ độ.
export const VN_BBOX = { minLon: 102.1, maxLon: 109.5, minLat: 8.4, maxLat: 23.4 };

export function closeRing(ring) {
  const [a, b] = [ring[0], ring[ring.length - 1]];
  return a[0] === b[0] && a[1] === b[1] ? ring : [...ring, a];
}

function project(ring, lat0) {
  const k = Math.cos(rad(lat0));
  return ring.map(([lon, lat]) => [R * rad(lon) * k, R * rad(lat)]);
}

export function areaHa(ring) {
  const r = closeRing(ring);
  const lat0 = r.reduce((s, p) => s + p[1], 0) / r.length;
  const xy = project(r, lat0);
  let s = 0;
  for (let i = 0; i < xy.length - 1; i++) s += xy[i][0] * xy[i + 1][1] - xy[i + 1][0] * xy[i][1];
  return Math.abs(s) / 2 / 10_000;
}

export function centroid(ring) {
  const r = closeRing(ring).slice(0, -1);
  return [r.reduce((s, p) => s + p[0], 0) / r.length, r.reduce((s, p) => s + p[1], 0) / r.length];
}

export function bbox(ring) {
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  return { minLon: Math.min(...xs), maxLon: Math.max(...xs), minLat: Math.min(...ys), maxLat: Math.max(...ys) };
}

export function pointInRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function orient(a, b, c) {
  const v = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  return v > 0 ? 1 : v < 0 ? -1 : 0;
}

export function segmentsIntersect(p1, p2, q1, q2) {
  const o1 = orient(p1, p2, q1);
  const o2 = orient(p1, p2, q2);
  const o3 = orient(q1, q2, p1);
  const o4 = orient(q1, q2, p2);
  return o1 !== o2 && o3 !== o4;
}

export function selfIntersects(ring) {
  const r = closeRing(ring);
  const n = r.length - 1;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue; // cạnh kề nhau
      if (segmentsIntersect(r[i], r[i + 1], r[j], r[j + 1])) return true;
    }
  }
  return false;
}

// Kiểm tra hợp lệ theo yêu cầu dữ liệu định vị: vòng khép kín, ≥ 3 đỉnh,
// không tự cắt, nằm trong Việt Nam. Không kiểm tra số chữ số thập phân vì số 0 ở cuối
// bị mất khi lưu JSON; khi xuất GeoJSON tọa độ được làm tròn 6 chữ số.
export function validateRing(ring) {
  const errors = [];
  if (!Array.isArray(ring) || ring.length < 3) return ['Cần ít nhất 3 đỉnh'];
  const r = closeRing(ring);
  if (r.length < 4) errors.push('Cần ít nhất 3 đỉnh khác nhau');
  for (const [lon, lat] of r) {
    if (lon < VN_BBOX.minLon || lon > VN_BBOX.maxLon || lat < VN_BBOX.minLat || lat > VN_BBOX.maxLat) {
      errors.push(`Tọa độ [${lon}, ${lat}] nằm ngoài Việt Nam (có thể bị đảo kinh độ/vĩ độ)`);
      break;
    }
  }
  if (errors.length === 0 && selfIntersects(r)) errors.push('Đa giác tự cắt (thứ tự đỉnh bị sai)');
  return errors;
}

// Tỷ lệ diện tích của a nằm trong b, ước lượng bằng lưới điểm mẫu.
export function overlapRatio(a, b, steps = 60) {
  const A = closeRing(a);
  const B = closeRing(b);
  const ba = bbox(A);
  const bb = bbox(B);
  if (ba.maxLon < bb.minLon || bb.maxLon < ba.minLon || ba.maxLat < bb.minLat || bb.maxLat < ba.minLat) return 0;
  let inA = 0;
  let inBoth = 0;
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < steps; j++) {
      const p = [ba.minLon + ((i + 0.5) / steps) * (ba.maxLon - ba.minLon), ba.minLat + ((j + 0.5) / steps) * (ba.maxLat - ba.minLat)];
      if (pointInRing(p, A)) {
        inA++;
        if (pointInRing(p, B)) inBoth++;
      }
    }
  }
  return inA ? inBoth / inA : 0;
}

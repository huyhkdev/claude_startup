// Báo cáo HTML một trang: bản đồ SVG các thửa (không cần bản đồ nền) và kết quả từng lô.
import { bbox, centroid, closeRing } from './geo.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const LABEL = { green: 'Đạt', yellow: 'Cần kiểm tra', red: 'Không đạt' };
const fmt = (n) => n.toLocaleString('vi-VN');

function svgMap(plots, plotResults, layers, size = 640) {
  const status = new Map(plotResults.map((r) => [r.plotId, r.status]));
  const rings = [
    ...plots.map((p) => (p.geometry.type === 'Polygon' ? p.geometry.coordinates[0] : [p.geometry.coordinates])),
    ...(layers.forestLoss ?? []).map((l) => l.ring),
    ...(layers.protectedAreas ?? []).map((l) => l.ring),
  ];
  // Bỏ qua tọa độ ngoài vùng (vd. bị đảo kinh/vĩ độ) để không làm méo bản đồ.
  const pts = rings.flat().filter(([lon, lat]) => lon > 100 && lat < 30);
  const b = bbox(pts);
  const k = Math.cos(((b.minLat + b.maxLat) / 2) * (Math.PI / 180));
  const w = (b.maxLon - b.minLon) * k;
  const h = b.maxLat - b.minLat;
  const scale = (size - 40) / Math.max(w, h);
  const xy = ([lon, lat]) => [20 + (lon - b.minLon) * k * scale, 20 + (b.maxLat - lat) * scale];
  const path = (ring) => closeRing(ring).map((p, i) => `${i ? 'L' : 'M'}${xy(p).map((v) => v.toFixed(1)).join(',')}`).join('') + 'Z';
  const height = Math.round(h * scale + 40);

  const layerShapes = [
    ...(layers.forestLoss ?? []).map((l) => `<path d="${path(l.ring)}" class="${l.date > '2020-12-31' ? 'loss' : 'loss-old'}"><title>${esc(l.name)} (${l.date})</title></path>`),
    ...(layers.protectedAreas ?? []).map((l) => `<path d="${path(l.ring)}" class="protected"><title>${esc(l.name)}</title></path>`),
  ];
  const plotShapes = plots.map((p) => {
    const s = status.get(p.id);
    if (p.geometry.type === 'Point') {
      const [x, y] = xy(p.geometry.coordinates);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" class="plot ${s}"><title>${p.id}</title></circle><text x="${x + 9}" y="${y + 4}">${p.id}</text>`;
    }
    const ring = p.geometry.coordinates[0];
    if (ring.some(([lon]) => lon < 100)) return '';
    const [cx, cy] = xy(centroid(ring));
    return `<path d="${path(ring)}" class="plot ${s}"><title>${p.id}</title></path><text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" text-anchor="middle">${p.id}</text>`;
  });
  return `<svg viewBox="0 0 ${size} ${height}" role="img" aria-label="Bản đồ thửa">${layerShapes.join('')}${plotShapes.join('')}</svg>`;
}

const badge = (s) => `<span class="badge ${s}">${LABEL[s]}</span>`;
const issueList = (issues) => (issues.length ? `<ul>${issues.map((i) => `<li class="${i.level}">${esc(i.message)}</li>`).join('')}</ul>` : '');

export function renderReport({ plots, layers, plotResults, lotResults, generatedAt = new Date() }) {
  const count = (s) => plotResults.filter((r) => r.status === s).length;
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Báo cáo EUDR</title>
<style>
:root{--bg:#f7f6f2;--surface:#fff;--text:#1c1c1a;--muted:#6a6963;--border:#e2e0d8;--green:#1d7a46;--yellow:#a86b00;--red:#b3261e;--loss:#e4572e;--protected:#2f6db5}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#141413;--surface:#1e1e1c;--text:#ecebe6;--muted:#9c9a93;--border:#33322e;--green:#4cc985;--yellow:#e3a63a;--red:#f07167;--loss:#ff8a65;--protected:#6aa5ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:960px;margin:0 auto;padding:24px 16px}h1{margin:0 0 4px;font-size:1.6rem}h2{font-size:1.15rem;margin:0 0 8px}
.muted{color:var(--muted)}.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;margin:16px 0}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}.kpis strong{display:block;font-size:1.5rem}
svg{width:100%;height:auto}svg text{font-size:12px;fill:var(--text)}
.plot{stroke-width:2;fill-opacity:.35}.plot.green{fill:var(--green);stroke:var(--green)}.plot.yellow{fill:var(--yellow);stroke:var(--yellow)}.plot.red{fill:var(--red);stroke:var(--red)}
.loss{fill:var(--loss);fill-opacity:.15;stroke:var(--loss);stroke-dasharray:4 3}.loss-old{fill:none;stroke:var(--muted);stroke-dasharray:2 4}
.protected{fill:var(--protected);fill-opacity:.12;stroke:var(--protected);stroke-dasharray:6 3}
.legend{display:flex;flex-wrap:wrap;gap:12px;font-size:.85rem;color:var(--muted)}.legend i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:4px;vertical-align:-1px}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:8px 6px;border-bottom:1px solid var(--border);vertical-align:top}td ul{margin:0;padding-left:18px}
.table-wrap{overflow-x:auto}
.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:.8rem;font-weight:600;white-space:nowrap}
.badge.green{color:var(--green);border:1px solid var(--green)}.badge.yellow{color:var(--yellow);border:1px solid var(--yellow)}.badge.red{color:var(--red);border:1px solid var(--red)}
li.red{color:var(--red)}li.yellow{color:var(--yellow)}
@media (max-width:600px){thead{display:none}tr{display:grid;grid-template-columns:auto 1fr auto;gap:2px 8px;padding:8px 0;border-bottom:1px solid var(--border)}td{border:0;padding:0}td:nth-child(2){grid-column:2}td:nth-child(3){grid-column:3;color:var(--muted)}td:nth-child(4){grid-column:1/-1}td:nth-child(5){grid-column:1/-1}}
</style></head><body><main>
<h1>Báo cáo sàng lọc EUDR</h1>
<p class="muted">Tạo lúc ${generatedAt.toLocaleString('vi-VN')}. Mốc không phá rừng: 31/12/2020. Công cụ sàng lọc, không thay thế thẩm định của doanh nghiệp.</p>
<section class="card kpis">
<div><span class="muted">Tổng số thửa</span><strong>${plots.length}</strong></div>
<div><span class="muted">Đạt</span><strong style="color:var(--green)">${count('green')}</strong></div>
<div><span class="muted">Cần kiểm tra</span><strong style="color:var(--yellow)">${count('yellow')}</strong></div>
<div><span class="muted">Không đạt</span><strong style="color:var(--red)">${count('red')}</strong></div>
</section>
<section class="card"><h2>Bản đồ thửa</h2>${svgMap(plots, plotResults, layers)}
<div class="legend"><span><i style="background:var(--green)"></i>Đạt</span><span><i style="background:var(--yellow)"></i>Cần kiểm tra</span><span><i style="background:var(--red)"></i>Không đạt</span><span><i style="border:1px dashed var(--loss)"></i>Mất rừng sau 2020</span><span><i style="border:1px dashed var(--protected)"></i>Rừng phòng hộ/đặc dụng</span></div></section>
${lotResults.map((l) => `<section class="card"><h2>Lô ${esc(l.lotId)} ${badge(l.status)}</h2>
<p class="muted">${fmt(l.totalKg)} kg từ ${l.plotIds.length} thửa</p>${issueList(l.issues)}</section>`).join('')}
<section class="card"><h2>Chi tiết từng thửa</h2><div class="table-wrap"><table>
<thead><tr><th>Thửa</th><th>Chủ hộ</th><th>Diện tích</th><th>Kết quả</th><th>Ghi chú</th></tr></thead><tbody>
${plotResults.map((r) => `<tr><td>${esc(r.plotId)}</td><td>${esc(r.farmer)}</td><td>${r.areaHa ? r.areaHa.toFixed(2) + ' ha' : '–'}</td><td>${badge(r.status)}</td><td>${issueList(r.issues)}</td></tr>`).join('')}
</tbody></table></div></section>
</main></body></html>
`;
}

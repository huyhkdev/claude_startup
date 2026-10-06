#!/usr/bin/env node
// Dùng: node cli.js <du-lieu.json> [--out thu-muc]
// Đầu vào: { plots, layers, lots }. Đầu ra: báo cáo HTML và GeoJSON cho từng lô đạt yêu cầu.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assessLots, assessPlots, toDdsGeoJSON } from './src/eudr.js';
import { renderReport } from './src/report.js';

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith('--'));
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 ? args[outIdx + 1] : 'out';
if (!input) {
  console.error('Dùng: node cli.js <du-lieu.json> [--out thu-muc]');
  process.exit(1);
}

const { plots, layers = {}, lots = [] } = JSON.parse(readFileSync(input, 'utf8'));
const plotResults = assessPlots(plots, layers);
const lotResults = assessLots(lots, plots, plotResults);

mkdirSync(outDir, { recursive: true });
const icon = { green: '✔', yellow: '!', red: '✘' };
console.log('THỬA');
for (const r of plotResults) {
  console.log(`  ${icon[r.status]} ${r.plotId.padEnd(5)} ${r.farmer}`);
  for (const i of r.issues) console.log(`      - ${i.message}`);
}
console.log('\nLÔ HÀNG');
for (const l of lotResults) {
  console.log(`  ${icon[l.status]} ${l.lotId}: ${l.totalKg.toLocaleString('vi-VN')} kg từ ${l.plotIds.length} thửa`);
  for (const i of l.issues) console.log(`      - ${i.message}`);
  if (l.status !== 'red') {
    const file = join(outDir, `${l.lotId}.geojson`);
    writeFileSync(file, JSON.stringify(toDdsGeoJSON(l.plotIds, plots), null, 2) + '\n');
    console.log(`      → GeoJSON cho tờ khai DDS: ${file}`);
  }
}
const report = join(outDir, 'bao-cao.html');
writeFileSync(report, renderReport({ plots, layers, plotResults, lotResults }));
console.log(`\nBáo cáo: ${report}`);

// Ước tính thuế hộ kinh doanh theo phương pháp tỷ lệ % trên doanh thu.
// Tỷ lệ theo Thông tư 40/2021/TT-BTC. Ngưỡng miễn thuế và cách tính thay đổi theo
// quy định từng năm, nên mọi tham số đều nằm trong TAX_CONFIG để cập nhật dễ dàng.
// Kết quả chỉ để tham khảo, không thay thế tư vấn của cơ quan thuế hoặc kế toán.

export const TAX_CONFIG = {
  year: 2026,
  // Ngưỡng doanh thu/năm không phải nộp GTGT và TNCN (cần đối chiếu văn bản hiện hành).
  exemptThreshold: 200_000_000,
  // true: chỉ tính thuế trên phần doanh thu vượt ngưỡng; false: tính trên toàn bộ doanh thu.
  taxOnExcessOnly: false,
};

export const CATEGORIES = {
  phan_phoi: { label: 'Phân phối, cung cấp hàng hóa (tạp hóa, bán lẻ...)', vat: 0.01, pit: 0.005 },
  dich_vu: { label: 'Dịch vụ không kèm hàng hóa (cắt tóc, sửa chữa, tư vấn...)', vat: 0.05, pit: 0.02 },
  san_xuat: { label: 'Sản xuất, vận tải, ăn uống, dịch vụ gắn với hàng hóa', vat: 0.03, pit: 0.015 },
  cho_thue: { label: 'Cho thuê tài sản (nhà, mặt bằng, xe...)', vat: 0.05, pit: 0.05 },
  khac: { label: 'Hoạt động kinh doanh khác', vat: 0.02, pit: 0.01 },
};

export function estimateTax(annualRevenue, category, config = TAX_CONFIG) {
  const rate = CATEGORIES[category];
  if (!rate) throw new Error(`Ngành nghề không hợp lệ: ${category}`);
  const exempt = annualRevenue <= config.exemptThreshold;
  const base = exempt ? 0 : config.taxOnExcessOnly ? annualRevenue - config.exemptThreshold : annualRevenue;
  const vat = Math.round(base * rate.vat);
  const pit = Math.round(base * rate.pit);
  return { annualRevenue, exempt, base, vat, pit, total: vat + pit, rate };
}

// Ngoại suy doanh thu cả năm từ dữ liệu đã có (theo số ngày đã ghi sổ).
export function projectAnnualRevenue(transactions, year = TAX_CONFIG.year) {
  const income = transactions.filter((t) => t.type === 'thu' && t.date.startsWith(String(year)));
  if (income.length === 0) return { actual: 0, projected: 0, days: 0 };
  const actual = income.reduce((s, t) => s + t.amount, 0);
  const dates = income.map((t) => t.date).sort();
  const first = new Date(dates[0]);
  const last = new Date(dates[dates.length - 1]);
  const days = Math.max(1, Math.round((last - first) / 86_400_000) + 1);
  const daysInYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
  // Cần ít nhất 14 ngày dữ liệu để ngoại suy có ý nghĩa.
  const projected = days >= 14 ? Math.round((actual / days) * daysInYear) : actual;
  return { actual, projected, days };
}

// Hạn nộp tờ khai theo quý: ngày cuối của tháng đầu quý kế tiếp.
export function quarterlyDeadlines(year) {
  return [
    { quarter: 1, due: `${year}-04-30` },
    { quarter: 2, due: `${year}-07-31` },
    { quarter: 3, due: `${year}-10-31` },
    { quarter: 4, due: `${year + 1}-01-31` },
  ];
}

export function nextDeadline(today = new Date()) {
  const iso = today.toISOString().slice(0, 10);
  const y = today.getFullYear();
  return [...quarterlyDeadlines(y - 1), ...quarterlyDeadlines(y)].find((d) => d.due >= iso);
}

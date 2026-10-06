# Sổ Sạch

**Ghi sổ bằng một câu. Biết trước tiền thuế.**

Từ năm 2026, thuế khoán bị xóa bỏ. Khoảng 5 triệu hộ kinh doanh Việt Nam phải tự ghi sổ và kê khai thuế. Sổ Sạch là trợ lý AI giúp họ làm việc đó dễ như nhắn tin:

```
bán 30 tô phở x 45k      →  Thu  1.350.000 đ
nhập 20kg thịt 2tr4      →  Chi  2.400.000 đ
tiền điện 1.250.000đ     →  Chi  1.250.000 đ
```

Ứng dụng tự ước tính thuế GTGT và TNCN theo ngành nghề, gợi ý số tiền nên để dành mỗi tháng, nhắc hạn nộp tờ khai và xuất **sổ doanh thu mẫu S1-HKD** ra Excel.

- Kế hoạch kinh doanh: [docs/ke-hoach-kinh-doanh.md](docs/ke-hoach-kinh-doanh.md)
- Lộ trình: [docs/lo-trinh.md](docs/lo-trinh.md)

## Chạy thử

Yêu cầu Node.js 20 trở lên.

```bash
npm install
npm start          # http://localhost:3000
npm test
```

Mặc định, app dùng **bộ phân tích luật** (không cần mạng, không tốn phí). Để bật AI hiểu tiếng Việt đời thường (không dấu, viết tắt, tiếng lóng, "hôm qua"...):

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm start
```

Nếu gọi AI bị lỗi, server tự chuyển về bộ phân tích luật. Bạn có thể đổi model bằng biến `SOSACH_MODEL`.

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `src/parser.js` | Phân tích câu ghi sổ tiếng Việt bằng luật: `150k`, `1tr2`, `1.250.000đ`, `3 tô x 45k`... |
| `src/ai.js` | Phân tích bằng Claude, trả JSON theo schema |
| `src/tax.js` | Tỷ lệ thuế theo ngành (TT 40/2021), ngưỡng miễn thuế, ngoại suy doanh thu, hạn nộp tờ khai |
| `src/ledger.js` | Xuất sổ S1-HKD và sổ chi phí dạng CSV, tổng hợp theo tháng |
| `server.js` | HTTP server không phụ thuộc framework: giao diện web và `POST /api/parse` |
| `public/` | Web app tối ưu cho điện thoại, dữ liệu lưu ngay trên máy người dùng |
| `test/` | Kiểm thử bằng `node:test` |

Mã nguồn trong `src/` dùng chung cho cả server và trình duyệt.

## Lưu ý về quy định

Ngưỡng miễn thuế, tỷ lệ và cách tính thuế cho hộ kinh doanh đang thay đổi trong giai đoạn 2025–2026. Mọi tham số nằm trong `TAX_CONFIG` và `CATEGORIES` tại `src/tax.js`; hãy đối chiếu văn bản hiện hành trước khi dùng thật. Kết quả của ứng dụng chỉ mang tính tham khảo.

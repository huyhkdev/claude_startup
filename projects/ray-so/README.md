# Rẫy Số

**Bản đồ hóa từng rẫy cà phê, để hạt cà phê Việt vào được châu Âu.**

Quy định chống phá rừng của EU (EUDR) yêu cầu mỗi lô cà phê bán vào EU phải kèm tọa độ các thửa đất đã sản xuất ra nó, và chứng minh các thửa đó không bị phá rừng sau 31/12/2020. Rẫy Số giúp công ty xuất khẩu kiểm tra dữ liệu thửa, phát hiện rủi ro trước khi giao hàng và xuất GeoJSON để nộp tờ khai thẩm định (DDS).

- Kế hoạch kinh doanh: [docs/ke-hoach-kinh-doanh.md](docs/ke-hoach-kinh-doanh.md)
- Lộ trình: [docs/lo-trinh.md](docs/lo-trinh.md)

## Chạy thử

Yêu cầu Node.js 20 trở lên. Không cần cài thư viện.

```bash
npm run demo    # sinh dữ liệu mẫu, kiểm tra, xuất out/bao-cao.html và GeoJSON
npm test
node cli.js du-lieu-cua-ban.json --out ket-qua
```

Dữ liệu mẫu trong `data/` là **hư cấu** (tên hộ, thửa, vùng mất rừng đều không có thật). Bộ mẫu gồm đủ các tình huống: thửa đạt, tọa độ bị đảo, đa giác tự cắt, thửa trên 4 ha chỉ có một điểm, trùng vùng mất rừng, nằm trong rừng phòng hộ, hai hộ khai trùng thửa, và một thửa giao vượt sản lượng.

## Các kiểm tra

| Kiểm tra | Mức |
|---|---|
| Đa giác tự cắt, tọa độ ngoài Việt Nam (thường do đảo kinh/vĩ độ), thiếu dữ liệu định vị | Không đạt |
| Thửa > 4 ha chỉ có một điểm | Không đạt |
| Trùng ≥ 5% vùng mất rừng sau 31/12/2020 | Không đạt |
| Trùng < 5% vùng mất rừng (có thể do sai số GPS) | Cần kiểm tra |
| Nằm trong rừng phòng hộ hoặc đặc dụng | Không đạt |
| Trùng > 10% với thửa của hộ khác | Cần kiểm tra |
| Diện tích đo lệch > 20% so với khai báo | Cần kiểm tra |
| Sản lượng giao cộng dồn trong vụ vượt 4.500 kg/ha | Không đạt (nghi trộn hàng) |

Các ngưỡng nằm trong `CONFIG` tại `src/eudr.js`.

## Định dạng đầu vào

```json
{
  "plots": [{
    "id": "T01",
    "farmer": { "id": "H01", "name": "..." },
    "commune": "...", "district": "...", "province": "Đắk Lắk",
    "declaredAreaHa": 1.2,
    "geometry": { "type": "Polygon", "coordinates": [[[108.02, 12.71], "..."]] }
  }],
  "layers": {
    "forestLoss": [{ "name": "...", "date": "2022-03-15", "ring": [[108.0, 12.7], "..."] }],
    "protectedAreas": [{ "name": "...", "ring": ["..."] }]
  },
  "lots": [{ "id": "LO-001", "deliveries": [{ "plotId": "T01", "kg": 3200 }] }]
}
```

Tọa độ theo thứ tự `[kinh độ, vĩ độ]`, hệ WGS84, giống GeoJSON. Thửa nhỏ (≤ 4 ha) có thể dùng `{"type": "Point"}`.

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `src/geo.js` | Diện tích, kiểm tra hợp lệ, điểm trong đa giác, tỷ lệ chồng lấn |
| `src/eudr.js` | Đánh giá thửa, cân bằng khối lượng theo lô, xuất GeoJSON cho DDS |
| `src/report.js` | Báo cáo HTML với bản đồ SVG, hỗ trợ chế độ tối và điện thoại |
| `cli.js` | Công cụ dòng lệnh |
| `data/make-demo.js` | Sinh dữ liệu mẫu |

## Giới hạn hiện tại

- Lớp mất rừng và rừng phòng hộ phải được cung cấp sẵn trong file đầu vào. Bản thật sẽ lấy từ dữ liệu vệ tinh (Global Forest Watch, JRC Forest Cover 2020) và bản đồ quy hoạch ba loại rừng của địa phương.
- Tỷ lệ chồng lấn được ước lượng bằng lưới điểm mẫu, đủ cho sàng lọc nhưng chưa đủ cho đo đạc pháp lý.
- Định dạng thuộc tính GeoJSON theo hướng dẫn của hệ thống thông tin EU tại thời điểm viết. Cần đối chiếu đặc tả mới nhất trước khi nộp thật.

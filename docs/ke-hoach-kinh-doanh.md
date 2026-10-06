# Sổ Sạch: kế hoạch kinh doanh

> Ghi sổ bằng một câu. Biết trước tiền thuế.
> Trợ lý AI giúp hộ kinh doanh Việt Nam ghi chép, giữ sổ sách đúng mẫu và chuẩn bị khai thuế.

*Cập nhật: 10/2026. Các số liệu thị trường và quy định dưới đây cần được kiểm chứng lại trước khi gọi vốn hoặc ra mắt chính thức.*

---

## 1. Vấn đề

Việt Nam có khoảng **5 triệu hộ kinh doanh** (quán ăn, tạp hóa, tiệm tóc, sửa xe, bán online...). Phần lớn trước đây nộp **thuế khoán**: cơ quan thuế ấn định một con số, chủ hộ không cần ghi sổ.

Theo chủ trương tại **Nghị quyết 68-NQ/TW (2025)**, thuế khoán được **xóa bỏ từ 2026**. Hộ kinh doanh chuyển sang **tự kê khai** theo doanh thu thực tế. Hộ có doanh thu lớn còn phải dùng **hóa đơn điện tử khởi tạo từ máy tính tiền** (Nghị định 70/2025).

Như vậy, hàng triệu người lần đầu tiên phải:

1. **Ghi chép doanh thu hằng ngày** theo mẫu sổ (S1-HKD, Thông tư 88/2021),
2. **Biết mình phải nộp bao nhiêu thuế** và để dành tiền trước,
3. **Nộp tờ khai đúng hạn** để tránh bị phạt.

Chủ hộ thường không có kế toán, không quen Excel, bán hàng liên tục cả ngày. Phần mềm kế toán và POS hiện có (MISA, KiotViet, Sapo...) đều mạnh, nhưng nhắm tới người chịu học cách nhập liệu theo form. Rất nhiều chủ quán chỉ quen ghi chép kiểu "bán 30 tô phở, nhập 2 triệu 4 tiền thịt" vào sổ tay hoặc tin nhắn Zalo.

## 2. Giải pháp

**Sổ Sạch** cho chủ hộ ghi sổ bằng ngôn ngữ tự nhiên (gõ hoặc nói), giống như nhắn tin:

| Chủ hộ nhập | Sổ Sạch ghi |
|---|---|
| `bán 30 tô phở x 45k` | Thu 1.350.000 đ, số lượng 30 |
| `nhập 20kg thịt 2tr4` | Chi 2.400.000 đ |
| `tiền điện 1.250.000đ` | Chi 1.250.000 đ |

Từ đó, ứng dụng tự động:

- **Ước tính thuế** GTGT và TNCN theo ngành nghề, ngoại suy doanh thu cả năm và báo trước khi nào sắp vượt ngưỡng miễn thuế;
- **Gợi ý số tiền nên để dành** mỗi tháng để không bị "sốc thuế" cuối kỳ;
- **Xuất sổ doanh thu theo mẫu S1-HKD** (Excel/CSV) và sổ chi phí;
- **Nhắc hạn nộp tờ khai.**

**Lợi thế cốt lõi:** AI hiểu tiếng Việt đời thường (viết tắt, không dấu, "1tr2", "2 xị", tiếng lóng vùng miền) và vẫn hoạt động offline nhờ bộ phân tích luật dự phòng.

## 3. Vì sao là bây giờ

- **Cú hích chính sách:** việc bỏ thuế khoán từ 2026 tạo ra nhu cầu bắt buộc chứ không phải "có thì tốt". Đây là thời điểm hiếm có, tương tự cách hóa đơn điện tử 2022 tạo ra cả một thị trường.
- **Chi phí AI giảm mạnh:** việc hiểu một câu ghi sổ chỉ tốn vài chục token. Chi phí AI cho mỗi người dùng mỗi tháng ở mức vài nghìn đồng, nên có thể phục vụ phân khúc giá thấp.
- **Hạ tầng thanh toán sẵn sàng:** VietQR và chuyển khoản ngân hàng đã phổ biến ở hộ kinh doanh, mở đường cho việc tự động ghi doanh thu từ biến động số dư.

## 4. Khách hàng mục tiêu

**Phân khúc đầu tiên (beachhead):** hộ kinh doanh **ăn uống và tạp hóa** ở đô thị, doanh thu khoảng 200 triệu đến 3 tỷ/năm, chủ hộ 30–55 tuổi, dùng smartphone và Zalo hằng ngày.

Persona: *Chị Lan, 42 tuổi, quán phở ở Gò Vấp.* Trước đây nộp khoán vài triệu/quý. Nay lo không biết ghi sổ thế nào, sợ bị phạt, không muốn thuê dịch vụ kế toán vài trăm nghìn đến cả triệu mỗi tháng.

Phân khúc mở rộng: dịch vụ (tóc, nail, sửa xe), người bán online (Shopee, TikTok Shop, Facebook) và cho thuê nhà.

## 5. Mô hình kinh doanh

| Gói | Giá (dự kiến) | Nội dung |
|---|---|---|
| **Miễn phí** | 0 đ | Ghi sổ không giới hạn, ước tính thuế, nhắc hạn nộp |
| **Pro** | 49.000 đ/tháng (399.000 đ/năm) | Ghi bằng giọng nói, xuất sổ S1-HKD, báo cáo lãi lỗ, tự đồng bộ biến động số dư ngân hàng |
| **Pro + Kế toán** | 199.000 đ/tháng | Kế toán viên đối tác rà soát và nộp tờ khai thay |

Nguồn thu phụ (giai đoạn 2):

- Hoa hồng giới thiệu **hóa đơn điện tử, máy tính tiền, chữ ký số**;
- Hợp tác **ngân hàng và ví điện tử**: dữ liệu dòng tiền đã chuẩn hóa (khi chủ hộ đồng ý) giúp chấm điểm tín dụng cho khoản vay vốn lưu động.

## 6. Cạnh tranh

| | Sổ Sạch | Phần mềm kế toán/POS lớn | Dịch vụ kế toán thuê ngoài | Sổ tay, Excel |
|---|---|---|---|---|
| Cách nhập liệu | Câu tự nhiên, giọng nói | Form, quét mã | Gửi chứng từ | Tự ghi tay |
| Giá | 0–49k/tháng | 100k–500k+/tháng | 300k–1,5tr/tháng | 0 |
| Ước tính thuế, nhắc nhở | Có, tự động | Một phần | Có | Không |
| Phù hợp hộ rất nhỏ | Rất cao | Trung bình | Thấp (đắt) | Cao nhưng dễ sai |

**Rủi ro lớn nhất:** các ông lớn (MISA, KiotViet, ngân hàng, eTax Mobile của Tổng cục Thuế) thêm tính năng tương tự.
**Cách phòng thủ:**

1. Tốc độ: ra mắt trước kỳ khai thuế đầu tiên;
2. Trải nghiệm "nhắn tin là xong", điều mà sản phẩm dạng form khó sao chép;
3. Kênh phân phối qua **Zalo Mini App** và cộng đồng chủ quán;
4. Hợp tác với chính các POS và ngân hàng thay vì cạnh tranh trực diện.

## 7. Chiến lược ra thị trường

1. **Nội dung giáo dục** (TikTok, YouTube Shorts, nhóm Facebook chủ quán): "Bỏ thuế khoán: quán phở doanh thu 1 tỷ nộp bao nhiêu?". Công cụ tính thuế miễn phí làm lead magnet.
2. **Zalo Mini App và chatbot Zalo OA**: chủ hộ nhắn tin để ghi sổ ngay trong Zalo, không cần cài app.
3. **Đối tác kế toán dịch vụ**: một kế toán viên quản lý được 50–100 hộ nhờ Sổ Sạch, chia sẻ doanh thu gói Pro + Kế toán.
4. **Hội, hiệp hội và chợ truyền thống**: tập huấn trực tiếp cùng cán bộ thuế phường hoặc xã (theo chương trình hỗ trợ chuyển đổi của ngành thuế).

## 8. Kinh tế đơn vị (giả định, cần kiểm chứng)

| Chỉ số | Giả định |
|---|---|
| Tỷ lệ chuyển từ miễn phí sang trả phí | 5–8% |
| ARPU trả phí | ~45.000 đ/tháng (pha trộn gói năm và tháng) |
| Chi phí AI và hạ tầng / người dùng hoạt động | ~3.000 đ/tháng |
| CAC (kênh nội dung và đối tác) | 60.000–120.000 đ / người dùng trả phí |
| Tỷ lệ rời bỏ trả phí | 4%/tháng → vòng đời ~25 tháng |
| LTV | ~1.000.000 đ → LTV/CAC ≈ 8–15 |

**Mục tiêu 18 tháng:** 200.000 hộ dùng miễn phí và 12.000 hộ trả phí, tương đương ~540 triệu đ MRR (~6,5 tỷ đ ARR).

## 9. Rủi ro và cách giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Quy định thuế thay đổi liên tục (ngưỡng, tỷ lệ, cách tính) | Tách mọi tham số vào cấu hình (`src/tax.js`). Theo dõi văn bản mới và cập nhật trong 48 giờ. Luôn ghi rõ "ước tính tham khảo". |
| AI hiểu sai số tiền | Hiện kết quả để chủ hộ xác nhận. Có bộ phân tích luật làm đối chứng. Đo độ chính xác trên bộ câu mẫu thực tế. |
| Dữ liệu tài chính nhạy cảm | Lưu trên thiết bị theo mặc định. Đồng bộ đám mây có mã hóa và cần chủ hộ đồng ý. Tuân thủ Nghị định 13/2023 về bảo vệ dữ liệu cá nhân. |
| Chủ hộ không có thói quen ghi chép | Tự động hóa bằng đồng bộ biến động số dư và nhắc nhở cuối ngày qua Zalo. |
| Ông lớn sao chép | Xem mục 6. |

## 10. Chỉ số cần theo dõi

- **North Star:** số hộ ghi sổ ít nhất 5 ngày/tuần.
- Tỷ lệ câu được AI hiểu đúng (mục tiêu ≥ 97%).
- Tỷ lệ chuyển đổi sang trả phí trong mùa khai thuế.
- Số tờ khai được nộp đúng hạn nhờ nhắc nhở.

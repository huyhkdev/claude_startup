# Rẫy Số: kế hoạch kinh doanh

> Bản đồ hóa từng rẫy cà phê, để hạt cà phê Việt vào được châu Âu.

*Cập nhật: 10/2026. Mốc thời gian EUDR đã bị hoãn nhiều lần, và các số liệu ngành dưới đây là ước lượng. Tất cả cần kiểm chứng trước khi gọi vốn hoặc ký hợp đồng.*

---

## 1. Vấn đề

**Quy định chống phá rừng của EU (EUDR, 2023/1115)** cấm đưa vào thị trường EU cà phê, ca cao, cao su, gỗ, dầu cọ, đậu nành và bò nếu chúng được sản xuất trên đất **bị phá rừng sau 31/12/2020**. Doanh nghiệp nhập khẩu phải nộp **tờ khai thẩm định (DDS)** kèm **tọa độ của từng thửa đất** đã sản xuất ra lô hàng. Thửa trên 4 ha phải có ranh giới đa giác.

Sau các lần hoãn, lịch hiện hành mà chúng tôi nắm được là áp dụng cho doanh nghiệp lớn và vừa **từ cuối 2026**, doanh nghiệp nhỏ muộn hơn khoảng nửa năm. Lịch này cần kiểm tra lại vì EU vẫn đang rà soát và đơn giản hóa quy định.

Với Việt Nam, đây là bài toán lớn:

- Cà phê là mặt hàng xuất khẩu tỷ đô, và **EU là thị trường lớn nhất**;
- Cà phê Việt Nam do **hàng trăm nghìn nông hộ nhỏ** ở Tây Nguyên trồng, mỗi hộ thường 0,5–3 ha, chia thành nhiều thửa;
- Hàng đi qua nhiều tầng: **nông hộ → đại lý thu mua → công ty xuất khẩu → nhà nhập khẩu EU**. Mỗi tầng trộn hàng nên mất dấu nguồn gốc;
- Dữ liệu thửa đất (nếu có) thường là ảnh sổ đỏ, tọa độ ghi tay, file Excel sai định dạng, tọa độ bị đảo kinh/vĩ độ, đa giác tự cắt.

Nếu không có dữ liệu sạch, nhà nhập khẩu EU sẽ **chuyển sang mua của nước khác** hoặc **ép giá** hàng Việt Nam.

## 2. Giải pháp

**Rẫy Số** là nền tảng giúp công ty xuất khẩu và hợp tác xã gom, làm sạch và chứng minh dữ liệu nguồn gốc:

1. **Lấy ranh giới thửa:** cán bộ thu mua hoặc chính nông hộ đi quanh rẫy bằng điện thoại (Zalo Mini App, chạy được khi mất sóng) để ghi đa giác.
2. **Kiểm tra tự động** (đã có trong MVP):
   - Hình học sai: đa giác tự cắt, tọa độ đảo, thửa trên 4 ha chỉ có một điểm;
   - Diện tích đo lệch nhiều so với khai báo;
   - **Chồng lấn với vùng mất rừng sau 2020** (dữ liệu vệ tinh) và với **rừng phòng hộ, đặc dụng**;
   - **Hai hộ khai cùng một thửa;**
   - **Cân bằng khối lượng:** sản lượng giao từ một thửa vượt năng suất tối đa hợp lý là dấu hiệu trộn hàng không rõ nguồn gốc.
3. **Truy xuất theo lô:** mỗi phiếu cân của đại lý gắn với thửa cụ thể, mỗi lô xuất khẩu tự tổng hợp danh sách thửa.
4. **Xuất hồ sơ:** GeoJSON đúng chuẩn để nộp tờ khai DDS, kèm báo cáo rủi ro gửi khách hàng EU.

**Khác biệt:**

- Đội ngũ người Việt và giao diện tiếng Việt, có tiếng Êđê và J'rai cho nông hộ;
- Thu thập dữ liệu ngay tại hiện trường thông qua mạng lưới đại lý;
- Giá thấp hơn nhiều so với nền tảng quốc tế;
- Không chỉ "vẽ bản đồ" mà phát hiện được gian lận nhờ cân bằng khối lượng.

## 3. Vì sao là bây giờ

- **Hạn chót đang tới gần:** công ty xuất khẩu phải có dữ liệu cho các hợp đồng giao hàng 2027 ngay từ vụ thu hoạch 2026/27 (tháng 10/2026 đến tháng 1/2027).
- **Nhà nhập khẩu EU chuyển rủi ro xuống nhà cung cấp:** hợp đồng mua bán bắt đầu kèm điều khoản bắt buộc cung cấp dữ liệu định vị.
- **Ảnh vệ tinh và dữ liệu mất rừng toàn cầu miễn phí** (Global Forest Watch, JRC Forest Cover 2020…) giúp kiểm tra tự động với chi phí rất thấp.
- **Mở rộng sau cà phê:** cao su và gỗ (cũng thuộc EUDR), sau đó là các yêu cầu tương tự như CSDDD của EU, báo cáo phát thải và tín chỉ carbon nông nghiệp.

## 4. Khách hàng

| Phân khúc | Nhu cầu | Ai trả tiền |
|---|---|---|
| **Công ty xuất khẩu cà phê** (vài chục công ty lớn chiếm phần lớn sản lượng xuất khẩu) | Hồ sơ DDS cho từng lô, phát hiện rủi ro trước khi giao hàng | Có, khách hàng chính |
| **Hợp tác xã, tổ hợp tác** | Bán được giá cao hơn nhờ hàng "sạch EUDR" | Trả ít; thường được dự án hoặc nhà xuất khẩu tài trợ |
| **Nhà nhập khẩu, rang xay EU** | Kiểm tra dữ liệu nhà cung cấp Việt Nam | Có, giai đoạn 2 |
| **Tổ chức phát triển, dự án quốc tế** | Hỗ trợ nông hộ nhỏ không bị loại khỏi chuỗi | Tài trợ chi phí lấy dữ liệu ban đầu |

**Khách hàng đầu tiên:** 2–3 công ty xuất khẩu tầm trung ở Đắk Lắk và Lâm Đồng, những nơi không đủ lực tự xây hệ thống như các tập đoàn lớn.

## 5. Mô hình doanh thu

| Hạng mục | Giá dự kiến |
|---|---|
| Phí nền tảng theo sản lượng | 20.000–40.000 đ/tấn cà phê nhân đưa vào hệ thống (~1–1,5 USD/tấn) |
| Dịch vụ lấy ranh giới thửa tại hiện trường | 40.000–80.000 đ/thửa (làm một lần, cập nhật hằng năm) |
| Gói doanh nghiệp (tích hợp ERP, hỗ trợ kiểm toán) | Từ 150 triệu đ/năm |

**Ví dụ:** một công ty xuất khẩu tầm trung bán 30.000 tấn/năm vào EU và có 8.000 thửa. Doanh thu từ công ty này khoảng 750 triệu (phí theo tấn) cộng 480 triệu (lấy thửa năm đầu), tức hơn **1,2 tỷ đ năm đầu**. Chi phí này rất nhỏ so với giá trị lô hàng (một tấn cà phê nhân trị giá hàng nghìn USD).

## 6. Cạnh tranh

| | Rẫy Số | Nền tảng truy xuất quốc tế | Tự làm bằng Excel/GIS | Dự án của cơ quan nhà nước |
|---|---|---|---|---|
| Hiểu thực địa Tây Nguyên | Cao | Thấp, phải qua đối tác | Cao | Cao |
| Giá | Thấp | Cao (tính bằng USD) | Rẻ nhưng tốn nhân sự | Miễn phí, phạm vi hẹp |
| Phát hiện trộn hàng (cân bằng khối lượng) | Có | Một số có | Không | Không |
| Tốc độ triển khai | Vài tuần | Vài tháng | Phụ thuộc người làm | Theo kế hoạch địa phương |

**Chiến lược:** không cạnh tranh với cơ sở dữ liệu vùng trồng của nhà nước mà **nhập dữ liệu từ đó** (nếu được chia sẻ) và bổ sung truy xuất theo lô, thứ cơ sở dữ liệu nhà nước không làm.

## 7. Chiến lược ra thị trường

1. **Thử nghiệm miễn phí 1 lô:** công ty xuất khẩu gửi file thửa sẵn có (Excel, KML, ảnh tọa độ), sau 48 giờ nhận báo cáo rủi ro. MVP trong repo này làm đúng việc đó. Phần lớn file sẵn có sẽ lộ ra nhiều lỗi, và đó là cách bán hàng tốt nhất.
2. **Đi qua đại lý thu mua:** mỗi đại lý quản lý 200–1.000 hộ. Trả hoa hồng theo thửa lấy được ranh giới.
3. **Hợp tác các chương trình cà phê bền vững** (4C, Rainforest Alliance, dự án phát triển) để được tài trợ chi phí lấy dữ liệu nông hộ.
4. **Hội chợ và hiệp hội ngành:** Hiệp hội Cà phê Ca cao Việt Nam (VICOFA), các sự kiện cà phê ở Buôn Ma Thuột.

## 8. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| EU tiếp tục hoãn hoặc nới lỏng EUDR | Nhà nhập khẩu vẫn yêu cầu dữ liệu vì cam kết ESG. Mở rộng sang cao su, gỗ và báo cáo phát thải. Mô hình theo tấn nên chi phí cố định thấp. |
| Dữ liệu mất rừng toàn cầu báo sai (nhầm cà phê xen cây che bóng là rừng) | Phân mức "cần kiểm tra" thay vì loại ngay. Cho phép bổ sung bằng chứng (ảnh hiện trường, ảnh vệ tinh lịch sử). |
| Nông hộ lo ngại chia sẻ vị trí đất | Thu thập qua đại lý quen biết. Giải thích rõ mục đích. Chỉ chia sẻ dữ liệu với người mua khi hộ đồng ý (Nghị định 13/2023). |
| Đối thủ quốc tế hạ giá | Lợi thế mạng lưới hiện trường và tiếng địa phương rất khó sao chép nhanh. |
| Tranh chấp đất, thửa không có giấy tờ | Đánh dấu riêng, không tự kết luận về tính hợp pháp. Chuyển cho doanh nghiệp quyết định. |

## 9. Chỉ số cần theo dõi

- Số tấn cà phê có hồ sơ đạt (North Star);
- Số thửa đã có ranh giới và tỷ lệ thửa đạt ngay lần đầu;
- Thời gian từ khi nhận file đến khi có báo cáo;
- Tỷ lệ cảnh báo sai trên vùng mất rừng (đối chiếu kiểm tra hiện trường).

# Ra Đề

**Dán đề từ Word. Nhận ngay file Word nhiều mã đề, kèm bảng đáp án.**

Công cụ trộn đề cho giáo viên, hỗ trợ đề định dạng mới 3 phần (trắc nghiệm nhiều lựa chọn, đúng/sai, trả lời ngắn). Giáo viên không cần học gì mới: gõ đề như trong Word, đánh dấu `*` trước đáp án đúng, rồi tải về file Word để in.

- Kế hoạch kinh doanh: [docs/ke-hoach-kinh-doanh.md](docs/ke-hoach-kinh-doanh.md)

## Chạy thử

```bash
npm install
npm start        # http://localhost:3000 → bấm "Xem đề mẫu" → "Tải file Word"
npm test
```

Để bật **AI soạn đề** (dùng Claude):

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm start
```

Khi bật AI, trang web hiện thêm ô "Chưa có đề? Để AI soạn giúp". Đề AI soạn được đổ vào ô nhập để giáo viên đọc và sửa trước khi trộn, không bao giờ xuất thẳng.

## Định dạng đề

```
PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn
Câu 1. Liên hợp quốc được thành lập năm nào?
A. 1944    *B. 1945    C. 1946    D. 1947

PHẦN II. Câu trắc nghiệm đúng sai
Câu 1. Đoạn dẫn...
*a) Ý đúng
b) Ý sai
*c) Ý đúng
d) Ý sai

PHẦN III. Câu trắc nghiệm trả lời ngắn
Câu 1. Liên hợp quốc có bao nhiêu thành viên?
Đáp án: 193
```

Bộ đọc đề xử lý được các trường hợp sau:
- Phương án viết trên cùng một dòng hoặc mỗi phương án một dòng;
- Câu hỏi và phương án kéo dài nhiều dòng;
- Không có tiêu đề PHẦN (tự nhận dạng câu theo kiểu phương án);
- Chữ Việt dạng tổ hợp khi dán từ Word cũ.

## Quy tắc trộn

- Đảo thứ tự câu trong từng phần. Đảo phương án A–D của câu trắc nghiệm.
- **Không đảo phương án** nếu câu có phương án kiểu "Tất cả các ý trên", "Cả A và B", "A và B đều đúng".
- Câu đúng/sai giữ nguyên thứ tự 4 ý a–d.
- Cùng một mã đề luôn cho cùng một đề, nên in lại không bị lệch đáp án.

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `src/parse.js` | Đọc đề dạng văn bản, báo lỗi bằng tiếng Việt dễ hiểu (dùng chung cho trình duyệt) |
| `src/mix.js` | Trộn đề theo mã, lập bảng đáp án |
| `src/docx.js` | Xuất file Word: mỗi mã đề một trang, cuối file là bảng đáp án |
| `src/ai.js` | AI soạn đề theo định dạng 3 phần, trả JSON theo schema |
| `server.js` | HTTP server: giao diện, `POST /api/docx`, `POST /api/generate` |
| `public/` | Giao diện web, chạy tốt trên điện thoại |

## Việc tiếp theo

- Đọc thẳng file `.docx`, nhận đáp án đúng qua gạch chân hoặc tô màu (cách giáo viên hay làm), giữ hình ảnh và công thức Toán
- Tự sinh ma trận và bản đặc tả đề
- Chân trang "Trộn bằng Ra Đề" trên bản miễn phí để lan truyền

# Tài liệu Kiến trúc: Quy trình tạo Giáo án tự động (Backend)

Tài liệu này mô tả chi tiết cách hệ thống Backend (FastAPI + Python) xử lý yêu cầu của người dùng, phân tích file Word mẫu và kết hợp với OpenAI (GPT-4o) để sinh ra một file giáo án Word (.docx) hoàn chỉnh.

---

## 1. Luồng xử lý tổng quan (Workflow)

Quá trình được kích hoạt khi Frontend gọi API `POST /api/generate` trong `main.py`. Luồng chạy sẽ trải qua 5 bước chính:

1. **Tiếp nhận dữ liệu**: Nhận Prompt, Meta Data (Tên trường, giáo viên...) và File mẫu (Template).
2. **Tiền xử lý File Word**: Chuyển đổi `.doc` sang `.docx` (nếu cần) và bóc tách các đoạn văn (Nodes).
3. **Sinh nội dung (AI Generation)**: Gửi danh sách Nodes và Prompt cho GPT-4o để xử lý và điền nội dung.
4. **Ghi đè nội dung (Node Replacement)**: Thay thế các đoạn văn gốc bằng nội dung mới do AI sinh ra.
5. **Trả kết quả**: Xuất file `.docx` hoàn chỉnh trả về cho Frontend.

---

## 2. Chi tiết từng module (Deep Dive)

### 2.1. API Controller (`main.py`)
- Định nghĩa endpoint `POST /api/generate` nhận form-data.
- Hỗ trợ 2 chế độ: Sử dụng mẫu upload từ máy người dùng (`template_file`) hoặc sử dụng mẫu chuẩn của hệ thống (`mau_giao_an_chuan.docx`).
- Tạo bản sao (copy) của file mẫu vào thư mục `temp/` để tiến hành ghi đè mà không làm hỏng file gốc.
- Sử dụng `FileResponse` để stream file `.docx` trực tiếp về cho trình duyệt tải xuống.

### 2.2. Bóc tách dữ liệu Word (`document_service.py`)
> [!NOTE]
> Đây là module quan trọng nhất để hệ thống hiểu được cấu trúc của file Word mà không làm vỡ định dạng (Format).

- **Hàm `convert_doc_to_docx`**: Nếu người dùng tải lên file `.doc` đời cũ, hệ thống sẽ gọi ngầm Microsoft Word (`win32com.client`) trên server Windows để Save As thành file `.docx` chuẩn XML trước khi xử lý.
- **Hàm `extract_document_elements`**: Sử dụng thư viện `python-docx` để quét toàn bộ file:
  - Quét các đoạn văn bản độc lập (`doc.paragraphs`). Đánh ID theo format: `p_{index}` (ví dụ: `p_0`, `p_1`).
  - Quét các văn bản nằm bên trong Bảng (`doc.tables`). Đánh ID theo ma trận 4 chiều: `t_{table_index}_{row_index}_{col_index}_{para_index}`.
  - Kết quả trả về là một bộ từ điển (Dictionary) dạng JSON: `{"p_5": "Tên bài dạy: {{ ten_bai_day }}", ...}`.

### 2.3. Trí tuệ nhân tạo (`ai_service.py`)
- **Hàm `generate_lesson_plan_nodes`**: Nhận vào toàn bộ danh sách ID + Text ở bước trên.
- Gắn một System Prompt siêu chi tiết, đóng vai "Chuyên gia giáo dục cấp cao".
- Ép buộc GPT-4o phải trả về định dạng **JSON Object** (`response_format={"type": "json_object"}`).
- Nhiệm vụ của AI:
  1. Thay thế các biến số hành chính (ví dụ: `{{ ten_truong }}`) bằng Meta Data thực tế.
  2. Tự động soạn thảo nội dung giáo án cực kỳ chi tiết dựa trên Prompt bài học.
- Output trả về từ AI là một JSON chứa các ID cần thay đổi và nội dung mới tương ứng.
  *Ví dụ:* `{"p_5": "Tên bài dạy: Lực ma sát"}`

### 2.4. Ghi đè nội dung (`document_service.py`)
- **Hàm `apply_node_replacements`**: 
  - Mở lại file Word bằng `python-docx`.
  - Quét lại toàn bộ đoạn văn và bảng. Nếu ID của đoạn văn trùng với ID mà AI trả về, hệ thống sẽ gọi hàm `p.clear()` để xóa chữ cũ và `p.add_run(new_text)` để chèn chữ mới.
  - > [!TIP]
    > Hệ thống được lập trình để cố gắng giữ lại định dạng in đậm (`bold`) của từ đầu tiên trong đoạn văn gốc, giúp cấu trúc file Word không bị lộn xộn sau khi AI can thiệp.

---

## 3. Ưu điểm của kiến trúc này
1. **Bảo toàn định dạng (Formatting Preservation)**: Thay vì yêu cầu AI sinh ra HTML hay Markdown rồi convert lại thành Word (rất dễ vỡ bảng biểu), chúng ta giữ nguyên file Word gốc và chỉ thay lõi (text) ở những Node nhất định.
2. **Khả năng mở rộng**: Dễ dàng hỗ trợ mọi loại template tùy chỉnh của từng trường/giáo viên khác nhau. Chỉ cần họ tải file Word lên, hệ thống sẽ tự động bóc tách thành Node và để AI tự hiểu vị trí cần điền.

# EduMate - Hệ sinh thái công cụ giảng dạy AI 🚀

Dự án này là một ứng dụng Fullstack giúp tự động hóa quy trình soạn giáo án, tạo đề thi và nhiều công cụ giảng dạy khác cho giáo viên bằng sức mạnh của Trí tuệ Nhân tạo (OpenAI).

Hệ thống được chia làm 2 thành phần chính:
- **Backend**: Xây dựng bằng Python (FastAPI).
- **Frontend**: Xây dựng bằng React (Vite).

Dưới đây là hướng dẫn chi tiết cách thiết lập và khởi chạy hệ thống trên máy tính của bạn (Local Development).

---

## 🛠 Yêu cầu hệ thống (Prerequisites)
Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
- **Node.js** (phiên bản 18.x trở lên) - Dùng để chạy Frontend.
- **Python** (phiên bản 3.9 trở lên) - Dùng để chạy Backend.
- **Microsoft Word** (Chỉ bắt buộc nếu bạn chạy Server trên hệ điều hành Windows và muốn hệ thống hỗ trợ convert định dạng file `.doc` đời cũ).

---

## ⚙️ 1. Hướng dẫn chạy Backend (FastAPI)

Mở Terminal / Command Prompt và thực hiện tuần tự các bước sau:

**Bước 1: Di chuyển vào thư mục backend**
```bash
cd backend
```

**Bước 2: Tạo và kích hoạt môi trường ảo (Virtual Environment)**
```bash
# Trên Windows
python -m venv .venv
.venv\Scripts\activate

# Trên macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

**Bước 3: Cài đặt các thư viện cần thiết**
```bash
pip install -r requirements.txt

# (Lưu ý: Nếu bạn dùng Windows và muốn đọc file .doc, hãy cài thêm win32com)
pip install pywin32
```

**Bước 4: Cấu hình biến môi trường API Key**
Tạo một file có tên là `.env` nằm ngang hàng với file `main.py` trong thư mục `backend/`. Mở file `.env` lên và dán API Key của OpenAI vào như sau:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Bước 5: Khởi động Server Backend**
```bash
uvicorn main:app --reload
```
🎉 Khi thấy dòng chữ `Application startup complete`, nghĩa là Backend của bạn đã chạy thành công tại địa chỉ: **http://127.0.0.1:8000**

*(Lưu ý: Giữ nguyên cửa sổ Terminal này để Backend tiếp tục chạy).*

---

## 💻 2. Hướng dẫn chạy Frontend (React + Vite)

Mở một cửa sổ Terminal / Command Prompt **MỚI** (không tắt cái cũ) và thực hiện các bước sau:

**Bước 1: Di chuyển vào thư mục frontend**
```bash
cd frontend
```

**Bước 2: Cài đặt các gói thư viện Node (Dependencies)**
```bash
npm install
```

**Bước 3: Khởi động giao diện ứng dụng**
```bash
npm run dev
```
🎉 Sau vài giây, Terminal sẽ hiển thị một đường dẫn Localhost (thường là **http://localhost:5173**). Hãy nhấn `Ctrl + Click` vào đường link đó để mở ứng dụng EduMate trên trình duyệt web của bạn.

## 🐳 Hướng dẫn chạy bằng Docker (Khuyên dùng)

Cách dễ nhất và chuẩn mực nhất để chạy dự án là sử dụng **Docker**. Bạn không cần cài đặt Node.js hay Python thủ công nữa.

### Bước 1: Tạo file cấu hình môi trường (.env)
1. Copy file `.env.example` thành file mới tên là `.env`.
2. Mở file `.env` và điền khóa bí mật `OPENAI_API_KEY` cũng như thay đổi thông tin Database nếu cần:
```env
POSTGRES_USER=edumate
POSTGRES_PASSWORD=edumate_super_secret_pass
POSTGRES_DB=edumate_db
OPENAI_API_KEY=sk-...
```

### Bước 2: Chọn môi trường để chạy

#### Môi trường Phát triển (Development - Hot Reload)
Dành cho lập trình viên. Code thay đổi sẽ được cập nhật ngay lập tức lên trình duyệt.
```bash
docker compose -f docker-compose.dev.yml up -d --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

#### Môi trường Triển khai (Production)
Dành cho chạy thực tế trên máy chủ. Tối ưu hóa hiệu năng, sử dụng Nginx.
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
- Frontend: `http://localhost:80`
- Backend API: `http://localhost:8000`

### Dừng hệ thống
Để tắt các server Docker đang chạy:
```bash
docker compose -f docker-compose.dev.yml down
# hoặc
docker compose -f docker-compose.prod.yml down
```

---

## 📚 Tóm tắt kiến trúc Backend cho đội ngũ kỹ thuật
Nếu bạn tò mò về cách Backend xử lý file Word và làm việc với AI để tạo ra giáo án, vui lòng tham khảo tài liệu kỹ thuật chi tiết tại file: `backend_lesson_plan_workflow.md`.

Chúc bạn và nhóm có những trải nghiệm tuyệt vời khi phát triển EduMate! 🌟

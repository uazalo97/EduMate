# 🚀 Hướng Dẫn Thiết Lập Máy Chủ Google Cloud (GCP) & Tự Động Triển Khai Bằng GitHub Actions

Tài liệu này hướng dẫn bạn cách khởi tạo máy chủ trên Google Cloud Platform (GCP) và thiết lập hệ thống tự động tải code + build Docker mỗi khi bạn gõ lệnh `git push`.

---

## ☁️ Giai đoạn 1: Chuẩn bị máy chủ Google Cloud (GCP)

### 1. Tạo máy chủ (VM Instance)
1. Đăng nhập vào [Google Cloud Console](https://console.cloud.google.com/).
2. Truy cập **Compute Engine** > **VM Instances** > Bấm **Create Instance**.
3. Cấu hình đề nghị:
   - **Machine type**: `e2-medium` (Tối thiểu 2 CPU, 4GB RAM để chạy Docker và build Frontend mượt mà).
   - **Boot disk**: `Ubuntu 22.04 LTS` hoặc `Debian 12`.
   - **Firewall**: Đánh dấu tích vào cả hai ô **Allow HTTP traffic** và **Allow HTTPS traffic** để hệ thống có thể mở web ra Internet.

### 2. Cài đặt Docker & Git trên VM
Truy cập vào máy chủ (Bấm nút **SSH** trên bảng điều khiển Google Cloud) và chạy lần lượt các lệnh sau:

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Git
sudo apt install git -y

# Cài đặt Docker
sudo apt install docker.io docker-compose-v2 -y

# Cho phép user mặc định chạy Docker mà không cần gõ sudo
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Khởi tạo dự án lần đầu tiên trên VM
1. Clone mã nguồn từ GitHub của bạn xuống máy chủ:
   ```bash
   # Nếu repo private, bạn cần tạo Access Token trên GitHub trước khi clone
   git clone https://github.com/TEN-TAI-KHOAN-CUA-BAN/EduMate.git
   ```
2. Di chuyển vào thư mục dự án: `cd EduMate`
3. Cấu hình file `.env`: Tạo file `.env` bằng lệnh `nano .env` và copy/paste toàn bộ thông số bảo mật từ máy tính của bạn vào đây (Bao gồm OPENAI_API_KEY). Nhấn `Ctrl + O` để lưu, `Ctrl + X` để thoát.

---

## 🔑 Giai đoạn 2: Tạo SSH Key để GitHub tự kết nối vào VM

Để GitHub có quyền chui vào máy chủ GCP chạy lệnh Docker thay bạn, chúng ta cần tạo một "Chìa khóa" (SSH Key).

1. Ngay tại cửa sổ SSH của máy chủ GCP, gõ lệnh tạo khóa:
   ```bash
   ssh-keygen -t rsa -b 4096 -C "github-actions"
   # Cứ nhấn Enter 3 lần khi được hỏi, không đặt mật khẩu (passphrase).
   ```
2. Cấp quyền cho ổ khóa (Public key):
   ```bash
   cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
   ```
3. Lấy chìa khóa (Private key) để đưa cho GitHub:
   ```bash
   cat ~/.ssh/id_rsa
   ```
   **Bôi đen và Copy TOÀN BỘ nội dung** (Từ dòng `-----BEGIN OPENSSH PRIVATE KEY-----` cho đến dòng `-----END OPENSSH PRIVATE KEY-----`).

---

## ⚙️ Giai đoạn 3: Cấu hình GitHub Secrets

Mở kho lưu trữ (Repository) dự án của bạn trên trình duyệt **GitHub**.
1. Chuyển sang tab **Settings**.
2. Tìm thanh bên trái, chọn **Secrets and variables** > **Actions**.
3. Bấm nút màu xanh **New repository secret** để lần lượt tạo 3 biến bí mật sau:

| Name | Secret (Nội dung) | Chú thích |
|---|---|---|
| `GCP_VM_HOST` | *(Ví dụ: 34.123.45.67)* | Địa chỉ IP Public của máy chủ GCP VM. |
| `GCP_VM_USERNAME` | *(Ví dụ: ubuntu hoặc tên gmail của bạn trước dấu @)* | Tên Username hiển thị trên cửa sổ SSH. |
| `GCP_VM_SSH_KEY` | *(Paste toàn bộ nội dung bạn vừa Copy ở Giai đoạn 2)* | Chìa khóa bí mật để đăng nhập không cần mật khẩu. |

---

## 🎉 Hoàn tất! Cách thức vận hành:

Mọi thiết lập đã xong! Kể từ bây giờ, vòng lặp công việc (Workflow) của bạn sẽ vô cùng nhàn nhã:
1. Bạn sửa code trên máy tính (Local) và chạy `git push origin main`.
2. Truy cập tab **Actions** trên giao diện web GitHub để xem quá trình chạy.
3. Khi vòng tròn xanh tick ✅ hiện lên, hệ thống trên GCP đã tự động cập nhật bản code mới nhất, Build lại Docker và khởi động lại Server mà bạn không cần phải đụng tay vào!

Chúc bạn triển khai thành công rực rỡ! 🚀

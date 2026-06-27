# 🚀 Hướng Dẫn Thiết Lập Máy Chủ Google Cloud (GCP) & Tự Động Triển Khai Bằng GitHub Actions

Tài liệu này hướng dẫn bạn cách khởi tạo máy chủ trên Google Cloud Platform (GCP) và thiết lập hệ thống tự động tải code + build Docker mỗi khi bạn gõ lệnh `git push`.

---

## ☁️ Giai đoạn 1: Chuẩn bị máy chủ Google Cloud (GCP)

### 1. Tạo máy chủ (VM Instance) và gán IP Tĩnh
1. Đăng nhập vào [Google Cloud Console](https://console.cloud.google.com/).
2. Truy cập **Compute Engine** > **VM Instances** > Bấm **Create Instance**.
3. Cấu hình đề nghị:
   - **Machine type**: `e2-medium` (Tối thiểu 2 CPU, 4GB RAM để chạy Docker và build Frontend mượt mà).
   - **Boot disk**: `Ubuntu 22.04 LTS` hoặc `Debian 12`.
   - **Firewall**: Đánh dấu tích vào cả hai ô **Allow HTTP traffic** và **Allow HTTPS traffic** để hệ thống có thể mở web ra Internet.
   - **Gán IP Tĩnh (Static IP)**: Cuộn xuống phần **Advanced options** > **Networking** > **Network interfaces**. Ở mục **External IPv4 address**, thay vì để Ephemeral (Tạm thời), hãy chọn **Reserve static external IP address**. Đặt tên cho IP này (VD: `edumate-static-ip`) và bấm Reserve. Việc này giúp IP của bạn không bao giờ bị đổi mỗi khi tắt/mở lại máy ảo!

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

*(Lưu ý: Bạn KHÔNG CẦN tạo file `.env` trên máy chủ. Hệ thống GitHub Actions sẽ tự động làm việc này dựa trên cấu hình bảo mật ở Giai đoạn 3).*

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
| `POSTGRES_USER` | `edumate` | Tên đăng nhập Database |
| `POSTGRES_PASSWORD` | `edumate_super_secret_pass` | Mật khẩu Database (Hãy đổi lại cho an toàn) |
| `POSTGRES_DB` | `edumate_db` | Tên Database |
| `OPENAI_API_KEY` | `sk-...` | Khóa API của OpenAI để sinh giáo án |
| `GOOGLE_CLIENT_ID` | `...apps.googleusercontent.com` | Mã kết nối đăng nhập Google |
| `JWT_SECRET_KEY` | `my_super_secret_jwt_key_12345` | Chìa khóa mã hóa phiên đăng nhập (Nên đổi chuỗi khác ngẫu nhiên) |

---

## 🎉 Hoàn tất! Cách thức vận hành:

Mọi thiết lập đã xong! Kể từ bây giờ, vòng lặp công việc (Workflow) của bạn sẽ vô cùng nhàn nhã:
1. Bạn sửa code trên máy tính (Local) và chạy `git push origin main`.
2. Truy cập tab **Actions** trên giao diện web GitHub để xem quá trình chạy.
3. Khi vòng tròn xanh tick ✅ hiện lên, hệ thống trên GCP đã tự động cập nhật bản code mới nhất, Build lại Docker và khởi động lại Server mà bạn không cần phải đụng tay vào!

---

## 💻 Phụ lục: Kết nối máy ảo (VM) trực tiếp vào VS Code (Remote - SSH)

Nếu bạn muốn dùng VS Code trên máy tính cá nhân để mở code và gõ lệnh trực tiếp bên trong máy chủ GCP như đang làm việc ở máy tính nhà, hãy làm theo cách sau:

### 1. Cài đặt tiện ích Remote - SSH
- Mở VS Code, vào phần **Extensions** (Tiện ích).
- Tìm và cài đặt tiện ích có tên **Remote - SSH** (của Microsoft).

### 2. Thiết lập SSH Key cho máy tính cá nhân
- Mở Terminal trên máy tính Windows/Mac của bạn và chạy lệnh tạo chìa khóa (nếu chưa có):
  ```bash
  ssh-keygen -t rsa -b 4096
  ```
- Mở file Public Key vừa tạo (thường nằm ở `C:\Users\Ten_Cua_Ban\.ssh\id_rsa.pub` trên Windows hoặc `~/.ssh/id_rsa.pub` trên Mac) và **Copy** nội dung bên trong.

### 3. Khai báo khóa vào máy ảo GCP
- Quay lại cửa sổ dòng lệnh SSH trên trang web Google Cloud.
- Gõ lệnh: `nano ~/.ssh/authorized_keys`
- Dán (Paste) nội dung Public Key bạn vừa copy ở Bước 2 vào một dòng mới dưới cùng. Bấm `Ctrl + O` để lưu, `Ctrl + X` để thoát.

### 4. Kết nối từ VS Code và Viết file Config
Khi sử dụng tiện ích Remote-SSH, hệ thống (hoặc IDE) có thể sẽ yêu cầu bạn chọn và cập nhật file cấu hình SSH (SSH Config file - thường nằm ở `C:\Users\Ten_Cua_Ban\.ssh\config`).
Nếu IDE mở file này lên và yêu cầu bạn tự viết, bạn hãy copy đoạn cấu hình sau và dán vào cuối file:

```text
Host edumate-gcp
    HostName ĐỊA_CHỈ_IP_CỦA_MÁY_ẢO
    User TÊN_ĐĂNG_NHẬP
    IdentityFile ~/.ssh/id_rsa
```
*(Lưu ý: Thay `ĐỊA_CHỈ_IP_CỦA_MÁY_ẢO` bằng IP tĩnh của bạn, và `TÊN_ĐĂNG_NHẬP` bằng username của GCP).*

Sau khi lưu file `config` này lại, bạn chỉ cần mở VS Code, bấm `F1`, gõ **Remote-SSH: Connect to Host...** và bạn sẽ thấy chữ `edumate-gcp` hiện ra ngay trong danh sách. Chỉ việc click vào là xong!

Bây giờ bạn đã hoàn toàn làm chủ máy chủ! Bạn có thể mở Terminal ngay trong IDE và dùng nó như máy tính của chính mình.

Chúc bạn triển khai thành công rực rỡ! 🚀

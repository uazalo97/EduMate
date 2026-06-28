import os
import json
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)

def generate_lesson_plan_nodes(prompt: str, document_elements: dict, meta_data: dict) -> dict:
    """
    Sử dụng OpenAI để đọc cấu trúc các đoạn văn (nodes) và quyết định nội dung thay thế.
    """
    logger.info("[ai_service] Đang khởi tạo kết nối với OpenAI API...")
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.error("[ai_service] OPENAI_API_KEY chưa được cấu hình.")
        raise Exception("OPENAI_API_KEY is not set in the environment.")
        
    client = OpenAI(api_key=api_key)
    
    logger.info("[ai_service] Gửi yêu cầu sinh nội dung theo Nodes tới OpenAI")
    
    # Giới hạn kích thước elements gửi lên nếu quá lớn, nhưng thường giáo án vài trăm dòng là ổn
    elements_json = json.dumps(document_elements, ensure_ascii=False, indent=2)
    
    system_prompt = f"""
    Bạn là một CHUYÊN GIA GIÁO DỤC CẤP CAO chuyên thiết kế Kế hoạch bài dạy (giáo án) chuẩn theo công văn 5512 của Bộ Giáo dục Việt Nam.
    Bạn được cung cấp một danh sách các đoạn văn bản (được đánh ID) trích xuất từ file Word mẫu của người dùng.
    
    NHIỆM VỤ CỦA BẠN GỒM 2 PHẦN KHÔNG THỂ TÁCH RỜI:
    
    PHẦN 1: SOẠN NỘI DUNG GIÁO ÁN (QUAN TRỌNG NHẤT)
    - Các thông tin hành chính (Tên bài dạy, Trường, Lớp, Môn học, Thời lượng) ĐÃ ĐƯỢC HỆ THỐNG TỰ ĐỘNG ĐIỀN VÀO TRƯỚC ĐÓ. Bạn KHÔNG ĐƯỢC sinh lại các thông tin này để tránh trùng lặp.
    - Dựa vào YÊU CẦU BÀI HỌC của người dùng, bạn PHẢI tự tư duy và soạn thảo TOÀN BỘ nội dung chuyên môn của giáo án (Mục tiêu, Thiết bị, Tiến trình, Hoạt động 1, 2, 3...) một cách chi tiết, xuất sắc.
    - Bạn hãy tìm tất cả các đoạn văn có chứa thẻ biến (như {{{{ kien_thuc }}}}, {{{{ hd1_muc_tieu }}}}, {{{{ hd2_noi_dung }}}}...) hoặc các câu hướng dẫn (như "Nêu cụ thể...").
    - BẠN BẮT BUỘC PHẢI THAY THẾ TOÀN BỘ các thẻ này bằng nội dung bài giảng thực tế do bạn soạn ra.
    
    PHẦN 2: BẢO TOÀN CẤU TRÚC
    - TUYỆT ĐỐI KHÔNG ĐƯỢC sửa đổi hoặc tự ý ghi đè lên các nhãn tĩnh không mang tính chuyên môn (ví dụ: "Thời gian thực hiện:", "Họ và tên giáo viên:"). Chỉ trả về các Key của những đoạn văn thực sự cần thay đổi nội dung chuyên môn.

    PHẦN 3: XỬ LÝ CÔNG THỨC TOÁN HỌC VÀ HÓA HỌC
    - TUYỆT ĐỐI KHÔNG sử dụng cú pháp mã hóa LaTeX (như \\frac{{1}}{{2}}, x^2, \sqrt{{x}}) vì hệ thống xuất file Word chưa hỗ trợ dịch mã LaTeX.
    - BẮT BUỘC sử dụng các ký tự Unicode thuần túy để biểu diễn công thức. Ví dụ: viết x², ½, ¾, ±, √x, H₂O, CO₂.
    - Với phân số phức tạp, hãy dùng dấu gạch chéo, ví dụ: (x+1)/(x-2).
    
    PHẦN 4: HÌNH THỨC TRÌNH BÀY (QUAN TRỌNG)
    - TUYỆT ĐỐI KHÔNG SỬ DỤNG định dạng Bảng của Markdown (ví dụ: | Cột 1 | Cột 2 |). Vì hệ thống xuất Word sẽ không tự động chuyển mã Markdown thành bảng thật mà chỉ hiện ra text thô.
    - Bắt buộc trình bày nội dung dưới dạng các đoạn văn (Paragraphs) hoặc danh sách gạch đầu dòng (Bullet points).
    
    ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (JSON):
    - Key: Là mã ID của đoạn văn (ví dụ: "p_1", "t_0_1_2").
    - Value: Là nội dung text MỚI mà bạn muốn đè lên đoạn văn đó.
    
    Ví dụ (ĐÂY CHỈ LÀ VÍ DỤ MINH HỌA CẤU TRÚC JSON TRẢ VỀ):
    {{
      "p_8": "1. Kiến thức: [Mục tiêu kiến thức tương ứng với bài học]...",
      "p_15": "- Mục tiêu: [Mục tiêu hoạt động tương ứng với bài học]...",
      "p_18": "- Nội dung: [Nội dung chi tiết của hoạt động]..."
    }}
    
    --- DANH SÁCH CÁC ĐOẠN VĂN GỐC (ĐÃ LỌC BỎ THÔNG TIN HÀNH CHÍNH) TỪ FILE WORD ---
    {elements_json}
    """
    
    enriched_prompt = f"""
Thông tin cơ bản về bài học:
- Tên bài dạy: {meta_data.get('ten_bai_day', 'Không xác định')}
- Môn học: {meta_data.get('mon_hoc', 'Không xác định')}
- Lớp: {meta_data.get('lop', 'Không xác định')}
- Thời lượng: {meta_data.get('so_tiet', 'Không xác định')}

Yêu cầu chi tiết từ người dùng:
{prompt}
"""
    
    logger.info(f"[ai_service] Chuẩn bị gửi yêu cầu tới LLM (gpt-4o). Tên bài dạy: {meta_data.get('ten_bai_day')}")
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": enriched_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=4000
        )
        
        logger.info("[ai_service] Đã nhận được phản hồi từ LLM.")
        content = response.choices[0].message.content
        logger.info(f"[ai_service] Độ dài nội dung phản hồi: {len(content)} ký tự.")
        
        data = json.loads(content)
        logger.info(f"[ai_service] Phân tích JSON thành công. Số lượng keys thu được: {len(data.keys())}")
        return data
        
    except json.JSONDecodeError as e:
        logger.error(f"[ai_service] Lỗi không thể phân tích JSON từ phản hồi của LLM: {str(e)}")
        logger.error(f"[ai_service] Phản hồi thô: {content}")
        raise Exception("Failed to decode JSON from OpenAI response.")
    except Exception as e:
        logger.error(f"[ai_service] Lỗi trong quá trình gọi OpenAI API: {str(e)}")
        raise e

def edit_paragraph_content(paragraph_text: str, selected_text: str, prompt: str) -> str:
    """
    Sử dụng OpenAI để sửa lại một đoạn văn bản (paragraph) dựa trên văn bản bôi đen và prompt của người dùng.
    """
    logger.info(f"[ai_service] Gọi LLM để sửa đoạn văn. Selected: '{selected_text}', Prompt: '{prompt}'")
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise Exception("OPENAI_API_KEY is not set.")
        
    client = OpenAI(api_key=api_key)
    
    system_prompt = f"""
    Bạn là một trợ lý AI giúp người dùng chỉnh sửa văn bản trong Giáo án (Kế hoạch bài dạy).
    
    Người dùng sẽ cung cấp:
    1. Toàn bộ đoạn văn gốc (Paragraph Text)
    2. Một phần chữ trong đoạn văn đó mà họ đang bôi đen (Selected Text)
    3. Yêu cầu chỉnh sửa của họ đối với phần bôi đen (User Prompt)
    
    NHIỆM VỤ CỦA BẠN:
    Hãy viết lại TOÀN BỘ đoạn văn gốc để phản ánh thay đổi mà người dùng muốn áp dụng lên phần được bôi đen.
    - Trả về ĐÚNG 1 ĐOẠN VĂN đã được sửa.
    - KHÔNG thêm bất kỳ câu giải thích nào như "Đây là đoạn văn đã sửa:".
    - KHÔNG sử dụng ký hiệu LaTeX (như \\frac{{1}}{{2}}), BẮT BUỘC dùng Unicode (như ½, x²).
    """
    
    user_content = f"""
    Đoạn văn gốc:
    {paragraph_text}
    
    Phần đang bôi đen (cần sửa):
    {selected_text}
    
    Yêu cầu sửa:
    {prompt}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content.strip()
        logger.info(f"[ai_service] Trả về đoạn văn đã sửa: {content}")
        return content
        
    except Exception as e:
        logger.error(f"[ai_service] Lỗi sửa văn bản: {str(e)}")
        raise e

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
    - Dựa vào YÊU CẦU BÀI HỌC của người dùng, bạn PHẢI tự tư duy và soạn thảo toàn bộ nội dung giáo án một cách chi tiết, xuất sắc.
    - Bạn hãy tìm tất cả các đoạn văn có chứa thẻ biến (như {{{{ kien_thuc }}}}, {{{{ hd1_muc_tieu }}}}, {{{{ hd2_noi_dung }}}}...) hoặc các câu hướng dẫn (như "Nêu cụ thể...").
    - BẠN BẮT BUỘC PHẢI THAY THẾ TOÀN BỘ các thẻ này bằng nội dung bài giảng thực tế do bạn soạn ra. TUYỆT ĐỐI KHÔNG ĐƯỢC BỎ QUA BẤT KỲ THẺ NÀO.
    
    PHẦN 2: ĐIỀN THÔNG TIN HÀNH CHÍNH
    - Người dùng có cung cấp sẵn các thông tin hành chính sau:
      {json.dumps(meta_data, ensure_ascii=False)}
    - Hãy tìm các đoạn văn chứa thẻ như {{{{ ten_truong }}}}, {{{{ ten_bai_day }}}}... và thay thế bằng dữ liệu tương ứng ở trên.
    
    ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (JSON):
    - Key: Là mã ID của đoạn văn (ví dụ: "p_1", "t_0_1_2").
    - Value: Là nội dung text MỚI mà bạn muốn đè lên đoạn văn đó.
    - Bạn phải trả về một JSON chứa ÍT NHẤT 20-30 keys, bao gồm cả phần hành chính VÀ TOÀN BỘ phần nội dung giáo án (Hoạt động 1, 2, 3, 4...).
    
    Ví dụ:
    {{
      "p_4": "TÊN BÀI DẠY: Lực ma sát",
      "p_8": "1. Kiến thức: Học sinh phát biểu được định luật...",
      "p_15": "- Mục tiêu: Tạo hứng thú cho học sinh vào bài mới..."
    }}
    
    --- DANH SÁCH CÁC ĐOẠN VĂN GỐC TỪ FILE WORD ---
    {elements_json}
    """
    
    logger.info(f"[ai_service] Chuẩn bị gửi yêu cầu tới LLM (gpt-4o). Chủ đề: {prompt}")
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
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

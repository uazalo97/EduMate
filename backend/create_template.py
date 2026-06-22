from docx import Document

def create_template():
    # Mở file docx đã được convert
    doc = Document(r"C:\Users\canhph\Documents\testdocx\backend\temp\Phu_luc_4_Mau_Ke_hoach_bai_day.docx")

    replacements = {
        "Nêu cụ thể nội dung kiến thức": "{{ kien_thuc }}",
        "Nêu cụ thể yêu cầu học sinh làm được gì": "{{ nang_luc }}",
        "Nêu cụ thể yêu cầu về hành vi, thái độ": "{{ pham_chat }}",
        "Nêu cụ thể các thiết bị dạy học và học liệu": "{{ thiet_bi_day_hoc }}",
        "Nêu mục tiêu giúp học sinh xác định được vấn đề/nhiệm vụ": "{{ hd1_muc_tieu }}",
        "Nêu rõ nội dung yêu cầu/nhiệm vụ cụ thể mà học sinh phải thực hiện": "{{ hd1_noi_dung }}",
        "Trình bày cụ thể yêu cầu về nội dung và hình thức của sản phẩm": "{{ hd1_san_pham }}",
        "Trình bày cụ thể các bước tổ chức hoạt động": "{{ hd1_to_chuc }}",
        "Nêu mục tiêu giúp học sinh thực hiện nhiệm vụ học tập để chiếm lĩnh": "{{ hd2_muc_tieu }}",
        "Nêu rõ nội dung yêu cầu/nhiệm vụ cụ thể của học sinh làm việc": "{{ hd2_noi_dung }}",
        "Trình bày cụ thể về kiến thức mới/kết quả giải quyết vấn đề": "{{ hd2_san_pham }}",
        "Hướng dẫn, hỗ trợ, kiểm tra, đánh giá": "{{ hd2_to_chuc }}",
        "Nêu rõ mục tiêu vận dụng kiến thức đã học": "{{ hd3_muc_tieu }}",
        "Nêu rõ nội dung cụ thể của hệ thống câu hỏi, bài tập": "{{ hd3_noi_dung }}",
        "Đáp án, lời giải của các câu hỏi": "{{ hd3_san_pham }}",
        "Nêu rõ cách thức giao nhiệm vụ cho học sinh": "{{ hd3_to_chuc }}",
        "Nêu rõ mục tiêu phát triển năng lực của học sinh": "{{ hd4_muc_tieu }}",
        "Mô tả rõ yêu cầu học sinh phát hiện/đề xuất": "{{ hd4_noi_dung }}",
        "Nêu rõ yêu cầu về nội dung và hình thức báo cáo": "{{ hd4_san_pham }}",
        "Giao cho học sinh thực hiện ngoài giờ học trên lớp": "{{ hd4_to_chuc }}"
    }

    for p in doc.paragraphs:
        if "Trường:" in p.text: 
            p.text = "Trường: {{ truong }}"
        elif "Tổ:" in p.text: 
            p.text = "Tổ: {{ to_chuyen_mon }}"
        elif "Họ và tên giáo viên:" in p.text: 
            p.text = "Họ và tên giáo viên: {{ giao_vien }}"
        elif "TÊN BÀI DẠY:" in p.text: 
            p.text = "TÊN BÀI DẠY: {{ ten_bai_day }}"
        elif "Môn học/Hoạt động giáo dục:" in p.text: 
            p.text = "Môn học/Hoạt động giáo dục: {{ mon_hoc }}; Lớp: {{ lop }}"
        elif "Thời gian thực hiện:" in p.text: 
            p.text = "Thời gian thực hiện: {{ so_tiet }} tiết"
        elif "……………………" in p.text: 
            p.text = ""
        
        for k, v in replacements.items():
            if k in p.text:
                p.text = v

    # Lưu lại thành file template chuẩn
    doc.save(r"C:\Users\canhph\Documents\testdocx\Template_5512_San_Sang.docx")
    print("Tạo template thành công!")

if __name__ == "__main__":
    create_template()

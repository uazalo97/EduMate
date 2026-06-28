import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ChevronDown, BookOpen, FileText, Presentation, PlayCircle, Video, Book, HelpCircle, Users, Sun, Moon, MessageCircle } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import './landing-page.css';

function LandingPage({ isDark, setIsDark }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-container">
      {/* Premium Header */}
      <header className="landing-header">
        <div className="landing-brand">
          <img src="/logo.svg" alt="EduMate Logo" />
        </div>
        
        <nav className="landing-nav">
          <div className="nav-item-container">
            <a href="#features" className="landing-nav-link">Tính năng <ChevronDown size={14} style={{marginLeft: '2px', verticalAlign: 'middle', display: 'inline-block'}}/></a>
            <div className="nav-dropdown glass-dropdown">
              <NavLink to="/lesson-plan" className="dropdown-item">
                <BookOpen size={18} /> Soạn giáo án AI
              </NavLink>
              <NavLink to="/exam" className="dropdown-item">
                <FileText size={18} /> Tạo đề thi tự động
              </NavLink>
              <NavLink to="/slide" className="dropdown-item">
                <Presentation size={18} /> Thiết kế Slide bài giảng
              </NavLink>
              <NavLink to="/simulation" className="dropdown-item">
                <PlayCircle size={18} /> Mô phỏng bài học
              </NavLink>
            </div>
          </div>

          <a href="#pricing" className="landing-nav-link">Bảng giá</a>
          
          <div className="nav-item-container">
            <a href="#guide" className="landing-nav-link">Hướng dẫn <ChevronDown size={14} style={{marginLeft: '2px', verticalAlign: 'middle', display: 'inline-block'}}/></a>
            <div className="nav-dropdown glass-dropdown">
              <a href="#" className="dropdown-item">
                <Video size={18} /> Video hướng dẫn
              </a>
              <a href="#" className="dropdown-item">
                <Book size={18} /> Tài liệu sử dụng
              </a>
              <a href="#" className="dropdown-item">
                <HelpCircle size={18} /> Câu hỏi thường gặp
              </a>
              <a href="#" className="dropdown-item">
                <Users size={18} /> Cộng đồng giáo viên
              </a>
            </div>
          </div>

          <a href="#contact" className="landing-nav-link">Liên hệ</a>
        </nav>
        
        <div className="landing-actions">
          {user ? (
            <NavLink to="/lesson-plan" className="btn-trial" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} /> Truy cập Ứng dụng
            </NavLink>
          ) : (
            <>
              <NavLink to="/signin" className="btn-login">Đăng nhập</NavLink>
              <NavLink to="/signin" className="btn-trial">
                Trải nghiệm miễn phí
              </NavLink>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="landing-hero">
        <div className="hero-badge">
          <Sparkles size={16} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '6px' }} />
          Trợ lý AI số 1 dành cho Giáo viên
        </div>
        
        <h1>
          Thiết kế bài giảng thông minh cùng <span style={{display: 'inline-block'}}><span className="brand-edu">Edu</span><span className="brand-mate">Mate</span></span>
        </h1>
        
        <p>
          <span className="brand-edu" style={{fontWeight: 600}}>Edu</span><span className="brand-mate" style={{fontWeight: 600}}>Mate</span> tự động hóa toàn bộ quy trình thiết kế giáo án chuẩn công văn 5512, tạo đề thi, thiết kế slide và mô phỏng bài học. Giải phóng hàng giờ làm việc mỗi tuần cho giáo viên.
        </p>
        
        <div className="hero-actions">
          <NavLink to={user ? "/lesson-plan" : "/signin"} className="btn-hero-primary">
            {user ? "Bắt đầu thiết kế giáo án" : "Bắt đầu miễn phí ngay"}
          </NavLink>
          <a href="#features" className="btn-hero-secondary">
            Tìm hiểu thêm
          </a>
        </div>

        {/* Scroll Indicator */}
        <div className={`scroll-indicator ${isScrolled ? 'fade-out' : ''}`}>
          <a href="#features" aria-label="Cuộn xuống để xem tính năng">
            <ChevronDown size={32} />
          </a>
        </div>
      </main>

      {/* Features Timeline Section */}
      <section id="features" className="features-section">
        <motion.div 
          className="features-header"
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="hero-badge">Tính năng cốt lõi</div>
          <h2 className="section-title">Khám phá sức mạnh của <span className="brand-edu">Edu</span><span className="brand-mate">Mate</span></h2>
          <p className="section-subtitle">Hệ sinh thái công cụ toàn diện giúp tối ưu hóa 100% quy trình giảng dạy của bạn.</p>
        </motion.div>

        <div className="timeline-container">
          {/* Feature 1 */}
          <motion.div 
            className="timeline-item"
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-text">
                <h3>Soạn giáo án AI</h3>
                <p>Tự động sinh giáo án chi tiết theo đúng cấu trúc chuẩn công văn 5512 của Bộ GD&ĐT. Tùy biến mọi nội dung chỉ bằng các câu lệnh trò chuyện đơn giản.</p>
                <ul className="feature-list">
                  <li><Sparkles size={16} /> Tiết kiệm 80% thời gian soạn bài</li>
                  <li><Sparkles size={16} /> Gợi ý hoạt động học tập sáng tạo</li>
                  <li><Sparkles size={16} /> Tự động canh lề, định dạng chuẩn</li>
                </ul>
              </div>
              <div className="timeline-image">
                <img src="/images/feature_lesson_plan.png" alt="Soạn giáo án AI" />
              </div>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div 
            className="timeline-item"
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-text">
                <h3>Tạo đề thi tự động</h3>
                <p>Hệ thống tự động trích xuất kiến thức từ văn bản, sách giáo khoa để tạo ra ma trận đề thi trắc nghiệm và tự luận với độ khó tùy chỉnh.</p>
                <ul className="feature-list">
                  <li><Sparkles size={16} /> Hỗ trợ trộn đề ngẫu nhiên</li>
                  <li><Sparkles size={16} /> Tự động tạo đáp án và lời giải chi tiết</li>
                  <li><Sparkles size={16} /> Xuất ra định dạng PDF, Word sẵn sàng in ấn</li>
                </ul>
              </div>
              <div className="timeline-image">
                <img src="/images/feature_exam.png" alt="Tạo đề thi tự động" />
              </div>
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div 
            className="timeline-item"
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-text">
                <h3>Thiết kế Slide bài giảng</h3>
                <p>Biến nội dung giáo án dài ngoằng thành các bản thuyết trình Slide trực quan, đẹp mắt và thu hút sự tập trung của học sinh chỉ trong nháy mắt.</p>
                <ul className="feature-list">
                  <li><Sparkles size={16} /> Kho giao diện (Template) phong phú</li>
                  <li><Sparkles size={16} /> Tự động tóm tắt ý chính</li>
                  <li><Sparkles size={16} /> Chèn hình ảnh minh họa thông minh</li>
                </ul>
              </div>
              <div className="timeline-image">
                <img src="/images/feature_slide.png" alt="Thiết kế Slide bài giảng" />
              </div>
            </div>
          </motion.div>

          {/* Feature 4 */}
          <motion.div 
            className="timeline-item"
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-text">
                <h3>Mô phỏng bài học 3D</h3>
                <p>Mang cả phòng thí nghiệm vật lý, hóa học, hay hệ mặt trời vào trong lớp học của bạn với công nghệ mô phỏng tương tác thời gian thực.</p>
                <ul className="feature-list">
                  <li><Sparkles size={16} /> Hình ảnh 3D chân thực, trực quan</li>
                  <li><Sparkles size={16} /> Tương tác thay đổi thông số trực tiếp</li>
                  <li><Sparkles size={16} /> Tăng cường khả năng ghi nhớ cho học sinh</li>
                </ul>
              </div>
              <div className="timeline-image">
                <img src="/images/feature_simulation.png" alt="Mô phỏng bài học" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Floating Theme Toggle */}
      <button 
        className="floating-theme-toggle" 
        onClick={() => setIsDark(!isDark)}
        title={isDark ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
      >
        {isDark ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      {/* Floating Zalo Chat */}
      <a 
        href="https://zalo.me/0123456789" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="floating-chat-btn"
        title="Chat với chúng tôi qua Zalo"
      >
        <MessageCircle size={28} />
      </a>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} <span className="brand-edu">Edu</span><span className="brand-mate">Mate</span>. Đã đăng ký bản quyền.</p>
      </footer>
    </div>
  );
}

export default LandingPage;

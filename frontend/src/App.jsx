import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Upload, FileText, Sparkles, Download, CheckCircle, Loader2, BookOpen, User, Sun, Moon, Settings, Globe, HelpCircle, ArrowUpCircle, Info, LogOut, Presentation, ClipboardList, PlayCircle, ChevronDown, Check, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import './index.css';
import './document-preview.css';
import LandingPage from './LandingPage.jsx';
import curriculumData from './data/curriculumData.json';
import * as docx from "docx-preview";

function CustomSelect({ value, onChange, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="custom-select-container" ref={containerRef}>
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''} ${!value ? 'placeholder' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={18} className="custom-select-icon" />
      </div>
      
      {isOpen && (
        <div className="custom-select-dropdown">
          {options.map((option, idx) => (
            <div 
              key={idx}
              className={`custom-select-option ${value === option.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span>{option.label}</span>
              {value === option.value && <Check size={16} className="check-icon" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LessonPlanTool() {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [useStandardTemplate, setUseStandardTemplate] = useState(true);
  
  // Meta data fields
  const [truong, setTruong] = useState('');
  const [to, setTo] = useState('');
  const [giaoVien, setGiaoVien] = useState('');
  const [lop, setLop] = useState('');
  const [monHoc, setMonHoc] = useState('');
  const [tenBaiDay, setTenBaiDay] = useState('');
  const [soTiet, setSoTiet] = useState('');
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);

  useEffect(() => {
    setTenBaiDay('');
  }, [lop, monHoc]);

  const lopOptions = [...Array(12)].map((_, i) => ({ value: `Lớp ${i+1}`, label: `Lớp ${i+1}` }));
  
  const genericMonHocOptions = [
    "Toán học", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học", 
    "Khoa học tự nhiên", "Lịch sử", "Địa lý", "Lịch sử & Địa lý", 
    "GDCD / KTPL", "Tin học", "Công nghệ", "Thể dục / GDTC", 
    "Nghệ thuật", "Hoạt động trải nghiệm"
  ].map(m => ({ value: m, label: m }));

  const availableSubjects = curriculumData[lop] ? Object.keys(curriculumData[lop]) : [];
  const currentMonHocOptions = availableSubjects.length > 0 
    ? availableSubjects.map(m => ({ value: m, label: m }))
    : genericMonHocOptions;

  const soTietOptions = [
    { value: "35 phút", label: "35 phút" },
    { value: "40 phút", label: "40 phút" },
    { value: "45 phút", label: "45 phút" },
    { value: "90 phút", label: "90 phút (2 tiết)" },
    { value: "135 phút", label: "135 phút (3 tiết)" }
  ];

  const [isGenerating, setIsGenerating] = useState(false);
  const [resultBlobUrl, setResultBlobUrl] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    if (resultBlob && previewRef.current) {
      docx.renderAsync(resultBlob, previewRef.current, null, {
        className: 'docx-preview-rendered',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        ignoreLastRenderedPageBreak: true,
        experimental: false,
        trimXmlDeclaration: true,
        debug: false,
      }).catch(err => console.error("docx-preview error:", err));
    }
  }, [resultBlob]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && (selected.name.endsWith('.doc') || selected.name.endsWith('.docx'))) {
      setFile(selected);
      setError('');
    } else {
      setError('Vui lòng chọn file định dạng .doc hoặc .docx');
      setFile(null);
    }
  };

  const handleGenerate = async () => {
    if ((!useStandardTemplate && !file) || !prompt) {
      setError('Vui lòng cung cấp đủ template và yêu cầu bài học');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResultBlobUrl(null);

    const formData = new FormData();
    if (!useStandardTemplate && file) {
      formData.append('template_file', file);
    }
    formData.append('use_standard_template', useStandardTemplate);
    formData.append('prompt', prompt);
    formData.append('truong', truong);
    formData.append('to_chuyen_mon', to);
    formData.append('giao_vien', giaoVien);
    formData.append('lop', lop);
    formData.append('mon_hoc', monHoc);
    formData.append('ten_bai_day', tenBaiDay);
    formData.append('so_tiet', soTiet);

    try {
      const response = await axios.post('http://localhost:8000/api/generate', formData, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = window.URL.createObjectURL(blob);
      setResultBlob(blob);
      setResultBlobUrl(url);
      setIsConfigCollapsed(true);
    } catch (err) {
      console.error(err);
      setError('Đã xảy ra lỗi trong quá trình xử lý. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Soạn Kế hoạch bài dạy</h1>
        <p>Sinh tự động nội dung theo mẫu chuẩn Công văn 5512.</p>
      </div>
      
      <div className="tool-grid" style={{ gridTemplateColumns: '1fr' }}>
        {/* Input Configuration */}
        <div className="glass-panel" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', padding: isConfigCollapsed ? '1rem 1.5rem' : '1.5rem' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => setIsConfigCollapsed(!isConfigCollapsed)}
          >
            <h2 style={{ marginBottom: 0 }}><FileText size={24} color="var(--primary-color)" /> Cấu hình Giáo án</h2>
            <ChevronDown size={24} style={{ transform: isConfigCollapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.3s' }} color="var(--text-secondary)" />
          </div>
          
          {!isConfigCollapsed && (
            <div style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
            <label>1. Lựa chọn Mẫu Giáo án</label>
            <div className="radio-group">
              <label className="radio-label">
                <input 
                  type="radio" 
                  checked={useStandardTemplate} 
                  onChange={() => { setUseStandardTemplate(true); setError(''); }} 
                />
                Dùng Mẫu Chuẩn (Bộ GD&ĐT)
              </label>
              <label className="radio-label">
                <input 
                  type="radio" 
                  checked={!useStandardTemplate} 
                  onChange={() => setUseStandardTemplate(false)} 
                />
                Tải lên mẫu của tôi
              </label>
            </div>

            {!useStandardTemplate && (
              <div 
                className={`upload-area ${file ? 'active' : ''}`}
                onClick={() => fileInputRef.current.click()}
              >
                <Upload size={32} className="upload-icon" />
                {file ? (
                  <div className="file-info">
                    <FileText size={20} />
                    <span>{file.name}</span>
                  </div>
                ) : (
                  <p>Kéo thả hoặc click để chọn file mẫu (.doc, .docx)</p>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".doc,.docx" 
                  style={{ display: 'none' }} 
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>2. Thông tin cơ bản <span style={{color: 'var(--error-color)'}}>*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <input type="text" placeholder="Tên trường (*)" value={truong} onChange={e => setTruong(e.target.value)} />
              </div>
              <div>
                <input type="text" placeholder="Tổ chuyên môn (*)" value={to} onChange={e => setTo(e.target.value)} />
              </div>
              <div>
                <input type="text" placeholder="Tên giáo viên (*)" value={giaoVien} onChange={e => setGiaoVien(e.target.value)} />
              </div>
              <div>
                <CustomSelect value={soTiet} onChange={setSoTiet} options={soTietOptions} placeholder="Thời lượng (*)" />
              </div>
              <div>
                <CustomSelect value={lop} onChange={setLop} options={lopOptions} placeholder="Chọn Lớp (*)" />
              </div>
              
              {lop && (
                <div>
                  <CustomSelect value={monHoc} onChange={setMonHoc} options={currentMonHocOptions} placeholder="Chọn Môn học (*)" />
                </div>
              )}
              
              {monHoc && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <input type="text" placeholder="Tên bài dạy (*)" value={tenBaiDay} onChange={e => setTenBaiDay(e.target.value)} />
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>3. Yêu cầu chi tiết nội dung bài học <span style={{color: 'var(--error-color)'}}>*</span></label>
            <textarea 
              rows="4" 
              placeholder="Ví dụ: Tạo giáo án cho bài 'Lực ma sát', môn Vật Lý lớp 10... (*)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            ></textarea>
          </div>

          {error && <div style={{ color: 'var(--error-color)', marginBottom: '1rem', fontWeight: 500 }}>{error}</div>}

          <button 
            className="btn-primary" 
            onClick={handleGenerate}
            disabled={isGenerating || (!useStandardTemplate && !file) || !prompt || !truong || !to || !giaoVien || !lop || !monHoc || !tenBaiDay || !soTiet}
          >
            {isGenerating ? (
              <>
                <Loader2 className="loader" size={20} /> Đang tạo giáo án...
              </>
            ) : (
              <>
                <Sparkles size={20} /> Tạo Giáo Án Ngay
              </>
            )}
          </button>
          </div>
          )}
        </div>

        {resultBlobUrl && !isGenerating && (
          <div className="document-preview-container">
            <div className="document-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                <FileText size={20} color="var(--primary-color)" />
                <span>Kế hoạch bài dạy: {tenBaiDay || 'Bài học'}.docx</span>
              </div>
              <a href={resultBlobUrl} download="GiaoAn_HoanThien.docx" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none', padding: '0.5rem 1.25rem', fontSize: '0.9rem', width: 'auto' }}>
                <Download size={18} /> Tải xuống (.docx)
              </a>
            </div>
            
            <div className="document-page" ref={previewRef} style={{ padding: 0, minHeight: '800px', overflowX: 'auto', background: 'var(--body-bg)' }}>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ComingSoon({ title, icon: Icon }) {
  return (
    <>
      <div className="page-header">
        <h1>{title}</h1>
        <p>Tính năng đang trong giai đoạn phát triển.</p>
      </div>
      <div className="coming-soon">
        <Icon className="coming-soon-icon" />
        <h2>Đang phát triển</h2>
        <p>Vui lòng quay lại sau</p>
      </div>
    </>
  );
}

function AppLayout({ isDark, setIsDark }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="brand">
          <img src="/logo.svg" alt="Logo" style={{ maxHeight: '60px', width: 'auto' }} />
          <button className="toggle-sidebar-btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
        
        <nav className="nav-menu">
          <NavLink to="/lesson-plan" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <BookOpen size={20} /> <span>Soạn giáo án</span>
          </NavLink>
          
          <NavLink to="/exam" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileText size={20} /> <span>Tạo đề thi</span>
          </NavLink>
          
          <NavLink to="/slide" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Presentation size={20} /> <span>Tạo slide bài giảng</span>
          </NavLink>

          <NavLink to="/worksheet" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ClipboardList size={20} /> <span>Tạo phiếu bài tập</span>
          </NavLink>

          <NavLink to="/simulation" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <PlayCircle size={20} /> <span>Tạo mô phỏng bài học</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer" ref={accountMenuRef} style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center', position: 'relative' }}>
          
          {/* Account Menu Popup */}
          {isAccountMenuOpen && (
            <div className="account-popup-menu">
              <div className="menu-item">
                <Settings size={18} />
                <span>Settings</span>
              </div>
              <div className="menu-item">
                <Globe size={18} />
                <span>Language</span>
              </div>
              <div className="menu-item">
                <HelpCircle size={18} />
                <span>Get help</span>
              </div>
              <div className="menu-divider"></div>
              <div className="menu-item">
                <ArrowUpCircle size={18} />
                <span>Upgrade plan</span>
              </div>
              <div className="menu-item">
                <Info size={18} />
                <span>Learn more</span>
              </div>
              <div className="menu-divider"></div>
              <div className="menu-item text-danger">
                <LogOut size={18} />
                <span>Log out</span>
              </div>
            </div>
          )}

          <div 
            className="user-profile-btn"
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            style={{ display: isSidebarCollapsed ? 'none' : 'flex' }}
          >
            <div className="user-avatar">C</div>
            <div className="user-info">
              <span className="user-name">Canh</span>
              <span className="user-plan">Free plan</span>
            </div>
          </div>

          <button 
            className="theme-toggle-icon" 
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isRouting, setIsRouting] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.body.classList.add('disable-transitions');
    
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
    
    // Force reflow
    window.getComputedStyle(document.body).getPropertyValue('opacity');
    
    const timeout = setTimeout(() => {
      document.body.classList.remove('disable-transitions');
    }, 50);
    
    return () => clearTimeout(timeout);
  }, [isDark]);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      const isFromAppToApp = location.pathname !== '/' && displayLocation.pathname !== '/';

      if (isFromAppToApp) {
        setDisplayLocation(location);
      } else {
        setIsRouting(true);
        const timer = setTimeout(() => {
          setDisplayLocation(location);
          setIsRouting(false);
        }, 800); // Wait 800ms to show the loading star
        return () => clearTimeout(timer);
      }
    }
  }, [location, displayLocation.pathname]);

  return (
    <>
      <AnimatePresence>
        {isRouting && (
          <motion.div
            className="global-loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            >
              <Sparkles size={48} className="loading-star" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Routes location={displayLocation}>
        <Route path="/" element={<LandingPage isDark={isDark} setIsDark={setIsDark} />} />
        <Route element={<AppLayout isDark={isDark} setIsDark={setIsDark} />}>
          <Route path="/lesson-plan" element={<LessonPlanTool />} />
          <Route path="/exam" element={<ComingSoon title="Tạo đề thi" icon={FileText} />} />
          <Route path="/slide" element={<ComingSoon title="Tạo slide bài giảng" icon={Presentation} />} />
          <Route path="/worksheet" element={<ComingSoon title="Tạo phiếu bài tập" icon={ClipboardList} />} />
          <Route path="/simulation" element={<ComingSoon title="Tạo mô phỏng bài học" icon={PlayCircle} />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;

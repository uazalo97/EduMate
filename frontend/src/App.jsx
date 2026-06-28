import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import { ToolStateProvider, useToolState } from './contexts/ToolStateContext';
import LoginPage from './components/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import { Upload, FileText, Sparkles, Download, CheckCircle, Loader2, BookOpen, User, Sun, Moon, Settings, Globe, HelpCircle, ArrowUpCircle, Info, LogOut, Presentation, ClipboardList, PlayCircle, ChevronDown, Check, PanelLeftClose, PanelLeftOpen, Edit2, ArrowLeft, Eye, Send, X } from 'lucide-react';
import './index.css';
import './document-preview.css';
import LandingPage from './LandingPage.jsx';
import TemplateSelection from './components/TemplateSelection.jsx';
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
  const { lessonPlanState, updateLessonPlanState } = useToolState();

  // Destructure for easy access
  const { 
    step, selectedTemplateId, prompt, truong, to, giaoVien, lop, monHoc, tenBaiDay, soTiet, isConfigCollapsed,
    resultBlobUrl, resultBlob, selectionData, inlineEditMode, editPrompt, isEditingDocument,
    manualEditText
  } = lessonPlanState;

  // Setter helpers
  const setStep = (val) => updateLessonPlanState({ step: val });
  const setSelectedTemplateId = (val) => updateLessonPlanState({ selectedTemplateId: val });
  const setPrompt = (val) => updateLessonPlanState({ prompt: val });
  const setTruong = (val) => updateLessonPlanState({ truong: val });
  const setTo = (val) => updateLessonPlanState({ to: val });
  const setGiaoVien = (val) => updateLessonPlanState({ giaoVien: val });
  const setLop = (val) => updateLessonPlanState({ lop: val });
  const setMonHoc = (val) => updateLessonPlanState({ monHoc: val });
  const setTenBaiDay = (val) => updateLessonPlanState({ tenBaiDay: val });
  const setSoTiet = (val) => updateLessonPlanState({ soTiet: val });
  const setIsConfigCollapsed = (val) => updateLessonPlanState({ isConfigCollapsed: val });
  const setResultBlobUrl = (val) => updateLessonPlanState({ resultBlobUrl: val });
  const setResultBlob = (val) => updateLessonPlanState({ resultBlob: val });
  const setSelectionData = (val) => updateLessonPlanState({ selectionData: val });
  const setInlineEditMode = (val) => updateLessonPlanState({ inlineEditMode: val });
  const setEditPrompt = (val) => updateLessonPlanState({ editPrompt: val });
  const setIsEditingDocument = (val) => updateLessonPlanState({ isEditingDocument: val });
  const setManualEditText = (val) => updateLessonPlanState({ manualEditText: val });

  const prevDeps = useRef({ lop, monHoc });
  useEffect(() => {
    if (prevDeps.current.lop !== lop || prevDeps.current.monHoc !== monHoc) {
      setTenBaiDay('');
      prevDeps.current = { lop, monHoc };
    }
  }, [lop, monHoc]);

  const lopOptions = [...Array(12)].map((_, i) => ({ value: `${i+1}`, label: `Lớp ${i+1}` }));
  
  const genericMonHocOptions = [
    "Toán học", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học", 
    "Khoa học tự nhiên", "Lịch sử", "Địa lý", "Lịch sử & Địa lý", 
    "GDCD / KTPL", "Tin học", "Công nghệ", "Thể dục / GDTC", 
    "Nghệ thuật", "Hoạt động trải nghiệm"
  ].map(m => ({ value: m, label: m }));

  const lopKey = lop ? `Lớp ${lop}` : '';
  const availableSubjects = curriculumData[lopKey] ? Object.keys(curriculumData[lopKey]) : [];
  const currentMonHocOptions = availableSubjects.length > 0 
    ? availableSubjects.map(m => ({ value: m, label: m }))
    : genericMonHocOptions;

  const soTietOptions = [
    { value: "1", label: "1 tiết" },
    { value: "2", label: "2 tiết" },
    { value: "3", label: "3 tiết" }
  ];

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'info') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ visible: true, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4000);
  };

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const templatePreviewRef = useRef(null);

  const handlePreviewTemplate = async () => {
    if (!selectedTemplateId) return;
    setIsPreviewModalOpen(true);
    setIsPreviewLoading(true);
    try {
      const response = await axios.get(`/api/templates/${selectedTemplateId}/download?t=${Date.now()}`, {
        responseType: 'blob',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      const blob = new Blob([response.data]);
      setTimeout(() => {
        if (templatePreviewRef.current) {
          docx.renderAsync(blob, templatePreviewRef.current, null, {
            className: 'docx-preview-rendered',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: true,
            experimental: false,
            trimXmlDeclaration: true,
            useBase64URL: false,
          });
        }
      }, 100);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải bản xem trước.', 'error');
    } finally {
      setIsPreviewLoading(false);
    }
  };

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

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      if (text && previewRef.current && previewRef.current.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        let node = selection.anchorNode;
        while (node && node.nodeName !== 'P' && node.nodeName !== 'DIV' && node.nodeName !== 'TD') {
          node = node.parentNode;
        }
        const paragraphText = node ? node.innerText || node.textContent : text;
        
        // Capture all rects for visual highlighting
        const rects = Array.from(range.getClientRects()).map(r => ({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height
        }));

        setSelectionData({
          text,
          paragraphText: paragraphText.trim(),
          originalHtml: node ? node.innerHTML : '',
          top: rect.top - 10,
          left: rect.left + rect.width / 2,
          node: node,
          rects: rects
        });
      } else {
        if (!inlineEditMode) {
          setSelectionData(null);
        }
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [inlineEditMode]);

  const handleEditDocument = async () => {
    if (!selectionData || !editPrompt || !resultBlob) return;
    
    setIsEditingDocument(true);
    const formData = new FormData();
    formData.append('file', resultBlob, 'document.docx');
    formData.append('selected_text', selectionData.text);
    formData.append('paragraph_text', selectionData.paragraphText);
    formData.append('prompt', editPrompt);

    try {
      const response = await axios.post('/api/edit-document', formData, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = window.URL.createObjectURL(blob);
      setResultBlob(blob);
      setResultBlobUrl(url);
      
      setInlineEditMode(null);
      setSelectionData(null);
      setEditPrompt('');
    } catch (err) {
      console.error(err);
      showToast('Đã xảy ra lỗi khi sửa văn bản bằng AI. Vui lòng thử lại.', 'error');
    } finally {
      setIsEditingDocument(false);
    }
  };

  const extractTextWithFormatting = (node) => {
    let text = '';
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.tagName === 'BR') {
          text += '\n';
        } else if (child.tagName === 'DIV' || child.tagName === 'P') {
          // Add newline if it's a block element and not the first child
          const childText = extractTextWithFormatting(child);
          text += (text.length > 0 ? '\n' : '') + childText;
        } else if (child.style && child.style.display === 'inline-block' && child.style.width && !child.textContent) {
          // This is how docx-preview renders tabs
          text += '\t';
        } else {
          text += extractTextWithFormatting(child);
        }
      }
    }
    return text;
  };

  const handleManualEditDocument = async () => {
    if (!selectionData || !resultBlob || !selectionData.node) return;
    
    // Extract text preserving formatting (tabs, newlines)
    const newText = extractTextWithFormatting(selectionData.node);
    if (!newText.trim()) return;

    setIsEditingDocument(true);
    const formData = new FormData();
    formData.append('file', resultBlob, 'document.docx');
    formData.append('paragraph_text', selectionData.paragraphText);
    formData.append('new_paragraph_text', newText.trim());

    try {
      const response = await axios.post('/api/edit-document-manual', formData, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = window.URL.createObjectURL(blob);
      setResultBlob(blob);
      setResultBlobUrl(url);
      
      // Cleanup contentEditable
      if (selectionData && selectionData.node) {
        selectionData.node.contentEditable = 'false';
        selectionData.node.style.outline = 'none';
      }
      
      setInlineEditMode(null);
      setSelectionData(null);
      setManualEditText('');
    } catch (err) {
      console.error(err);
      showToast('Đã xảy ra lỗi khi sửa văn bản thủ công. Vui lòng thử lại.', 'error');
    } finally {
      setIsEditingDocument(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Vui lòng cung cấp yêu cầu bài học');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResultBlobUrl(null);

    const formData = new FormData();
    formData.append('template_id', selectedTemplateId);
    formData.append('prompt', prompt);
    formData.append('truong', truong);
    formData.append('to_chuyen_mon', to);
    formData.append('giao_vien', giaoVien);
    formData.append('lop', lop);
    formData.append('mon_hoc', monHoc);
    formData.append('ten_bai_day', tenBaiDay);
    formData.append('so_tiet', soTiet);

    try {
      const response = await axios.post('/api/generate', formData, {
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

  if (step === 'SELECT_TEMPLATE') {
    return (
      <TemplateSelection 
        onSelectTemplate={(template) => {
          setSelectedTemplateId(template.id);
          updateLessonPlanState({ selectedTemplateName: template.name });
          setStep('WORKSPACE');
        }} 
      />
    );
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button 
          onClick={() => setStep('SELECT_TEMPLATE')} 
          style={{ 
            background: 'var(--surface-color)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '8px', 
            padding: '0.4rem 0.8rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary-color)'; e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.background = '#fff5f2'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--surface-color)'; }}
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
        <div>
          <h1 style={{ margin: 0, marginBottom: '0.25rem' }}>Soạn Kế hoạch bài dạy</h1>
          <p style={{ margin: 0 }}>Sinh tự động nội dung theo mẫu bạn đã chọn.</p>
        </div>
      </div>
      
      <div style={{ maxWidth: (resultBlobUrl && !isGenerating) ? '1600px' : '1000px', margin: '0 auto', width: '100%', padding: '1rem 1.5rem', transition: 'max-width 0.4s ease' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: (resultBlobUrl && !isGenerating) ? '380px minmax(0, 1fr)' : '1fr', 
          gap: '1.5rem',
          alignItems: 'start'
        }}>
          {/* LEFT COLUMN */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem',
            position: (resultBlobUrl && !isGenerating) ? 'sticky' : 'static',
            top: '100px',
            maxHeight: (resultBlobUrl && !isGenerating) ? 'calc(100vh - 120px)' : 'none',
            overflowY: (resultBlobUrl && !isGenerating) ? 'auto' : 'visible',
            paddingBottom: (resultBlobUrl && !isGenerating) ? '1rem' : '0'
          }}>
            {/* Selected Template Banner */}
            <div className="glass-panel" style={{ flexShrink: 0, minHeight: '68px', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: 'var(--surface-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', flex: 1, minWidth: 0 }}>
                <FileText size={20} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '0.1rem', flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1, userSelect: 'none' }}>Mẫu giáo án đã chọn:</span>
                  <span style={{ display: 'block', width: '100%', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', userSelect: 'none' }} title={lessonPlanState.selectedTemplateName || "Mẫu mặc định"}>
                    {lessonPlanState.selectedTemplateName || "Mẫu mặc định"}
                  </span>
                </div>
              </div>
              <button 
                onClick={handlePreviewTemplate}
                className="btn-outline"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}
              >
                <Eye size={16} /> Xem mẫu
              </button>
            </div>

            {/* Input Configuration */}
            <div className="glass-panel" style={{ 
              width: '100%', 
              flexShrink: 0,
              minHeight: '68px',
              padding: isConfigCollapsed ? '1rem 1.5rem' : '1.5rem',
              justifyContent: isConfigCollapsed ? 'center' : 'flex-start'
            }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => setIsConfigCollapsed(!isConfigCollapsed)}
          >
            <h2 style={{ marginBottom: 0, fontSize: '1rem', fontWeight: 600, gap: '0.75rem' }}><Settings size={20} color="var(--primary-color)" /> Cấu hình Giáo án</h2>
            <ChevronDown size={20} style={{ transform: isConfigCollapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.3s' }} color="var(--text-secondary)" />
          </div>
          
          {!isConfigCollapsed && (
            <div style={{ marginTop: '1.5rem' }}>
          <div className="form-group">
            <label>1. Thông tin cơ bản <span style={{color: 'var(--error-color)'}}>*</span></label>
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
            <label>2. Yêu cầu chi tiết nội dung bài học <span style={{color: 'var(--error-color)'}}>*</span></label>
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
            disabled={isGenerating || !selectedTemplateId || !prompt || !truong || !to || !giaoVien || !lop || !monHoc || !tenBaiDay || !soTiet}
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
          </div>

        {resultBlobUrl && !isGenerating && (
          <div className="document-preview-container" style={{ margin: 0, width: '100%', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
            <div className="document-toolbar" style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                <FileText size={20} color="var(--primary-color)" />
                <span>Kế hoạch bài dạy: {tenBaiDay || 'Bài học'}.docx</span>
              </div>
              <a href={resultBlobUrl} download="GiaoAn_HoanThien.docx" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none', padding: '0.5rem 1.25rem', fontSize: '0.9rem', width: 'auto' }}>
                <Download size={18} /> Tải xuống (.docx)
              </a>
            </div>
            
            <div className="document-page" ref={previewRef} style={{ padding: 0, flex: 1, overflow: 'auto', background: 'var(--body-bg)' }}>
            </div>
          </div>
        )}
        </div>
      </div>

      {selectionData && selectionData.rects && inlineEditMode && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999 }}>
          {selectionData.rects.map((r, i) => (
            <div 
              key={i}
              style={{
                position: 'absolute',
                top: r.top,
                left: r.left,
                width: r.width,
                height: r.height,
                backgroundColor: 'rgba(255, 138, 76, 0.3)',
                borderRadius: '2px'
              }}
            />
          ))}
        </div>
      )}

      {selectionData && (
        <div 
          className="floating-toolbar"
          style={{ position: 'fixed', top: selectionData.top, left: selectionData.left, transform: 'translate(-50%, -100%)', display: 'flex', gap: '8px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', padding: '8px 12px', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 1000, border: '1px solid rgba(0,0,0,0.08)', alignItems: 'center', whiteSpace: 'nowrap', transition: 'all 0.2s ease-out' }}
          onMouseDown={(e) => {
            // Prevent text selection from clearing
            if (e.target.tagName !== 'INPUT') {
              e.preventDefault();
            }
            e.stopPropagation();
          }}
        >
          {!inlineEditMode && (
            <>
              <button 
                className="ai-floating-btn" 
                style={{ position: 'static', margin: 0 }}
                onClick={() => {
                  if (selectionData.text.includes('\n')) {
                    showToast('Vui lòng chỉ bôi đen và sửa từng đoạn văn một để đảm bảo cấu trúc tài liệu không bị phá vỡ.', 'warning');
                    return;
                  }
                  setInlineEditMode('ai');
                }}
              >
                <Sparkles size={16} /> Sửa bằng AI
              </button>
              <button 
                className="ai-floating-btn" 
                style={{ position: 'static', margin: 0, background: 'var(--text-secondary)', color: 'white' }}
                onClick={() => {
                  if (selectionData.text.includes('\n')) {
                    showToast('Vui lòng chỉ bôi đen và sửa từng đoạn văn một để đảm bảo cấu trúc tài liệu không bị phá vỡ.', 'warning');
                    return;
                  }
                  setInlineEditMode('manual');
                  if (selectionData && selectionData.node) {
                    selectionData.node.contentEditable = 'true';
                    selectionData.node.style.outline = '2px dashed var(--primary-color)';
                    selectionData.node.style.padding = '4px';
                    selectionData.node.style.borderRadius = '4px';
                    setTimeout(() => selectionData.node.focus(), 0);
                  }
                }}
              >
                <Edit2 size={16} /> Sửa thủ công
              </button>
            </>
          )}

          {inlineEditMode === 'ai' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--primary-color)" />
              <input
                type="text"
                autoFocus
                placeholder="Nhập yêu cầu sửa đổi..."
                value={editPrompt}
                onChange={e => setEditPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && editPrompt.trim() && !isEditingDocument) {
                    handleEditDocument();
                  }
                }}
                style={{
                  border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', width: '250px', color: 'var(--text-primary)'
                }}
                disabled={isEditingDocument}
              />
              <button
                className="icon-btn"
                onClick={handleEditDocument}
                disabled={!editPrompt.trim() || isEditingDocument}
                style={{ background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              >
                {isEditingDocument ? <Loader2 size={14} className="loader" /> : <Send size={14} />}
              </button>
              <button
                className="icon-btn"
                onClick={() => {
                  setInlineEditMode(null);
                  setEditPrompt('');
                }}
                disabled={isEditingDocument}
                style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>
          )}

          {inlineEditMode === 'manual' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginRight: '4px' }}>Chỉnh sửa trực tiếp</span>
              <button 
                className="btn-primary" 
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={handleManualEditDocument}
                disabled={isEditingDocument}
              >
                {isEditingDocument ? <Loader2 size={14} className="loader"/> : <Check size={14} />} Lưu
              </button>
              <button 
                className="btn-outline" 
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                onClick={() => {
                  if (selectionData && selectionData.node) {
                    selectionData.node.contentEditable = 'false';
                    selectionData.node.style.outline = 'none';
                    selectionData.node.style.padding = '0';
                    if (selectionData.originalHtml) {
                      selectionData.node.innerHTML = selectionData.originalHtml; // Revert visually
                    } else {
                      selectionData.node.innerText = selectionData.paragraphText;
                    }
                  }
                  setInlineEditMode(null);
                }}
                disabled={isEditingDocument}
              >
                Hủy
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preview Template Modal */}
      {isPreviewModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }} onClick={() => setIsPreviewModalOpen(false)}>
          <div style={{
            background: 'var(--surface-color)', width: '80%', height: '90%',
            borderRadius: '12px', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={20} color="var(--primary-color)" /> Xem trước Mẫu giáo án
              </h3>
              <button className="icon-btn" onClick={() => setIsPreviewModalOpen(false)}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '1rem', background: '#f5f5f5', position: 'relative' }}>
              {isPreviewLoading && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <Loader2 size={32} className="loader" color="var(--primary-color)" />
                  <span style={{ color: 'var(--text-secondary)' }}>Đang tải bản xem trước...</span>
                </div>
              )}
              <div ref={templatePreviewRef} className="document-page" style={{ margin: '0 auto', minHeight: '100%', opacity: isPreviewLoading ? 0 : 1, transition: 'opacity 0.3s' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div 
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'error' ? '#fee2e2' : toast.type === 'warning' ? '#fef3c7' : '#e0e7ff',
          color: toast.type === 'error' ? '#991b1b' : toast.type === 'warning' ? '#92400e' : '#3730a3',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transform: toast.visible ? 'translateY(0)' : 'translateY(150%)',
          opacity: toast.visible ? 1 : 0,
          transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          zIndex: 9999,
          maxWidth: '400px',
          fontWeight: 500,
          fontSize: '0.9rem'
        }}
      >
        {toast.type === 'error' ? <X size={18} /> : toast.type === 'warning' ? <Info size={18} /> : <CheckCircle size={18} />}
        {toast.message}
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
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const { user, logout } = useAuth();

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
              <div className="menu-item text-danger" onClick={logout}>
                <LogOut size={18} />
                <span>Đăng xuất</span>
              </div>
            </div>
          )}

          <div 
            className="user-profile-btn"
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            style={{ display: isSidebarCollapsed ? 'none' : 'flex' }}
          >
            {user?.picture ? (
              <img src={user.picture} alt="Avatar" className="user-avatar" style={{ border: 'none', padding: 0 }} />
            ) : (
              <div className="user-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
            )}
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
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
    <ToolStateProvider>
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
        <Route path="/signin" element={<LoginPage mode="login" />} />
        <Route path="/register" element={<LoginPage mode="register" />} />
        <Route path="/login" element={<Navigate to="/signin" replace />} />
        
        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout isDark={isDark} setIsDark={setIsDark} />}>
            <Route path="/lesson-plan" element={<LessonPlanTool />} />
            <Route path="/exam" element={<ComingSoon title="Tạo đề thi" icon={FileText} />} />
            <Route path="/slide" element={<ComingSoon title="Tạo slide bài giảng" icon={Presentation} />} />
            <Route path="/worksheet" element={<ComingSoon title="Tạo phiếu bài tập" icon={ClipboardList} />} />
            <Route path="/simulation" element={<ComingSoon title="Tạo mô phỏng bài học" icon={PlayCircle} />} />
          </Route>
        </Route>
      </Routes>
    </ToolStateProvider>
  );
}

export default App;

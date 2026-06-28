import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Upload, FileText, Check, FileCheck, Search, Loader2, Sparkles, Eye, X } from 'lucide-react';
import * as docx from "docx-preview";

function LocalDocxPreview({ file }) {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (file && containerRef.current) {
      setTimeout(() => {
        if (containerRef.current) {
          docx.renderAsync(file, containerRef.current, null, {
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
          }).catch(err => console.error("Local docx-preview error:", err));
        }
      }, 100);
    }
  }, [file]);

  return <div ref={containerRef} className="preview-docx-container" style={{ width: '100%', maxWidth: '800px', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}></div>;
}

function DocxThumbnail({ template }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAndRender = async () => {
      try {
        const response = await axios.get(`/api/templates/${template.id}/download?t=${Date.now()}`, {
          responseType: 'blob',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        const blob = new Blob([response.data]);
        if (isMounted && containerRef.current) {
          await docx.renderAsync(blob, containerRef.current, null, {
            className: 'docx-thumbnail-rendered',
            inWrapper: false,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: false,
            experimental: false,
            trimXmlDeclaration: true,
            debug: false,
          });
        }
      } catch (err) {
        console.error("Thumbnail error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAndRender();
    return () => { isMounted = false; };
  }, [template.id]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#fff' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: '#f8f9fa' }}>
          <Loader2 size={24} className="loader" color="var(--primary-color)" />
        </div>
      )}
      <div style={{ 
        width: '800px', 
        height: '1000px', 
        transform: 'scale(0.35)', 
        transformOrigin: 'top center',
        position: 'absolute',
        left: '50%',
        marginLeft: '-400px',
        pointerEvents: 'none'
      }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0) 40%, rgba(255,255,255,1) 100%)', pointerEvents: 'none' }}></div>
    </div>
  );
}
function TemplateSelection({ onSelectTemplate }) {
  const [templates, setTemplates] = useState({ system: [], user: [] });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('Tất cả');
  const fileInputRef = useRef(null);
  
  const [uploadPreviewModalOpen, setUploadPreviewModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewContainerRef = useRef(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setTemplates(response.data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách template:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    e.target.value = null; // Reset input

    if (!file.name.toLowerCase().endsWith('.docx')) {
      setErrorMsg("Hệ thống chỉ hỗ trợ định dạng Word hiện đại (.docx). Vui lòng kiểm tra và chọn lại file phù hợp.");
      return;
    }

    setUploadFile(file);
    const defaultName = file.name.replace(/\.docx?$/, '');
    setUploadName(defaultName);
    setUploadPreviewModalOpen(true);
  };

  const handleUploadSubmit = async (useImmediately = false) => {
    if (!uploadFile) return;

    setUploading(true);
    setUploadPreviewModalOpen(false);
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    if (uploadName.trim()) {
      formData.append('custom_name', uploadName.trim());
    }

    try {
      const response = await axios.post('/api/templates/upload', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      await fetchTemplates();
      
      if (useImmediately && response.data.template) {
        onSelectTemplate(response.data.template);
      }
    } catch (err) {
      console.error('Lỗi khi upload template:', err);
      alert('Tải lên thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      setUploadFile(null);
      setUploadName("");
    }
  };

  const handlePreview = async (template) => {
    setPreviewTemplate(template);
    setPreviewModalOpen(true);
    setPreviewLoading(true);
    try {
      const response = await axios.get(`/api/templates/${template.id}/download?t=${Date.now()}`, {
        responseType: 'blob',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      const blob = new Blob([response.data]);
      setTimeout(() => {
        if (previewContainerRef.current) {
          docx.renderAsync(blob, previewContainerRef.current, null, {
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
      }, 150);
    } catch (err) {
      console.error("Preview error:", err);
      alert("Không thể tải bản xem trước.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const allTemplates = [
    ...templates.system.map(t => ({ ...t, isSystem: true })),
    ...templates.user.map(t => ({ ...t, isSystem: false }))
  ];

  const filteredTemplates = activeTab === 'Tất cả' 
    ? allTemplates 
    : activeTab === 'Mẫu chung' 
      ? templates.system.map(t => ({ ...t, isSystem: true }))
      : activeTab === 'Của tôi'
        ? templates.user.map(t => ({ ...t, isSystem: false }))
        : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', background: '#f8f9fa' }}>
      {/* Full-width Header */}
      <div style={{ padding: '1rem 3rem', borderBottom: '1px solid var(--border-color)', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '0.25rem', marginTop: 0 }}>Chọn mẫu giáo án</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Chọn một mẫu để xem trước, sau đó vào workspace tạo giáo án.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span style={{ padding: '0.4rem 0.8rem', border: '1px solid var(--border-color)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>GIÁO VIÊN</span>
            <span style={{ padding: '0.4rem 0.8rem', border: '1px solid var(--border-color)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{templates.user.length} MẪU ĐÃ LƯU</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '1rem 3rem 2rem', overflowY: 'auto' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          {['Tất cả', 'Mẫu chung', 'Của tôi'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                background: activeTab === tab ? '#f0f0f0' : 'transparent',
                border: activeTab === tab ? '1px solid #e0e0e0' : '1px solid transparent',
                color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-secondary)',
                padding: '0.4rem 1rem',
                borderRadius: '20px',
                fontWeight: activeTab === tab ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Tìm mẫu..." 
            style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.9rem' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="loader" size={32} color="var(--primary-color)" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          
          {/* Nút Upload Card */}
          {(activeTab === 'Tất cả' || activeTab === 'Của tôi') && (
            <div 
              className="upload-card"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon-wrapper">
                <Upload size={28} color="var(--primary-color)" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)', textAlign: 'center' }}>Tải lên mẫu của tôi</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1rem', lineHeight: 1.5, maxWidth: '240px' }}>
                Tải lên giáo án mẫu DOCX của trường để giữ layout và bảng biểu riêng.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: '#f1f5f9', color: '#475569', borderRadius: '4px', fontWeight: 600 }}>DOCX</span>
                <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: '#f1f5f9', color: '#475569', borderRadius: '4px', fontWeight: 600 }}>Cá nhân</span>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelect}
              />
              {uploading && <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--primary-color)', fontWeight: 500 }}><Loader2 size={16} className="loader" /> Đang tải lên...</div>}
            </div>
          )}

          {filteredTemplates.map(template => (
            <div key={template.id} className="template-card">
              <div className="template-card-icon" style={{ position: 'relative' }}>
                <DocxThumbnail template={template} />
              </div>
              <div style={{ padding: '1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ margin: 'auto 0' }}>
                  <h3 className="template-card-title" title={template.name} style={{ marginBottom: '0.25rem' }}>{template.name}</h3>
                  {template.created_at && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{new Date(template.created_at).toLocaleDateString()}</p>}
                </div>
                
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button 
                    onClick={() => handlePreview(template)}
                    className="template-btn-outline"
                  >
                    <Eye size={16} /> Xem
                  </button>
                  <button 
                    onClick={() => onSelectTemplate(template)}
                    className="template-btn"
                  >
                    <Sparkles size={16} /> Dùng
                  </button>
                </div>
              </div>
            </div>
          ))}

        </div>
      )}
      </div>

      {/* Preview Modal */}
      {previewModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
        }}>
          <div style={{
            background: 'var(--surface-color)', width: '100%', maxWidth: '1000px', height: '100%',
            borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                {previewTemplate?.name || 'Xem trước mẫu'}
              </h3>
              <button 
                onClick={() => setPreviewModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: 'var(--text-secondary)' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={24} />
              </button>
            </div>
            
            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem', background: '#f1f5f9', position: 'relative' }}>
              {previewLoading && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(241, 245, 249, 0.8)', zIndex: 10 }}>
                  <Loader2 className="loader" size={40} color="var(--primary-color)" />
                </div>
              )}
              <div ref={previewContainerRef} className="preview-docx-container" style={{ minHeight: '100%', display: 'flex', justifyContent: 'center' }}></div>
            </div>
            
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#fff' }}>
              <button onClick={() => setPreviewModalOpen(false)} className="btn-outline" style={{ width: 'auto', marginTop: 0 }}>Đóng</button>
              <button onClick={() => {
                setPreviewModalOpen(false);
                onSelectTemplate(previewTemplate);
              }} className="btn-primary" style={{ width: 'auto', marginTop: 0 }}>
                <Sparkles size={18} /> Sử dụng mẫu này
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Upload Preview Modal */}
      {uploadPreviewModalOpen && uploadFile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
        }}>
          <div style={{
            background: 'var(--surface-color)', width: '100%', maxWidth: '1000px', height: '100%',
            borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                Xác nhận tải lên
              </h3>
              <button 
                onClick={() => setUploadPreviewModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: 'var(--text-secondary)' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Tên mẫu hiển thị:</label>
              <input 
                type="text" 
                value={uploadName} 
                onChange={(e) => setUploadName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '1rem', outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                placeholder="Nhập tên mẫu..."
                autoFocus
              />
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem', background: '#f1f5f9', position: 'relative' }}>
               <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100%' }}>
                  <LocalDocxPreview file={uploadFile} />
               </div>
            </div>
            
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#fff' }}>
              <button onClick={() => setUploadPreviewModalOpen(false)} className="btn-outline" style={{ width: 'auto', marginTop: 0 }}>Hủy bỏ</button>
              <button onClick={() => handleUploadSubmit(false)} className="btn-primary" style={{ width: 'auto', marginTop: 0, background: 'var(--text-secondary)', color: '#fff' }}>
                <Upload size={18} /> Lưu mẫu
              </button>
              <button onClick={() => handleUploadSubmit(true)} className="btn-primary" style={{ width: 'auto', marginTop: 0 }} disabled={uploading}>
                <Sparkles size={16} /> Sử dụng ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Error Modal */}
      {errorMsg && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'var(--surface-color)', padding: '2rem', borderRadius: '20px',
            maxWidth: '400px', width: '100%', textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ width: '64px', height: '64px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <X size={32} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Định dạng không hợp lệ</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '2rem' }}>
              {errorMsg}
            </p>
            <button 
              onClick={() => setErrorMsg(null)}
              className="btn-primary"
              style={{ width: '100%', background: '#ef4444', marginTop: 0 }}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default TemplateSelection;

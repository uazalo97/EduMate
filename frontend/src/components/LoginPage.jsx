import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Sparkles, Mail, Lock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage({ mode = 'login' }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(mode);
  
  useEffect(() => {
    setActiveTab(mode);
    setError('');
    setSuccess('');
  }, [mode]);
  
  const handleTabChange = (tab) => {
    if (tab === 'login') {
      navigate('/signin');
    } else {
      navigate('/register');
    }
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // === GOOGLE AUTH ===
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsProcessing(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:8000/api/auth/google', {
        credential: credentialResponse.credential
      });
      const { access_token, user } = res.data;
      login(user, access_token);
      navigate('/lesson-plan');
    } catch (err) {
      setError('Đăng nhập bằng Google thất bại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleError = () => {
    setError('Đăng nhập bằng Google bị hủy hoặc thất bại.');
  };

  // === MANUAL AUTH ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsProcessing(true);

    try {
      if (activeTab === 'login') {
        const res = await axios.post('http://localhost:8000/api/auth/login', {
          email,
          password
        });
        const { access_token, user } = res.data;
        login(user, access_token);
        navigate('/lesson-plan');
      } else {
        await axios.post('http://localhost:8000/api/auth/register', {
          email,
          password,
          name
        });
        setSuccess('Đăng ký thành công! Đang chuyển sang màn hình đăng nhập...');
        setTimeout(() => {
          setSuccess('');
          setActiveTab('login');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: 'var(--bg-color)', overflow: 'hidden' }}>
      
      {/* Left Branding Panel */}
      <div 
        className="login-branding-panel"
        style={{ 
          flex: '1.2',
          background: 'linear-gradient(135deg, var(--primary-color) 0%, #9a5338 100%)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '4rem',
          color: 'white'
        }}
      >
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '-5%', right: '-10%', width: '350px', height: '350px', background: 'rgba(255,255,255,0.12)', borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '10%', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(30px)' }} />

        <motion.div 
          initial={{ opacity: 0, x: -40 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ position: 'relative', zIndex: 10, maxWidth: '500px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '14px', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px' }}>
              <Sparkles size={28} color="white" />
            </div>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'white', letterSpacing: '-1px' }}>EduMate</span>
          </div>

          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.3, marginBottom: '1.5rem', letterSpacing: '-1px' }}>
            Kiến tạo bài giảng <br />
            <span style={{ color: '#ffd6c4' }}>xuất sắc.</span>
          </h1>
          <p style={{ fontSize: '1.15rem', opacity: 0.9, lineHeight: 1.6, fontWeight: 400 }}>
            Khám phá sức mạnh của AI trong giáo dục. Tiết kiệm hàng giờ soạn giáo án, tạo đề thi và mô phỏng bài học chỉ với vài cú click chuột.
          </p>
        </motion.div>
      </div>

      {/* Right Login Form Panel */}
      <div style={{ 
        flex: '1', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--bg-color)',
        backgroundImage: 'radial-gradient(circle, var(--dot-color) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        overflowY: 'auto'
      }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            width: '100%',
            maxWidth: '440px',
            textAlign: 'center',
            background: 'var(--surface-color)',
            padding: '2.5rem',
            borderRadius: '24px',
            border: '2px dashed var(--primary-color)',
            margin: 'auto'
          }}
        >
          <div className="mobile-logo" style={{ display: 'none', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'rgba(206, 122, 88, 0.1)', borderRadius: '10px' }}>
                <Sparkles size={24} color="var(--primary-color)" />
              </div>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>EduMate</span>
            </div>
          </div>

          <div style={{ display: 'flex', background: 'var(--input-bg)', borderRadius: '12px', padding: '6px', marginBottom: '2rem' }}>
            <button 
              type="button"
              onClick={() => handleTabChange('login')}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none', 
                background: activeTab === 'login' ? 'var(--bg-color)' : 'transparent',
                boxShadow: activeTab === 'login' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                fontWeight: activeTab === 'login' ? 600 : 500,
                color: activeTab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              Đăng nhập
            </button>
            <button 
              type="button"
              onClick={() => handleTabChange('register')}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                background: activeTab === 'register' ? 'var(--bg-color)' : 'transparent',
                boxShadow: activeTab === 'register' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                fontWeight: activeTab === 'register' ? 600 : 500,
                color: activeTab === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              Đăng ký
            </button>
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {activeTab === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
            {activeTab === 'login' ? 'Truy cập vào hệ sinh thái EduMate' : 'Bắt đầu hành trình sáng tạo bài giảng'}
          </p>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', padding: '12px', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: 500 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: 500 }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
            <AnimatePresence>
              {activeTab === 'register' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0, overflow: 'hidden', marginBottom: 0 }} 
                  animate={{ height: 'auto', opacity: 1, overflow: 'visible', marginBottom: '1rem' }} 
                  exit={{ height: 0, opacity: 0, overflow: 'hidden', marginBottom: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ position: 'relative' }}
                >
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                    <User size={18} />
                  </div>
                  <input 
                    type="text" placeholder="Họ và Tên" required={activeTab === 'register'}
                    value={name} onChange={e => setName(e.target.value)}
                    style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Mail size={18} />
              </div>
              <input 
                type="email" placeholder="Địa chỉ Email" required
                value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s' }}
              />
            </div>

            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Lock size={18} />
              </div>
              <input 
                type="password" placeholder="Mật khẩu" required minLength="6"
                value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={isProcessing}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: 'var(--primary-color)', color: 'white', fontSize: '1rem', fontWeight: 600,
                cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                marginTop: '0.5rem', opacity: isProcessing ? 0.7 : 1
              }}
            >
              {isProcessing ? <Loader2 className="loader" size={20} /> : null}
              {activeTab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </form>

          <div style={{ position: 'relative', margin: '2rem 0', textAlign: 'center' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid var(--border-color)' }}></div>
            <span style={{ position: 'relative', background: 'var(--surface-color)', padding: '0 16px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
              HOẶC TIẾP TỤC VỚI
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                shape="pill"
                theme="outline"
                size="large"
                text={activeTab === 'login' ? 'signin_with' : 'signup_with'}
                width="320"
              />
            </div>
          </div>

        </motion.div>
      </div>

    </div>
  );
}

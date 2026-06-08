'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type LoginMethod = 'password' | 'otp';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Modes
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [isOtpSent, setIsOtpSent] = useState(false);
  
  // Feedback
  const [localError, setLocalError] = useState('');
  const [localMessage, setLocalMessage] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  // --- PASSWORD FLOW ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError('');
    setLocalMessage('');
    
    try {
      if (isRegisterMode) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });
        
        if (error) throw error;
        
        if (data.user && data.session === null) {
          setLocalMessage('Registration successful! Please check your email for a confirmation link.');
        } else if (data.session) {
          router.push('/dashboard');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  // --- OTP FLOW ---
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError('');
    setLocalMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true, // Allow creating new users via OTP
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setIsOtpSent(true);
      setLocalMessage('OTP sent! Please check your email.');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError('');
    setLocalMessage('');

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email',
      });

      if (error) throw error;
      if (data.session) {
        router.push('/dashboard');
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // --- GOOGLE FLOW ---
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setLocalError('');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (error) throw error;
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Google login failed');
      setIsLoading(false);
    }
  };

  return (
    <main className="login-root">
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      <div className="login-card" style={{ maxWidth: '450px' }}>
        <div className="login-logo">
          <div className="login-logo-icon">N</div>
          <span className="login-logo-text">Navbook</span>
        </div>

        <div className="login-heading">
          <h1>{isRegisterMode ? 'Create Account' : 'Welcome Back'}</h1>
          <p>Sign in to your secure vault</p>
        </div>
        
        {/* Google OAuth */}
        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="login-btn"
          style={{ 
            backgroundColor: '#ffffff', 
            color: '#1f2937', 
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4"/>
            <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853"/>
            <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03296C-0.371021 20.0112 -0.371021 28.0009 3.03296 34.7825L11.0051 28.6006Z" fill="#FBBC05"/>
            <path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6869 13.0973L40.5387 6.24553C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4056 0.00161733 7.10718 5.11644 3.03296 13.2296L11.0051 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '15px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
          <span style={{ padding: '0 10px', fontSize: '14px', color: 'var(--foreground-muted)' }}>Or with email</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
        </div>

        {/* Method Toggle */}
        {!isRegisterMode && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
            <button 
              type="button"
              onClick={() => { setLoginMethod('password'); setIsOtpSent(false); setLocalError(''); setLocalMessage(''); }}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', background: loginMethod === 'password' ? 'var(--primary)' : 'transparent', color: loginMethod === 'password' ? 'white' : 'inherit', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Password
            </button>
            <button 
              type="button"
              onClick={() => { setLoginMethod('otp'); setLocalError(''); setLocalMessage(''); }}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', background: loginMethod === 'otp' ? 'var(--primary)' : 'transparent', color: loginMethod === 'otp' ? 'white' : 'inherit', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              One-Time Code
            </button>
          </div>
        )}

        {/* Form area */}
        {loginMethod === 'password' || isRegisterMode ? (
          <form onSubmit={handlePasswordSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading}
                className="login-input"
              />
            </div>
            <div className="login-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
                className="login-input"
              />
            </div>
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Processing...' : (isRegisterMode ? 'Create Account' : 'Sign In')}
            </button>
            {!isRegisterMode && (
              <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
                <a href="/forgot-password" style={{ fontSize: '0.78rem', color: 'rgba(165,180,252,0.55)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseOver={e => (e.currentTarget.style.color = '#a5b4fc')}
                  onMouseOut={e => (e.currentTarget.style.color = 'rgba(165,180,252,0.55)')}>
                  Forgot password?
                </a>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp} className="login-form">
            <div className="login-field">
              <label htmlFor="email-otp">Email</label>
              <input
                id="email-otp"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading || isOtpSent}
                className="login-input"
              />
            </div>
            {isOtpSent && (
              <div className="login-field">
                <label htmlFor="otp">6-Digit Code</label>
                <input
                  id="otp"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  required
                  disabled={isLoading}
                  className="login-input"
                  style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem' }}
                  maxLength={6}
                />
              </div>
            )}
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Processing...' : (isOtpSent ? 'Verify Code' : 'Send Code to Email')}
            </button>
            {isOtpSent && (
              <button 
                type="button" 
                onClick={() => { setIsOtpSent(false); setOtpCode(''); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginTop: '10px' }}
              >
                Change email or resend code
              </button>
            )}
          </form>
        )}

        {/* Feedback Messages */}
        {localMessage && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#10b981', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}>
            {localMessage}
          </div>
        )}
        {localError && (
          <div className="login-error" style={{ marginTop: '15px' }}>{localError}</div>
        )}

        <div className="login-switch" style={{ marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(!isRegisterMode); setLoginMethod('password'); setLocalError(''); setLocalMessage(''); }}
            disabled={isLoading}
          >
            {isRegisterMode ? 'Already have an account? Sign in' : "Don't have an account? Register with Password"}
          </button>
        </div>

        <p className="login-footer">🔒 End-to-end encrypted · Your files, only yours</p>
      </div>
    </main>
  );
}

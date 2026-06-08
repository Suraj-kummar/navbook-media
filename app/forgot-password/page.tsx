'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });

      if (error) throw error;

      setSuccessMessage('Check your email for a reset link');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to send reset email. Please try again.'
      );
    } finally {
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

      <div className="login-card" style={{ maxWidth: '420px' }}>
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">N</div>
          <span className="login-logo-text">Navbook</span>
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h1>Forgot Password</h1>
          <p>Enter your email and we&apos;ll send you a reset link</p>
        </div>

        {/* Form */}
        {!successMessage && (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">Email Address</label>
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

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {/* Success Message */}
        {successMessage && (
          <div
            style={{
              marginTop: '1rem',
              padding: '14px 16px',
              backgroundColor: 'rgba(52, 211, 153, 0.12)',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              color: '#34d399',
              borderRadius: '0.75rem',
              fontSize: '14px',
              textAlign: 'center',
              lineHeight: '1.5',
            }}
          >
            ✉️ &nbsp;{successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div
            className="login-error"
            style={{ marginTop: '1rem' }}
          >
            {errorMessage}
          </div>
        )}

        {/* Back to Sign In */}
        <div className="login-switch" style={{ marginTop: '1.5rem' }}>
          <Link href="/login" style={{ color: 'rgba(165,180,252,0.8)', textDecoration: 'none', fontSize: '14px' }}>
            ← Back to Sign In
          </Link>
        </div>

        <p className="login-footer">🔒 End-to-end encrypted · Your files, only yours</p>
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please try again.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      setSuccessMessage('Password updated successfully! Redirecting to sign in…');

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update password. Please try again.'
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
          <h1>Reset Password</h1>
          <p>Choose a new password for your account</p>
        </div>

        {/* Form — hidden after success */}
        {!successMessage && (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                disabled={isLoading}
                className="login-input"
                minLength={6}
              />
            </div>

            <div className="login-field">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                disabled={isLoading}
                className="login-input"
                minLength={6}
              />
            </div>

            {/* Inline match hint */}
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p
                style={{
                  fontSize: '12px',
                  color: 'rgba(239,68,68,0.85)',
                  marginTop: '-0.4rem',
                }}
              >
                Passwords don&apos;t match yet
              </p>
            )}

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Updating…' : 'Update Password'}
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
            ✅ &nbsp;{successMessage}
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

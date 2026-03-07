'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginOTPPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isOTPMode, setIsOTPMode] = useState(false);
  const [isPasswordlessMode, setIsPasswordlessMode] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const { login, error } = useAuth();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError('');
    setSuccessMessage('');
    
    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      setSuccessMessage('OTP sent to your email! Please check and enter it below.');
      setIsOTPMode(true);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError('');
    
    try {
      const endpoint = isPasswordlessMode ? '/auth/verify-login-otp' : '/auth/verify-otp';
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'OTP verification failed');
      }

      // Store token and redirect
      localStorage.setItem('token', data.access_token);
      router.push('/dashboard');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setLocalError('');
    
    try {
      const response = await fetch(`${apiUrl}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to resend OTP');
      }

      setSuccessMessage('New OTP sent to your email!');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError('');
    
    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      localStorage.setItem('token', data.access_token);
      router.push('/dashboard');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordlessLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError('');
    setSuccessMessage('');
    
    try {
      const response = await fetch(`${apiUrl}/auth/login-with-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send OTP');
      }

      setSuccessMessage('OTP sent to your email!');
      setIsOTPMode(true);
      setIsPasswordlessMode(true);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg border border-border shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Navbook</h1>
          <p className="text-sm text-muted-foreground mt-2">Secure Private Media Vault</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isOTPMode 
              ? 'Enter OTP sent to your email' 
              : isRegisterMode 
                ? 'Create a new account' 
                : 'Sign in to your account'}
          </p>
        </div>

        {isOTPMode ? (
          // OTP Verification Form
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-foreground mb-2">
                Enter OTP
              </label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                required
                disabled={isLoading}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
            </div>

            {(error || localError) && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
                {localError || error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-500/10 border border-green-500 rounded text-sm text-green-600">
                {successMessage}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleResendOTP}
                className="text-sm text-primary hover:underline"
                disabled={isLoading}
              >
                Resend OTP
              </button>
              <br />
              <button
                type="button"
                onClick={() => {
                  setIsOTPMode(false);
                  setIsPasswordlessMode(false);
                  setOtp('');
                  setLocalError('');
                  setSuccessMessage('');
                }}
                className="text-sm text-muted-foreground hover:underline"
              >
                Back to login
              </button>
            </div>
          </form>
        ) : isRegisterMode ? (
          // Registration Form
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                required
                disabled={isLoading}
              />
            </div>

            {(error || localError) && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
                {localError || error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setLocalError('');
                }}
                className="text-sm text-primary hover:underline"
                disabled={isLoading}
              >
                Already have an account? Login
              </button>
            </div>
          </form>
        ) : (
          // Login Form
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>

            {(error || localError) && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
                {localError || error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-500/10 border border-green-500 rounded text-sm text-green-600">
                {successMessage}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handlePasswordlessLogin}
              disabled={isLoading}
            >
              Login with OTP (Passwordless)
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setLocalError('');
                }}
                className="text-sm text-primary hover:underline"
                disabled={isLoading}
              >
                Don't have an account? Register
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

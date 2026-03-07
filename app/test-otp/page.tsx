'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TestOTPPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'register' | 'verify'>('register');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    
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

      setMessage('✅ Registration successful! Check the backend terminal for your OTP code.');
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch(`${apiUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'OTP verification failed');
      }

      setMessage('🎉 Success! Account verified. Token: ' + data.access_token.substring(0, 20) + '...');
      localStorage.setItem('token', data.access_token);
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');
    
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

      setMessage('📧 New OTP sent! Check backend terminal.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center bg-card border border-border rounded-lg p-6">
          <h1 className="text-3xl font-bold text-foreground">🧪 OTP Test Page</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Test email + OTP authentication
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
          <h2 className="font-semibold text-blue-600 mb-2">📋 Instructions:</h2>
          <ol className="text-sm text-blue-600 space-y-1 list-decimal list-inside">
            <li>Fill in your email, username, and password</li>
            <li>Click "Register"</li>
            <li>Look at your <strong>backend terminal/console</strong> for the OTP</li>
            <li>Copy the 6-digit OTP code</li>
            <li>Enter it below and click "Verify OTP"</li>
          </ol>
        </div>

        {/* Main Form */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          {step === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-xl font-semibold">Step 1: Register</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Registering...' : 'Register & Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <h2 className="text-xl font-semibold">Step 2: Verify OTP</h2>
              
              <div className="bg-yellow-500/10 border border-yellow-500 rounded p-3">
                <p className="text-sm text-yellow-600">
                  ⚠️ <strong>Check your backend terminal</strong> for the OTP code!
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Look for a box with 📧 emoji showing your 6-digit code
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Enter OTP</label>
                <Input
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

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleResend}
                  disabled={isLoading}
                >
                  Resend OTP
                </Button>
              </div>

              <Button 
                type="button" 
                variant="ghost" 
                className="w-full"
                onClick={() => setStep('register')}
              >
                ← Back to Register
              </Button>
            </form>
          )}

          {/* Messages */}
          {message && (
            <div className="p-3 bg-green-500/10 border border-green-500 rounded text-sm text-green-600">
              {message}
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Backend Terminal Guide */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-3">🖥️ Where to find your OTP:</h3>
          <div className="bg-muted rounded p-4 font-mono text-xs">
            <div className="text-muted-foreground">Backend Terminal Output:</div>
            <div className="mt-2 border border-border rounded p-2 bg-background">
              <div>==================================================</div>
              <div className="text-blue-500">📧 OTP EMAIL SENT TO: your@email.com</div>
              <div className="text-green-500 font-bold">🔐 YOUR OTP CODE: 123456</div>
              <div className="text-yellow-500">⏰ Valid for 10 minutes</div>
              <div>==================================================</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            This appears in the terminal/console where you ran: <code>python -m uvicorn app_with_otp:app --reload --port 8000</code>
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => window.location.href = '/login-otp'}>
            Go to Login Page
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </main>
  );
}

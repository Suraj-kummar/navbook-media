'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [localError, setLocalError] = useState('');
  const router = useRouter();
  const { login, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError('');
    
    try {
      if (isRegisterMode) {
        // Register new user
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || 'Registration failed');
        }

        // Auto-login after registration
        await login(username, password);
        router.push('/dashboard');
      } else {
        // Login existing user
        await login(username, password);
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setLocalError(err instanceof Error ? err.message : 'Authentication failed');
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
            {isRegisterMode ? 'Create a new account' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading 
              ? (isRegisterMode ? 'Creating account...' : 'Logging in...') 
              : (isRegisterMode ? 'Create Account' : 'Login')
            }
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setLocalError('');
            }}
            className="text-sm text-primary hover:underline"
            disabled={isLoading}
          >
            {isRegisterMode 
              ? 'Already have an account? Login' 
              : "Don't have an account? Register"
            }
          </button>
        </div>
      </div>
    </main>
  );
}

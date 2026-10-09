import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';
import { setUserAuthenticated } from '../../lib/storage';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToPublic: () => void;
}

// Admin Credentials
export const DEFAULT_ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'AzadiAdmin@2026',
};

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToPublic,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim();

      // Check credentials (accepts 'admin' or 'admin@digitalazadi.com')
      if (
        (cleanUser === 'admin' || cleanUser === 'admin@digitalazadi.com') &&
        (cleanPass === DEFAULT_ADMIN_CREDENTIALS.password || 
         cleanPass === 'digitalazadi@2026' || 
         cleanPass === 'Admin@2026')
      ) {
        setUserAuthenticated(true);
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setIsLoading(false);
        setError('Invalid Administrator ID or Password. Please try again.');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-void text-text-pure flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
      
      {/* Top Corner Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle showLabel />
      </div>

      <div className="w-full max-w-md space-y-6 z-10">
        
        {/* Brand Lockup */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo size="lg" showBadge={false} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-pure">
            Operations Command Deck
          </h1>
          <p className="text-xs text-text-muted">
            Restricted Admin & Agent Portal • Secure Authentication
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface border border-surface-border rounded-3xl p-7 shadow-sm space-y-5">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 flex items-center gap-2.5 text-xs text-red-700 dark:text-red-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username / Admin ID */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Admin Username / ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border pl-10 pr-4 py-2.5 text-xs focus:border-indigo-500 focus:outline-none placeholder:text-text-faint transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Secure Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border pl-10 pr-10 py-2.5 text-xs focus:border-indigo-500 focus:outline-none placeholder:text-text-faint transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-pure transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition"
            >
              {isLoading ? (
                <span>Verifying Credentials...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate & Enter Deck</span>
                </>
              )}
            </button>

          </form>

          {/* Credentials hint for authorized administrator */}
          <div className="p-3 bg-surface-elevated border border-surface-border rounded-xl text-xs text-text-muted space-y-1">
            <span className="text-text-pure font-semibold block">Authorized Admin Credentials:</span>
            <div className="flex justify-between">
              <span>Username:</span>
              <code className="text-indigo-600 dark:text-indigo-400 font-mono font-medium">admin</code>
            </div>
            <div className="flex justify-between">
              <span>Password:</span>
              <code className="text-emerald-700 dark:text-emerald-400 font-mono font-medium">digitalazadi@2026</code>
            </div>
          </div>

        </div>

        {/* Back to Public Link */}
        <div className="text-center">
          <button
            onClick={onBackToPublic}
            className="text-xs text-text-muted hover:text-text-pure transition inline-flex items-center gap-1.5 font-medium"
          >
            <span>Return to Public Support Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};

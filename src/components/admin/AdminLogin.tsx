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

// Allowed SHA-256 password hashes:
// AzadiAdmin@2026, digitalazadi@2026, Admin@2026
const AUTHORIZED_PASSWORD_HASHES = new Set([
  '3d7737df8180654c0b0306ae4452ff75779a1b1689b159db2761a1e89a4d566d', // AzadiAdmin@2026
  '2a33273f427f21b97252b0168afcf324097fb76a9b7eeb49b8e942c02e0a78a4', // digitalazadi@2026
  'a36aef5a11c4073fbe60314fc9df530a9d5f986533594d1f5190742ff9e0e408', // Admin@2026
]);

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToPublic,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim();

      // Check username
      const isValidUser = cleanUser === 'admin' || cleanUser === 'admin@digitalazadi.com';

      // Secure cryptographic hash check
      const passHash = await sha256(cleanPass);
      const isValidPassword = AUTHORIZED_PASSWORD_HASHES.has(passHash);

      if (isValidUser && isValidPassword) {
        setUserAuthenticated(true);
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setIsLoading(false);
        setError('Invalid Administrator ID or Password. Access denied.');
      }
    } catch {
      setIsLoading(false);
      setError('Authentication service error. Please try again.');
    }
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

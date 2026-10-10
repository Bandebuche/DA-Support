import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle,
  Sparkles,
  Layers,
  Target
} from 'lucide-react';
import { 
  setAuthenticatedUser, 
  AdminUserSession, 
  DEFAULT_SACHIN_USER, 
  DEFAULT_ONKAR_USER 
} from '../../lib/storage';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { cn } from '../../lib/utils';

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUserSession) => void;
  onBackToPublic: () => void;
  initialRole?: 'super_admin' | 'meta_lead';
}

// Passwords supported for Sachin Sir: sachin@2026, Admin@2026, digitalazadi@2026, AzadiAdmin@2026, sachin123
// Passwords supported for Onkar Kulkarni: onkar@2026, meta@2026, onkar123
const SACHIN_PASSWORDS = new Set([
  'sachin@2026',
  'admin@2026',
  'digitalazadi@2026',
  'azadiadmin@2026',
  'sachin123',
  'admin123',
]);

const ONKAR_PASSWORDS = new Set([
  'onkar@2026',
  'meta@2026',
  'onkar123',
  'meta123',
]);

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToPublic,
  initialRole = 'super_admin',
}) => {
  const [activePortalTab, setActivePortalTab] = useState<'super_admin' | 'meta_lead'>(initialRole);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePortalSwitch = (tab: 'super_admin' | 'meta_lead') => {
    setActivePortalTab(tab);
    setError(null);
    setPassword('');
    setUsername('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim().toLowerCase();

      // Check Sachin Sir Login
      const isSachinUsername = 
        cleanUser === 'sachin' || 
        cleanUser === 'admin' || 
        cleanUser === 'sachin@digitalazadi.com' ||
        cleanUser === 'admin@digitalazadi.com';

      const isSachinPassword = SACHIN_PASSWORDS.has(cleanPass);

      // Check Onkar Kulkarni Login
      const isOnkarUsername = 
        cleanUser === 'onkar' || 
        cleanUser === 'onkar.kulkarni' || 
        cleanUser === 'onkar@digitalazadi.com';

      const isOnkarPassword = ONKAR_PASSWORDS.has(cleanPass);

      if (isSachinUsername && isSachinPassword) {
        setAuthenticatedUser(DEFAULT_SACHIN_USER);
        setIsLoading(false);
        onLoginSuccess(DEFAULT_SACHIN_USER);
      } else if (isOnkarUsername && isOnkarPassword) {
        setAuthenticatedUser(DEFAULT_ONKAR_USER);
        setIsLoading(false);
        onLoginSuccess(DEFAULT_ONKAR_USER);
      } else {
        setIsLoading(false);
        setError('Invalid Username or Password. Please check your credentials.');
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
            Restricted Admin & Specialist Portal • Secure Access
          </p>
        </div>

        {/* Role Selector Tabs (Sachin Sir vs Onkar Kulkarni) */}
        <div className="p-1.5 rounded-2xl bg-surface border border-surface-border grid grid-cols-2 gap-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => handlePortalSwitch('super_admin')}
            className={cn(
              'py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5',
              activePortalTab === 'super_admin'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-text-muted hover:text-text-pure'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sachin Sir (All Ops)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch('meta_lead')}
            className={cn(
              'py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5',
              activePortalTab === 'meta_lead'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-text-muted hover:text-text-pure'
            )}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Onkar Sir (Meta Ads)</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-surface border border-surface-border rounded-3xl p-7 shadow-sm space-y-5">
          
          <div className="pb-1 border-b border-surface-border">
            <h2 className="text-sm font-bold text-text-pure flex items-center gap-2">
              {activePortalTab === 'super_admin' ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Sachin Sir • Super Admin Login</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span>Onkar Kulkarni • Meta Desk Login</span>
                </>
              )}
            </h2>
            <p className="text-[11px] text-text-muted mt-0.5">
              {activePortalTab === 'super_admin' 
                ? 'Full access to all operations, CRM, WordPress, and support tickets'
                : 'Isolated access strictly to Meta ads and marketing queries'}
            </p>
          </div>

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
                Username / ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter Username / ID"
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
              disabled={isLoading}
              className={cn(
                'w-full py-2.5 px-4 rounded-xl text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer',
                activePortalTab === 'meta_lead'
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              )}
            >
              {isLoading ? (
                <span>Verifying Access...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

        </div>

        {/* Back to Public Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={onBackToPublic}
            className="text-xs text-text-muted hover:text-text-pure transition underline"
          >
            ← Back to Public Support Portal (/submit)
          </button>
        </div>

      </div>

    </div>
  );
};

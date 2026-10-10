import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Globe, 
  ShieldCheck, 
  Search, 
  BarChart3, 
  Layers, 
  Database,
  ArrowRight
} from 'lucide-react';
import { getSavedSpreadsheetUrl } from '../../lib/storage';

interface PortalLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: 'public' | 'admin' | 'track' | 'analytics' | 'onkar') => void;
}

export const PortalLinksModal: React.FC<PortalLinksModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const isSubdir = typeof window !== 'undefined' && window.location.pathname.toLowerCase().startsWith('/support');
  const baseRoot = isSubdir ? `${origin}/support` : origin;

  const LINKS = [
    {
      id: 'submit',
      title: 'Portal 1: Digital Azadi Support (Public)',
      badge: 'Student & Franchise Facing',
      description: 'Clean public portal for students and franchise owners to submit support queries with IST timestamps and WhatsApp validation.',
      path: '/submit',
      fullUrl: `${baseRoot}/submit`,
      altUrl: `${baseRoot}/?portal=public`,
      action: () => { onNavigate('public'); onClose(); },
      icon: Layers,
    },
    {
      id: 'admin',
      title: 'Portal 2A: Sachin Sir (Super Admin Operations)',
      badge: 'Sachin Sir • Super Admin Access',
      description: 'Super Admin operations deck for Sachin Sir: view all general operations, CRM, WordPress, and hosting queries with live stopwatch.',
      path: '/admin',
      fullUrl: `${baseRoot}/admin`,
      altUrl: `${baseRoot}/?portal=admin`,
      action: () => { onNavigate('admin'); onClose(); },
      icon: ShieldCheck,
    },
    {
      id: 'onkar',
      title: 'Portal 2B: Onkar Kulkarni (Meta Specialist Desk)',
      badge: 'Onkar Kulkarni • Meta Ads Lead',
      description: 'Dedicated isolated portal for Onkar Sir: displays strictly Meta ads and marketing inquiries. Sachin Sir queries are excluded.',
      path: '/onkar',
      fullUrl: `${baseRoot}/onkar`,
      altUrl: `${baseRoot}/?portal=onkar`,
      action: () => { onNavigate('onkar'); onClose(); },
      icon: ShieldCheck,
    },
    {
      id: 'track',
      title: 'Portal 3: Public Ticket Status Tracker',
      badge: 'Self-Service Status Check',
      description: 'Quick lookup page where students check real-time resolution status and duration using their Ticket ID or Phone.',
      path: '/track',
      fullUrl: `${baseRoot}/track`,
      altUrl: `${baseRoot}/?page=track`,
      action: () => { onNavigate('track'); onClose(); },
      icon: Search,
    },
    {
      id: 'analytics',
      title: 'Portal 4: SLA Analytics & Operations Deck',
      badge: 'Executive & SLA Performance',
      description: 'Direct SLA reporting deck with resolution duration distributions, platform breakdowns, and compliance scores.',
      path: '/analytics',
      fullUrl: `${baseRoot}/analytics`,
      altUrl: `${baseRoot}/?portal=admin&tab=analytics`,
      action: () => { onNavigate('analytics'); onClose(); },
      icon: BarChart3,
    },
    {
      id: 'sheets',
      title: 'Central Database: Google Spreadsheet',
      badge: 'Centralized Master DB',
      description: 'Direct access to Technical_Support_DB single source of truth.',
      path: 'docs.google.com',
      fullUrl: getSavedSpreadsheetUrl(),
      altUrl: 'Google Sheets DB Engine',
      isExternal: true,
      icon: Database,
    },
  ];

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative bg-surface border border-surface-border rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl z-10 text-xs">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-pure">
                Portal & Page Direct Links
              </h3>
              <p className="text-xs text-text-muted">
                Direct URLs for Students, Franchisees, Support Agents, and Admins
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-pure hover:bg-surface-elevated transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Links list */}
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          {LINKS.map(link => {
            const Icon = link.icon;
            const isCopied = copiedKey === link.id;

            return (
              <div
                key={link.id}
                className="bg-surface-elevated border border-surface-border rounded-xl p-4 space-y-2 hover:border-indigo-500/40 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-surface border border-surface-border flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-pure text-xs">
                        {link.title}
                      </h4>
                      <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                        {link.badge}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(link.id, link.fullUrl)}
                      className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-surface-border text-text-soft hover:text-text-pure text-[11px] flex items-center gap-1 transition font-medium"
                      title="Copy Direct URL"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                    </button>

                    {link.isExternal ? (
                      <a
                        href={link.fullUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold text-[11px] flex items-center gap-1 hover:opacity-90 transition"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <button
                        onClick={link.action}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition"
                      >
                        <span>Navigate</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-text-muted leading-relaxed">
                  {link.description}
                </p>

                {/* URL Pill */}
                <div className="bg-surface rounded-lg p-2 border border-surface-border flex items-center justify-between text-xs text-text-pure">
                  <span className="truncate text-indigo-600 dark:text-indigo-400 select-all font-mono">{link.fullUrl}</span>
                  <span className="text-[11px] text-text-muted ml-2 shrink-0">
                    Alt: {link.altUrl}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-surface-border flex items-center justify-between text-xs text-text-muted">
          <span>Supports path `/submit`, `/admin`, `/track` & query `?page=...`</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-pure transition font-medium"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

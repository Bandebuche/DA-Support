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

interface PortalLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: 'public' | 'admin' | 'track' | 'analytics') => void;
}

export const PortalLinksModal: React.FC<PortalLinksModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

  const LINKS = [
    {
      id: 'submit',
      title: 'Portal 1: Digital Ajaibi Support (Public)',
      badge: 'Student & Franchise Facing',
      description: 'Clean public portal for students and franchise owners to submit support queries with IST timestamps and WhatsApp validation.',
      path: '/submit',
      fullUrl: `${origin}/submit`,
      altUrl: `${origin}/?portal=public`,
      action: () => { onNavigate('public'); onClose(); },
      icon: Layers,
    },
    {
      id: 'admin',
      title: 'Portal 2: Operations Command & SLA Deck (Admin)',
      badge: 'Support Agents & Admins • Secure Login',
      description: 'Secured administrative operations deck with live stopwatches, Kanban boards, dense data table, SLA tracking, and Google Sheets cloud sync.',
      path: '/admin',
      fullUrl: `${origin}/admin`,
      altUrl: `${origin}/?portal=admin`,
      action: () => { onNavigate('admin'); onClose(); },
      icon: ShieldCheck,
    },
    {
      id: 'track',
      title: 'Portal 3: Public Ticket Status Tracker',
      badge: 'Self-Service Status Check',
      description: 'Quick lookup page where students check real-time resolution status and duration using their Ticket ID or Phone.',
      path: '/track',
      fullUrl: `${origin}/track`,
      altUrl: `${origin}/?page=track`,
      action: () => { onNavigate('track'); onClose(); },
      icon: Search,
    },
    {
      id: 'analytics',
      title: 'Portal 4: SLA Analytics & Operations Deck',
      badge: 'Executive & SLA Performance',
      description: 'Direct SLA reporting deck with resolution duration distributions, platform breakdowns, and compliance scores.',
      path: '/analytics',
      fullUrl: `${origin}/analytics`,
      altUrl: `${origin}/?portal=admin&tab=analytics`,
      action: () => { onNavigate('analytics'); onClose(); },
      icon: BarChart3,
    },
    {
      id: 'sheets',
      title: 'Central Database: Google Spreadsheet',
      badge: 'Centralized Master DB',
      description: 'Direct access to Technical_Support_DB single source of truth.',
      path: 'docs.google.com',
      fullUrl: 'https://docs.google.com/spreadsheets/d/16D1TXnUvGxPhp6YDwq9l0rCoBXnTwsDAHOe-0Z5uu1k/edit#gid=1624538793',
      altUrl: 'Google Sheets ID: 16D1TXnUvGxPhp6YDwq9l0rCoBXnTwsDAHOe-0Z5uu1k',
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
        className="fixed inset-0 bg-void/85 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative bg-surface border border-surface-border rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-nexus-lg z-10 text-xs">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center">
              <Globe className="w-5 h-5 text-nexus-electric" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-pure font-mono">
                Separate Portal & Page Direct Links
              </h3>
              <p className="text-xs font-mono text-text-muted">
                Direct URLs for Students, Franchisees, Support Agents, and Admins
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-surface-elevated transition"
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
                className="bg-surface-elevated border border-surface-border rounded-xl p-4 space-y-2 hover:border-nexus/40 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-surface border border-surface-border flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-nexus-electric" />
                    </div>
                    <div>
                      <h4 className="font-mono font-bold text-text-pure text-xs">
                        {link.title}
                      </h4>
                      <span className="text-[10px] font-mono text-nexus-electric">
                        {link.badge}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(link.id, link.fullUrl)}
                      className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-surface-border text-text-muted hover:text-white font-mono text-[11px] flex items-center gap-1 transition"
                      title="Copy Direct URL"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-nexus-electric" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                    </button>

                    {link.isExternal ? (
                      <a
                        href={link.fullUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-white text-void font-mono font-bold text-[11px] flex items-center gap-1 hover:bg-white/90 transition"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <button
                        onClick={link.action}
                        className="px-3 py-1.5 rounded-lg bg-nexus hover:bg-nexus-dark text-white font-mono font-bold text-[11px] flex items-center gap-1 shadow-nexus-sm transition"
                      >
                        <span>Navigate</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-text-muted leading-relaxed font-sans">
                  {link.description}
                </p>

                {/* URL Pill */}
                <div className="bg-surface rounded-lg p-2 border border-surface-border flex items-center justify-between font-mono text-[11px] text-text-pure">
                  <span className="truncate text-nexus-electric select-all">{link.fullUrl}</span>
                  <span className="text-[10px] text-text-faint ml-2 shrink-0">
                    Alt: {link.altUrl}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-surface-border flex items-center justify-between font-mono text-[11px] text-text-faint">
          <span>Supports path `/submit`, `/admin`, `/track` & query `?page=...`</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-pure transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

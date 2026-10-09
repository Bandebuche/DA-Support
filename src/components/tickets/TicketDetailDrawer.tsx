import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus } from '../../types/ticket';
import { LiveStopwatch } from '../stopwatch/LiveStopwatch';
import { Badge } from '../ui/Badge';
import { formatDurationHuman } from '../../lib/stopwatch';
import { formatToISTDateString, formatToISTTimeString, formatToISTDateTimeString } from '../../lib/timezone';
import { 
  X, 
  Play, 
  CheckCircle, 
  MessageCircle, 
  Mail, 
  Phone, 
  User, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  ExternalLink, 
  Edit3, 
  Send, 
  History, 
  Cloud, 
  AlertCircle,
  FileText,
  Sliders
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface TicketDetailDrawerProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onStartSupport: (ticketId: string) => void;
  onResolveTicket: (ticket: Ticket) => void;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
  onAddInternalNote: (ticketId: string, content: string) => void;
  onOpenManualOverride: (ticket: Ticket) => void;
}

export const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({
  ticket,
  isOpen,
  onClose,
  onStartSupport,
  onResolveTicket,
  onStatusChange,
  onAddInternalNote,
  onOpenManualOverride,
}) => {
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !ticket) return null;

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsSubmittingNote(true);
    try {
      onAddInternalNote(ticket.ticketId, newNote.trim());
      setNewNote('');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const isDiamond = ticket.membershipTier === 'Diamond Elite';
  const isLive = ticket.status === 'In Progress' && !!ticket.supportStartedAt;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-text">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-void/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-surface-obsidian border-l border-surface-border shadow-2xl backdrop-blur-2xl flex flex-col h-full">
          
          {/* Header */}
          <div className="p-6 border-b border-surface-border flex items-start justify-between bg-surface-elevated/40">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-base font-black text-white tracking-wider">
                  {ticket.ticketId}
                </span>
                {isDiamond && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-500/20 text-neon-electric border border-violet-500/30">
                    DIAMOND ELITE
                  </span>
                )}
                <Badge variant="status" value={ticket.status} size="sm" />
                <Badge variant="priority" value={ticket.priority} size="sm" />
              </div>
              <p className="text-xs font-mono text-text-faint">
                Created on {formatToISTDateTimeString(ticket.createdAt)} (IST)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenManualOverride(ticket)}
                className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-muted hover:text-white transition"
                title="Manual Record / Stopwatch Override"
              >
                <Sliders className="w-4 h-4 text-neon-electric" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-muted hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Real-time Stopwatch Bar if In Progress */}
          {isLive && (
            <div className="bg-amber-500/10 border-b border-amber-500/25 px-6 py-3.5 flex items-center justify-between shadow-[0_0_20px_-3px_rgba(245,158,11,0.2)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-mono text-amber-300 font-bold">
                  Active Stopwatch Session:
                </span>
              </div>
              <div className="flex items-center gap-3">
                <LiveStopwatch startedAtUtc={ticket.supportStartedAt!} size="md" />
                <button
                  onClick={() => onResolveTicket(ticket)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-void font-mono text-xs font-black flex items-center gap-1.5 shadow-[0_0_15px_-2px_rgba(16,185,129,0.5)] transition"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Resolve / Done
                </button>
              </div>
            </div>
          )}

          {/* Action Bar for New tickets */}
          {ticket.status === 'New' && (
            <div className="bg-surface-elevated/70 border-b border-surface-border px-6 py-3.5 flex items-center justify-between">
              <span className="text-xs font-mono text-text-muted">Unclaimed ticket in queue</span>
              <button
                onClick={() => onStartSupport(ticket.ticketId)}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-nexus-glow transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Support (Launch Stopwatch)
              </button>
            </div>
          )}

          {ticket.status === 'Resolved' && (
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-emerald-300 font-bold">Ticket Completed</span>
              </div>
              <span className="text-xs font-mono text-emerald-200">
                Total Duration: {formatDurationHuman(ticket.resolutionDurationSeconds || ticket.activeDurationSeconds || 0)}
              </span>
            </div>
          )}

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Requester Dossier */}
            <div className="bg-surface-elevated/70 border border-surface-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-pure flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neon-electric" />
                  Requester Dossier
                </h4>
                <span className="text-xs font-mono text-neon-electric">{ticket.userType}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] font-mono uppercase text-text-faint">Full Name</span>
                  <span className="font-bold text-white text-sm">{ticket.requesterName}</span>
                </div>

                <div>
                  <span className="block text-[10px] font-mono uppercase text-text-faint">Membership Tier</span>
                  <span className="font-mono text-text-pure">{ticket.membershipTier}</span>
                </div>

                <div>
                  <span className="block text-[10px] font-mono uppercase text-text-faint">WhatsApp Mobile</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-text-pure">{ticket.requesterPhone}</span>
                    <a
                      href={`https://wa.me/91${ticket.requesterPhone}?text=${encodeURIComponent(`Hello ${ticket.requesterName}, regarding your Nexus ticket ${ticket.ticketId}: `)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] flex items-center gap-1 transition"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Chat
                    </a>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-mono uppercase text-text-faint">Email Address</span>
                  <a
                    href={`mailto:${ticket.requesterEmail}`}
                    className="font-mono text-neon-electric hover:underline truncate block"
                  >
                    {ticket.requesterEmail}
                  </a>
                </div>
              </div>
            </div>

            {/* Query Details */}
            <div className="bg-surface-elevated/70 border border-surface-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-pure flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-white" />
                  Inquiry Specifications
                </h4>
                <div className="flex items-center gap-1.5 text-xs font-mono text-neon-electric">
                  <span>{ticket.ecosystem}</span>
                  <span>•</span>
                  <span>{ticket.category}</span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-mono uppercase text-text-faint mb-1">Subject</span>
                <p className="text-sm font-bold text-white">{ticket.subject}</p>
              </div>

              <div>
                <span className="block text-[10px] font-mono uppercase text-text-faint mb-1">Detailed Description</span>
                <div className="p-3.5 bg-surface-obsidian rounded-xl border border-surface-border text-xs text-text-pure leading-relaxed whitespace-pre-wrap font-sans">
                  {ticket.description}
                </div>
              </div>

              {ticket.websiteUrl && (
                <div>
                  <span className="block text-[10px] font-mono uppercase text-text-faint mb-1">Target Website</span>
                  <a
                    href={ticket.websiteUrl.startsWith('http') ? ticket.websiteUrl : `https://${ticket.websiteUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-neon-electric hover:underline flex items-center gap-1.5"
                  >
                    <span>{ticket.websiteUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Resolution Notes if Resolved */}
            {ticket.resolutionNotes && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Resolution Outcome & Notes
                </h4>
                <div className="p-3 bg-surface-obsidian rounded-xl border border-surface-border text-xs text-emerald-200 leading-relaxed whitespace-pre-wrap">
                  {ticket.resolutionNotes}
                </div>
              </div>
            )}

            {/* Internal Notes Section */}
            <div className="bg-surface-elevated/70 border border-surface-border rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-pure flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-neon-electric" />
                Internal Agent Notes ({ticket.internalNotes?.length || 0})
              </h4>

              {/* Notes List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(!ticket.internalNotes || ticket.internalNotes.length === 0) ? (
                  <p className="text-xs font-mono text-text-faint italic py-2">
                    No internal agent notes added yet.
                  </p>
                ) : (
                  ticket.internalNotes.map(note => (
                    <div key={note.id} className="p-2.5 bg-surface-obsidian rounded-xl border border-surface-border space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-text-faint">
                        <span className="font-semibold text-text-muted">{note.author}</span>
                        <span>{formatToISTDateTimeString(note.createdAt)}</span>
                      </div>
                      <p className="text-xs text-text-pure whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Input */}
              <form onSubmit={handleNoteSubmit} className="pt-2 flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Add private agent note..."
                  className="flex-1 bg-surface-obsidian text-text-pure text-xs rounded-xl border border-surface-border px-3 py-2 focus:border-neon-electric focus:outline-none placeholder:text-text-faint"
                />
                <button
                  type="submit"
                  disabled={!newNote.trim() || isSubmittingNote}
                  className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-mono font-medium flex items-center gap-1 shadow-nexus-sm transition"
                >
                  <Send className="w-3 h-3" />
                  Add
                </button>
              </form>
            </div>

            {/* Audit History Timeline */}
            <div className="bg-surface-elevated/70 border border-surface-border rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-pure flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-text-muted" />
                Audit Trail
              </h4>

              <div className="space-y-2.5">
                {(ticket.auditHistory || []).map((event, idx) => (
                  <div key={event.id || idx} className="flex items-start gap-2.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-electric mt-1.5 shrink-0" />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-semibold text-text-pure">{event.action}</span>
                        <span className="text-text-faint">{formatToISTDateTimeString(event.timestamp)}</span>
                      </div>
                      <p className="text-[11px] font-mono text-text-muted">By: {event.performedBy}</p>
                      {event.details && (
                        <p className="text-[11px] text-text-faint italic">{event.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Footer Status Controls */}
          <div className="p-4 border-t border-surface-border bg-surface-elevated flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-text-faint">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span>Technical_Support_DB • Cloud Synced</span>
            </div>

            <div className="flex items-center gap-2">
              {ticket.status === 'In Progress' && (
                <button
                  onClick={() => onStatusChange(ticket.ticketId, 'Waiting for User')}
                  className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-text-muted hover:text-white text-xs font-mono transition"
                >
                  Wait for User
                </button>
              )}

              {ticket.status === 'Waiting for User' && (
                <button
                  onClick={() => onStatusChange(ticket.ticketId, 'In Progress')}
                  className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-medium shadow-nexus-sm transition"
                >
                  Resume Session
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

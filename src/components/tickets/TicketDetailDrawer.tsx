import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus } from '../../types/ticket';
import { LiveStopwatch } from '../stopwatch/LiveStopwatch';
import { Badge } from '../ui/Badge';
import { formatDurationHuman } from '../../lib/stopwatch';
import { formatToISTDateTimeString } from '../../lib/timezone';
import { 
  X, 
  Play, 
  CheckCircle, 
  MessageCircle, 
  User, 
  ExternalLink, 
  Edit3, 
  Send, 
  History, 
  Cloud, 
  FileText,
  Sliders,
  Trash2,
  UserCheck
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
  onDeleteTicket?: (ticketId: string) => void;
  onReassignSpecialist?: (ticketId: string, specialist: string) => void;
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
  onDeleteTicket,
  onReassignSpecialist,
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
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose} 
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-surface border-l border-surface-border shadow-2xl flex flex-col h-full">
          
          {/* Header */}
          <div className="p-6 border-b border-surface-border flex items-start justify-between bg-surface-elevated/40">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                  {ticket.ticketId}
                </span>
                {isDiamond && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    DIAMOND ELITE
                  </span>
                )}
                <Badge variant="status" value={ticket.status} size="sm" />
                <Badge variant="priority" value={ticket.priority} size="sm" />
              </div>
              <p className="text-xs text-text-muted">
                Created on <span className="font-mono">{formatToISTDateTimeString(ticket.createdAt)}</span> (IST)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenManualOverride(ticket)}
                className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-soft hover:text-text-pure transition"
                title="Manual Record / Stopwatch Override"
              >
                <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </button>

              {onDeleteTicket && (
                <button
                  onClick={() => {
                    if (window.confirm(`Delete ticket ${ticket.ticketId}? This action cannot be undone.`)) {
                      onDeleteTicket(ticket.ticketId);
                      onClose();
                    }
                  }}
                  className="p-2 rounded-xl bg-surface-elevated hover:bg-red-50 dark:hover:bg-red-950/40 border border-surface-border hover:border-red-200 dark:hover:border-red-800 text-text-muted hover:text-red-600 dark:hover:text-red-400 transition"
                  title="Delete Ticket"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-soft hover:text-text-pure transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Real-time Stopwatch Bar if In Progress */}
          {isLive && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/40 px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs text-amber-900 dark:text-amber-200 font-bold">
                  Active Stopwatch Session:
                </span>
              </div>
              <div className="flex items-center gap-3">
                <LiveStopwatch startedAtUtc={ticket.supportStartedAt!} size="md" />
                <button
                  onClick={() => onResolveTicket(ticket)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
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
              <span className="text-xs text-text-muted">Unclaimed ticket in queue</span>
              <button
                onClick={() => onStartSupport(ticket.ticketId)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Support (Launch Stopwatch)
              </button>
            </div>
          )}

          {ticket.status === 'Resolved' && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-800/40 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">Ticket Completed</span>
              </div>
              <span className="text-xs font-mono text-emerald-700 dark:text-emerald-300 font-semibold">
                Total Duration: {formatDurationHuman(ticket.resolutionDurationSeconds || ticket.activeDurationSeconds || 0)}
              </span>
            </div>
          )}

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Requester Dossier */}
            <div className="bg-surface border border-surface-border rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-pure flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Requester Details
                </h4>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{ticket.userType}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[11px] font-medium text-text-muted">Full Name</span>
                  <span className="font-bold text-text-pure text-sm">{ticket.requesterName}</span>
                </div>

                <div>
                  <span className="block text-[11px] font-medium text-text-muted">Membership Tier</span>
                  <span className="font-medium text-text-pure">{ticket.membershipTier}</span>
                </div>

                <div>
                  <span className="block text-[11px] font-medium text-text-muted">WhatsApp Mobile</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-medium text-text-pure">{ticket.requesterPhone}</span>
                    <a
                      href={`https://wa.me/91${ticket.requesterPhone}?text=${encodeURIComponent(`Hello ${ticket.requesterName}, regarding your Digital Azadi Support ticket ${ticket.ticketId}: `)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium flex items-center gap-1 transition"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Chat
                    </a>
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-medium text-text-muted">Email Address</span>
                  <a
                    href={`mailto:${ticket.requesterEmail}`}
                    className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
                  >
                    {ticket.requesterEmail}
                  </a>
                </div>

                {ticket.city && (
                  <div>
                    <span className="block text-[11px] font-medium text-text-muted">City</span>
                    <span className="font-semibold text-text-pure">{ticket.city}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Specialist Assignment & Re-route */}
            <div className="bg-surface border border-surface-border rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-pure flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Assigned Specialist
                </h4>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {ticket.assignedSpecialist || 'General Support Desk'}
                </span>
              </div>
              <div className="space-y-1.5">
                <span className="block text-[11px] font-medium text-text-muted">
                  Reassign to Specialist:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'Sachin Sir', label: 'Sachin Sir', badge: 'All Other Ops' },
                    { id: 'Onkar Kulkarni', label: 'Onkar Kulkarni', badge: 'Meta Only' },
                    { id: 'General Support Desk', label: 'General Desk', badge: 'Triage' },
                  ].map(spec => {
                    const isCurrent = (ticket.assignedSpecialist || 'General Support Desk') === spec.id;
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => onReassignSpecialist?.(ticket.ticketId, spec.id)}
                        className={cn(
                          'p-2 rounded-xl text-left border transition flex flex-col justify-between text-xs font-semibold',
                          isCurrent
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-surface-elevated text-text-soft border-surface-border hover:text-text-pure hover:border-slate-300 dark:hover:border-slate-700'
                        )}
                      >
                        <span className="block truncate">{spec.label}</span>
                        <span className={cn(
                          'text-[10px] font-normal block mt-0.5 truncate',
                          isCurrent ? 'text-indigo-100' : 'text-text-muted'
                        )}>
                          {spec.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Query Details */}
            <div className="bg-surface border border-surface-border rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-pure flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Inquiry Specifications
                </h4>
                <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  <span>{ticket.ecosystem}</span>
                  <span>•</span>
                  <span>{ticket.category}</span>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-medium text-text-muted mb-1">Subject</span>
                <p className="text-sm font-bold text-text-pure">{ticket.subject}</p>
              </div>

              <div>
                <span className="block text-[11px] font-medium text-text-muted mb-1">Detailed Description</span>
                <div className="p-3.5 bg-surface-elevated rounded-xl border border-surface-border text-xs text-text-soft leading-relaxed whitespace-pre-wrap">
                  {ticket.description}
                </div>
              </div>

              {ticket.websiteUrl && (
                <div>
                  <span className="block text-[11px] font-medium text-text-muted mb-1">Target Website</span>
                  <a
                    href={ticket.websiteUrl.startsWith('http') ? ticket.websiteUrl : `https://${ticket.websiteUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
                  >
                    <span>{ticket.websiteUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Resolution Notes if Resolved */}
            {ticket.resolutionNotes && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Resolution Outcome & Notes
                </h4>
                <div className="p-3 bg-surface rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-text-pure leading-relaxed whitespace-pre-wrap">
                  {ticket.resolutionNotes}
                </div>
              </div>
            )}

            {/* Internal Notes Section */}
            <div className="bg-surface border border-surface-border rounded-2xl p-4 space-y-3 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-pure flex items-center gap-1.5 border-b border-surface-border pb-2.5">
                <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Internal Agent Notes ({ticket.internalNotes?.length || 0})
              </h4>

              {/* Notes List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(!ticket.internalNotes || ticket.internalNotes.length === 0) ? (
                  <p className="text-xs text-text-muted italic py-2">
                    No internal agent notes added yet.
                  </p>
                ) : (
                  ticket.internalNotes.map(note => (
                    <div key={note.id} className="p-2.5 bg-surface-elevated rounded-xl border border-surface-border space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-text-muted">
                        <span className="font-semibold text-text-soft">{note.author}</span>
                        <span className="font-mono">{formatToISTDateTimeString(note.createdAt)}</span>
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
                  className="flex-1 bg-surface-elevated text-text-pure text-xs rounded-xl border border-surface-border px-3 py-2 focus:border-indigo-500 focus:outline-none placeholder:text-text-faint"
                />
                <button
                  type="submit"
                  disabled={!newNote.trim() || isSubmittingNote}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                >
                  <Send className="w-3 h-3" />
                  Add
                </button>
              </form>
            </div>

            {/* Audit History Timeline */}
            <div className="bg-surface border border-surface-border rounded-2xl p-4 space-y-3 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-pure flex items-center gap-1.5 border-b border-surface-border pb-2.5">
                <History className="w-4 h-4 text-text-muted" />
                Audit Trail
              </h4>

              <div className="space-y-2.5">
                {(ticket.auditHistory || []).map((event, idx) => (
                  <div key={event.id || idx} className="flex items-start gap-2.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-text-pure">{event.action}</span>
                        <span className="text-text-muted font-mono">{formatToISTDateTimeString(event.timestamp)}</span>
                      </div>
                      <p className="text-[11px] text-text-muted">By: {event.performedBy}</p>
                      {event.details && (
                        <p className="text-[11px] text-text-muted italic">{event.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Footer Status Controls */}
          <div className="p-4 border-t border-surface-border bg-surface-elevated flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Technical_Support_DB • Cloud Synced</span>
            </div>

            <div className="flex items-center gap-2">
              {ticket.status === 'In Progress' && (
                <button
                  onClick={() => onStatusChange(ticket.ticketId, 'Waiting for User')}
                  className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-text-soft hover:text-text-pure text-xs font-medium transition"
                >
                  Wait for User
                </button>
              )}

              {ticket.status === 'Waiting for User' && (
                <button
                  onClick={() => onStatusChange(ticket.ticketId, 'In Progress')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
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

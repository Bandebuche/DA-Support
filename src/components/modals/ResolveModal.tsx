import React, { useState } from 'react';
import { Ticket } from '../../types/ticket';
import { formatDurationHuman, computeElapsedSeconds } from '../../lib/stopwatch';
import { 
  X, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileCheck
} from 'lucide-react';

interface ResolveModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ticketId: string, resolutionNotes: string) => void;
}

export const ResolveModal: React.FC<ResolveModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !ticket) return null;

  // Approximate duration up to now
  const elapsed = ticket.supportStartedAt 
    ? computeElapsedSeconds(ticket.supportStartedAt, new Date().toISOString())
    : ticket.activeDurationSeconds || 60;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      onConfirm(ticket.ticketId, resolutionNotes);
      setResolutionNotes('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-void/85 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative bg-surface-obsidian border border-neon-violet/30 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl backdrop-blur-2xl z-10">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_-2px_rgba(16,185,129,0.4)]">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                Complete Support Session
              </h3>
              <p className="text-xs font-mono text-neon-electric">
                Ticket: {ticket.ticketId} • {ticket.requesterName}
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

        {/* Stopwatch summary banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between font-mono shadow-[0_0_15px_-3px_rgba(245,158,11,0.25)]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-300 font-bold">Total Stopwatch Duration:</span>
          </div>
          <span className="text-sm font-bold text-amber-200 tracking-wider">
            {formatDurationHuman(elapsed)}
          </span>
        </div>

        {/* Resolution Notes Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-text-faint mb-1.5">
              Resolution Summary / Solution Provided <span className="text-[#FF5500]">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              placeholder="e.g. Configured Chakravyuh CRM lead webhook token, verified live lead reception, and confirmed student login in LMS."
              className="w-full bg-surface-elevated text-text-pure text-xs rounded-xl border border-surface-border p-3.5 focus:border-neon-electric focus:outline-none placeholder:text-text-faint resize-none leading-relaxed"
            />
            <p className="text-[11px] font-mono text-text-faint mt-1">
              Synchronized instantly to Google Sheets <code className="text-emerald-400">Technical_Support_DB</code> without duplicate entries.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-xs font-mono text-text-muted hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !resolutionNotes.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-void text-xs font-mono font-black flex items-center gap-2 shadow-[0_0_20px_-3px_rgba(16,185,129,0.5)] transition"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Complete & Mark Done
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

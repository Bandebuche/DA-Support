import React, { useState } from 'react';
import { Ticket } from '../../types/ticket';
import { formatDurationHuman, computeElapsedSeconds } from '../../lib/stopwatch';
import { 
  X, 
  CheckCircle, 
  Clock 
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
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative bg-surface border border-surface-border rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl z-10 text-xs">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-pure">
                Complete Support Session
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Ticket: <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{ticket.ticketId}</span> • {ticket.requesterName}
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

        {/* Stopwatch summary banner */}
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold">Total Session Duration:</span>
          </div>
          <span className="text-sm font-bold font-mono text-amber-900 dark:text-amber-200">
            {formatDurationHuman(elapsed)}
          </span>
        </div>

        {/* Resolution Notes Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Resolution Summary / Solution Provided <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              placeholder="e.g. Configured Chakravyuh CRM lead webhook token, verified live lead reception, and confirmed student login in LMS."
              className="w-full bg-surface-elevated text-text-pure text-xs rounded-xl border border-surface-border p-3.5 focus:border-indigo-500 focus:outline-none placeholder:text-text-faint resize-none leading-relaxed"
            />
            <p className="text-[11px] text-text-muted mt-1">
              Synchronized instantly to Google Sheets <code className="font-mono text-emerald-700 dark:text-emerald-400">Technical_Support_DB</code> without duplicate entries.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-xs text-text-soft hover:text-text-pure transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !resolutionNotes.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <CheckCircle className="w-4 h-4" />
              Complete & Mark Done
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

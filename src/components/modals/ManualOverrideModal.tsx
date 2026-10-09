import React, { useState } from 'react';
import { Ticket, TicketStatus } from '../../types/ticket';
import { 
  X, 
  Sliders, 
  Check, 
  ShieldAlert 
} from 'lucide-react';

interface ManualOverrideModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveOverride: (
    ticketId: string, 
    data: { 
      status?: TicketStatus; 
      durationSeconds?: number; 
      resolutionNotes?: string; 
      agentName: string;
    }
  ) => void;
}

export const ManualOverrideModal: React.FC<ManualOverrideModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onSaveOverride,
}) => {
  if (!isOpen || !ticket) return null;

  const currentDurationMins = Math.round(
    (ticket.resolutionDurationSeconds || ticket.activeDurationSeconds || 0) / 60
  );

  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [durationMinutes, setDurationMinutes] = useState<number>(currentDurationMins);
  const [resolutionNotes, setResolutionNotes] = useState<string>(ticket.resolutionNotes || '');
  const [agentName, setAgentName] = useState<string>(ticket.assignedAgent || 'Support Lead');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      onSaveOverride(ticket.ticketId, {
        status,
        durationSeconds: Math.max(0, durationMinutes * 60),
        resolutionNotes: resolutionNotes.trim(),
        agentName: agentName.trim() || 'Admin Override',
      });
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
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-pure">
                Manual Timing & Status Override
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Ticket: <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{ticket.ticketId}</span>
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

        {/* Warning Banner */}
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
            Manual overrides adjust timing and status directly. This modification will be logged in the audit trail.
          </p>
        </div>

        {/* Override Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Target Status */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Lifecycle Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as TicketStatus)}
              className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting for User">Waiting for User</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Active Duration in Minutes */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Support Duration (Minutes)
            </label>
            <input
              type="number"
              min="0"
              max="9999"
              value={durationMinutes}
              onChange={e => setDurationMinutes(Number(e.target.value))}
              className="w-full bg-surface-elevated text-text-pure font-mono rounded-xl border border-surface-border px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-[11px] text-text-muted mt-1 block">
              Equals approximately {durationMinutes * 60} seconds.
            </span>
          </div>

          {/* Resolution / Override Note */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Override Notes / Explanation
            </label>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              placeholder="Reason for manual adjustment (e.g. Offline WhatsApp phone call assistance provided)..."
              className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border p-3 focus:border-indigo-500 focus:outline-none resize-none placeholder:text-text-faint text-xs leading-relaxed"
            />
          </div>

          {/* Agent Sign-off */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Authorizing Agent Name
            </label>
            <input
              type="text"
              required
              value={agentName}
              onChange={e => setAgentName(e.target.value)}
              className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-soft hover:text-text-pure transition font-medium text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 shadow-sm transition text-xs"
            >
              <Check className="w-3.5 h-3.5" />
              Apply Override
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

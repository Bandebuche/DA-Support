import React, { useState } from 'react';
import { Ticket, TicketStatus } from '../../types/ticket';
import { 
  X, 
  Sliders, 
  Clock, 
  AlertTriangle, 
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
        className="fixed inset-0 bg-void/85 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative bg-surface border border-surface-border rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-nexus-lg z-10">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center">
              <Sliders className="w-5 h-5 text-nexus-electric" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-pure font-mono">
                Manual Timing & Status Override
              </h3>
              <p className="text-xs font-mono text-text-muted">
                Ticket: {ticket.ticketId}
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

        {/* Warning Banner */}
        <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-nexus-electric shrink-0 mt-0.5" />
          <p className="text-[11px] font-mono text-text-muted leading-relaxed">
            Manual overrides bypass automated stopwatch tracking. This modification will be permanently logged to the ticket's audit trail.
          </p>
        </div>

        {/* Override Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          
          {/* Target Status */}
          <div>
            <label className="block uppercase text-text-faint mb-1.5">
              Lifecycle Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as TicketStatus)}
              className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border px-3 py-2.5 focus:border-nexus-electric focus:outline-none"
            >
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting for User">Waiting for User</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Active Duration in Minutes */}
          <div>
            <label className="block uppercase text-text-faint mb-1.5">
              Support Duration (Minutes)
            </label>
            <input
              type="number"
              min="0"
              max="9999"
              value={durationMinutes}
              onChange={e => setDurationMinutes(Number(e.target.value))}
              className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border px-3 py-2.5 focus:border-nexus-electric focus:outline-none"
            />
            <span className="text-[10px] text-text-faint mt-1 block">
              Equals approximately {durationMinutes * 60} seconds.
            </span>
          </div>

          {/* Resolution / Override Note */}
          <div>
            <label className="block uppercase text-text-faint mb-1.5">
              Resolution / Override Notes
            </label>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              placeholder="Reason for manual adjustment (e.g. Offline WhatsApp phone call assistance provided)..."
              className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border p-3 focus:border-nexus-electric focus:outline-none resize-none placeholder:text-text-faint font-sans"
            />
          </div>

          {/* Agent Sign-off */}
          <div>
            <label className="block uppercase text-text-faint mb-1.5">
              Authorizing Agent Name
            </label>
            <input
              type="text"
              required
              value={agentName}
              onChange={e => setAgentName(e.target.value)}
              className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border px-3 py-2.5 focus:border-nexus-electric focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-muted hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-nexus hover:bg-nexus-dark text-white font-bold flex items-center gap-2 shadow-nexus-sm transition"
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

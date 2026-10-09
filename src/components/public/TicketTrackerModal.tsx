import React, { useState } from 'react';
import { Ticket } from '../../types/ticket';
import { loadStoredTickets } from '../../lib/storage';
import { formatToISTDateTimeString } from '../../lib/timezone';
import { formatDurationHuman } from '../../lib/stopwatch';
import { Badge } from '../ui/Badge';
import { 
  X, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  MessageCircle, 
  Clock 
} from 'lucide-react';

interface TicketTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TicketTrackerModal: React.FC<TicketTrackerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [ticketIdQuery, setTicketIdQuery] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [matchedTicket, setMatchedTicket] = useState<Ticket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanId = ticketIdQuery.trim().toUpperCase();
    const cleanPhone = phoneQuery.replace(/\D/g, '');

    if (!cleanId) {
      setErrorMessage('Please enter your Ticket ID (e.g. DA-2026-XXXX).');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter your registered 10-digit WhatsApp number for verification.');
      return;
    }

    const all = loadStoredTickets();
    const found = all.find(
      t => t.ticketId.toUpperCase() === cleanId && t.requesterPhone.replace(/\D/g, '').endsWith(cleanPhone.slice(-10))
    );

    if (!found) {
      const idExists = all.some(t => t.ticketId.toUpperCase() === cleanId);
      if (idExists) {
        setErrorMessage('Ticket found, but phone number does not match registered details.');
      } else {
        setErrorMessage(`No ticket found with ID "${cleanId}".`);
      }
      setMatchedTicket(null);
    } else {
      setMatchedTicket(found);
    }
    setSearched(true);
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
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-pure">
                Track Ticket Status
              </h3>
              <p className="text-xs text-text-muted">
                Enter your Ticket ID and registered mobile number
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

        {/* Search Bar Form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Ticket ID
              </label>
              <input
                type="text"
                value={ticketIdQuery}
                onChange={e => setTicketIdQuery(e.target.value.toUpperCase())}
                placeholder="e.g. DA-2026-8941"
                className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border px-3.5 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none placeholder:text-text-faint"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                WhatsApp Number
              </label>
              <input
                type="tel"
                maxLength={10}
                value={phoneQuery}
                onChange={e => setPhoneQuery(e.target.value.replace(/\D/g, ''))}
                placeholder="10-Digit Mobile"
                className="w-full bg-surface-elevated text-text-pure rounded-xl border border-surface-border px-3.5 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none placeholder:text-text-faint"
              />
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-500 font-medium">{errorMessage}</p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition"
            >
              <Search className="w-3.5 h-3.5" />
              Check Status
            </button>
          </div>
        </form>

        {/* Results view */}
        {searched && matchedTicket && (
          <div className="bg-surface-elevated border border-surface-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {matchedTicket.ticketId}
              </span>
              <Badge variant="status" value={matchedTicket.status} size="sm" />
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-text-pure text-xs">{matchedTicket.subject}</h4>
              <p className="text-xs text-text-muted">
                {matchedTicket.ecosystem} • {matchedTicket.category}
              </p>
            </div>

            <div className="pt-2 border-t border-surface-border grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-text-muted block text-[11px]">Requester:</span>
                <span className="text-text-pure font-medium">{matchedTicket.requesterName}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Submitted At:</span>
                <span className="text-text-pure font-mono">{formatToISTDateTimeString(matchedTicket.createdAt)}</span>
              </div>
            </div>

            {matchedTicket.status === 'Resolved' && (
              <div className="p-3 bg-surface rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Resolution Recorded
                  </span>
                  {matchedTicket.resolutionDurationSeconds && (
                    <span className="text-text-muted font-mono text-[11px]">
                      Duration: {formatDurationHuman(matchedTicket.resolutionDurationSeconds)}
                    </span>
                  )}
                </div>
                {matchedTicket.resolutionNotes && (
                  <p className="text-xs text-text-pure leading-relaxed">
                    {matchedTicket.resolutionNotes}
                  </p>
                )}
              </div>
            )}

            {matchedTicket.status === 'In Progress' && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                  A support engineer is actively working on your issue.
                </span>
              </div>
            )}

            {/* Follow up button */}
            <div className="pt-1">
              <a
                href={`https://wa.me/919823012345?text=${encodeURIComponent(`Hello Digital Azadi Support, I am following up on ticket ${matchedTicket.ticketId}`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 rounded-xl bg-surface hover:bg-surface-elevated border border-surface-border text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Chat with Support Desk on WhatsApp
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

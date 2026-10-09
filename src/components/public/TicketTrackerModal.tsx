import React, { useState } from 'react';
import { Ticket } from '../../types/ticket';
import { loadStoredTickets } from '../../lib/storage';
import { formatToISTDateTimeString } from '../../lib/timezone';
import { formatDurationHuman } from '../../lib/stopwatch';
import { Badge } from '../ui/Badge';
import { 
  X, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MessageCircle, 
  FileText,
  User,
  ExternalLink
} from 'lucide-react';

interface TicketTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TicketTrackerModal: React.FC<TicketTrackerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [matchedTicket, setMatchedTicket] = useState<Ticket | null>(null);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim().toUpperCase();
    if (!clean) return;

    const all = loadStoredTickets();
    const found = all.find(
      t => t.ticketId.toUpperCase() === clean || t.requesterPhone === query.trim()
    );

    setMatchedTicket(found || null);
    setSearched(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-void/85 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative bg-surface border border-surface-border rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-nexus-lg z-10 text-xs">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center">
              <Search className="w-5 h-5 text-nexus-electric" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-pure font-mono">
                Track Ticket Status
              </h3>
              <p className="text-xs font-mono text-text-muted">
                Enter your Ticket ID or registered mobile number
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

        {/* Search Bar Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. NEXUS-2026-8941 or 9823012345"
            className="flex-1 bg-surface-elevated text-text-pure rounded-xl border border-surface-border px-3.5 py-2.5 text-xs font-mono focus:border-nexus-electric focus:outline-none placeholder:text-text-faint"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-nexus hover:bg-nexus-dark text-white font-mono font-medium rounded-xl flex items-center gap-1.5 shadow-nexus-sm transition"
          >
            <Search className="w-3.5 h-3.5" />
            Check
          </button>
        </form>

        {/* Results view */}
        {searched && (
          <div>
            {matchedTicket ? (
              <div className="bg-surface-elevated border border-surface-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-text-pure">
                    {matchedTicket.ticketId}
                  </span>
                  <Badge variant="status" value={matchedTicket.status} size="sm" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-text-pure text-xs">{matchedTicket.subject}</h4>
                  <p className="text-[11px] font-mono text-nexus-electric">
                    {matchedTicket.ecosystem} • {matchedTicket.category}
                  </p>
                </div>

                <div className="pt-2 border-t border-surface-border grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-text-faint block">Requester:</span>
                    <span className="text-text-pure">{matchedTicket.requesterName}</span>
                  </div>
                  <div>
                    <span className="text-text-faint block">Submitted At:</span>
                    <span className="text-text-pure">{formatToISTDateTimeString(matchedTicket.createdAt)} IST</span>
                  </div>
                </div>

                {matchedTicket.status === 'Resolved' && (
                  <div className="p-3 bg-surface rounded-xl border border-surface-border space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-white font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                        Resolution Recorded
                      </span>
                      {matchedTicket.resolutionDurationSeconds && (
                        <span className="text-nexus-electric">
                          Time taken: {formatDurationHuman(matchedTicket.resolutionDurationSeconds)}
                        </span>
                      )}
                    </div>
                    {matchedTicket.resolutionNotes && (
                      <p className="text-[11px] text-text-pure leading-relaxed">
                        {matchedTicket.resolutionNotes}
                      </p>
                    )}
                  </div>
                )}

                {matchedTicket.status === 'In Progress' && (
                  <div className="p-3 bg-nexus/10 rounded-xl border border-nexus/30 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-nexus-electric animate-ping" />
                    <span className="text-[11px] font-mono text-text-pure">
                      An agent is actively working on your issue.
                    </span>
                  </div>
                )}

                {/* Follow up button */}
                <div className="pt-1">
                  <a
                    href={`https://wa.me/919823012345?text=${encodeURIComponent(`Hello Nexus Support, I am following up on ticket ${matchedTicket.ticketId}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-nexus-electric hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Chat with Support Desk on WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-surface-elevated border border-surface-border rounded-xl space-y-2">
                <AlertCircle className="w-6 h-6 text-text-faint mx-auto" />
                <p className="text-xs font-mono text-text-muted">
                  No ticket found matching <span className="text-text-pure font-bold">"{query}"</span>
                </p>
                <p className="text-[11px] font-mono text-text-faint">
                  Please verify your Ticket ID or mobile number and try again.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

import React from 'react';
import { Ticket, TicketStatus } from '../../types/ticket';
import { LiveStopwatch } from '../stopwatch/LiveStopwatch';
import { Badge } from '../ui/Badge';
import { formatDurationHuman } from '../../lib/stopwatch';
import { formatToISTDateString, formatToISTTimeString } from '../../lib/timezone';
import { 
  Play, 
  CheckCircle, 
  MessageCircle, 
  Sparkles 
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface TicketCardGridProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onStartSupport: (ticketId: string) => void;
  onResolveTicket: (ticket: Ticket) => void;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
}

export const TicketCardGrid: React.FC<TicketCardGridProps> = ({
  tickets,
  onSelectTicket,
  onStartSupport,
  onResolveTicket,
}) => {
  if (tickets.length === 0) {
    return (
      <div className="bg-surface border border-surface-border rounded-2xl p-12 text-center shadow-sm">
        <p className="text-sm font-medium text-text-muted">No tickets match the selected filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {tickets.map(ticket => {
        const isDiamond = ticket.membershipTier === 'Diamond Elite';
        const isLive = ticket.status === 'In Progress' && !!ticket.supportStartedAt;

        return (
          <div
            key={ticket.id}
            onClick={() => onSelectTicket(ticket)}
            className={cn(
              'bg-surface hover:bg-surface-elevated/50 border border-surface-border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md hover:border-indigo-400/50',
              isDiamond && 'border-l-4 border-l-indigo-500'
            )}
          >
            {/* Header: ID, Diamond badge, Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                    {ticket.ticketId}
                  </span>
                  {isDiamond && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Diamond
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Badge variant="status" value={ticket.status} size="sm" />
                </div>
              </div>

              {/* Category & Ecosystem Chip */}
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span className="px-2 py-0.5 rounded-md bg-surface-elevated border border-surface-border font-medium">
                  {ticket.userType.includes('Franchise') ? '🏢 Franchise' : '👨‍🎓 Student'}
                </span>
                <span>•</span>
                <span className="truncate">
                  {ticket.ecosystem.replace(' CRM', '')}
                </span>
              </div>

              {/* Subject & Description */}
              <div>
                <h3 className="text-sm font-bold text-text-pure group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {ticket.subject}
                </h3>
                <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mt-1">
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* Bottom Module: Requester & Actions */}
            <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="font-semibold text-text-pure text-xs">
                  {ticket.requesterName}
                </div>
                <div className="text-[11px] font-mono text-text-muted">
                  {ticket.requesterPhone}
                </div>
              </div>

              <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                {/* WhatsApp Chat */}
                <a
                  href={`https://wa.me/91${ticket.requesterPhone}?text=${encodeURIComponent(`Hello ${ticket.requesterName}, regarding your ticket ${ticket.ticketId}: `)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-surface-elevated hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-surface-border text-emerald-600 dark:text-emerald-400 transition"
                  title="WhatsApp Chat"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>

                {ticket.status === 'New' && (
                  <button
                    onClick={() => onStartSupport(ticket.ticketId)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Start
                  </button>
                )}

                {isLive && (
                  <button
                    onClick={() => onResolveTicket(ticket)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Resolve
                  </button>
                )}
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};

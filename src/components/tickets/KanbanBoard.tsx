import React from 'react';
import { Ticket, TicketStatus } from '../../types/ticket';
import { LiveStopwatch } from '../stopwatch/LiveStopwatch';
import { Badge } from '../ui/Badge';
import { formatDurationHuman } from '../../lib/stopwatch';
import { 
  Play, 
  CheckCircle, 
  MessageCircle, 
  Sparkles 
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface KanbanBoardProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onStartSupport: (ticketId: string) => void;
  onResolveTicket: (ticket: Ticket) => void;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
}

const COLUMNS: { id: TicketStatus; label: string; description: string; dotColor: string }[] = [
  { id: 'New', label: 'New Inquiries', description: 'Incoming queue', dotColor: 'bg-indigo-500' },
  { id: 'In Progress', label: 'In Progress', description: 'Active stopwatch sessions', dotColor: 'bg-amber-500' },
  { id: 'Waiting for User', label: 'Waiting for User', description: 'Student response pending', dotColor: 'bg-slate-400' },
  { id: 'Resolved', label: 'Resolved', description: 'Closed SLA records', dotColor: 'bg-emerald-500' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tickets,
  onSelectTicket,
  onStartSupport,
  onResolveTicket,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      {COLUMNS.map(col => {
        const columnTickets = tickets.filter(t => t.status === col.id);

        return (
          <div
            key={col.id}
            className="bg-surface border border-surface-border rounded-3xl p-3.5 flex flex-col min-h-[500px] max-h-[82vh] shadow-sm"
          >
            {/* Column Header */}
            <div className="px-2 py-2 flex items-center justify-between border-b border-surface-border pb-2.5 mb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', col.dotColor)} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-pure">
                    {col.label}
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-surface-elevated text-text-muted border border-surface-border">
                    {columnTickets.length}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5 pl-4">{col.description}</p>
              </div>
            </div>

            {/* Column Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {columnTickets.length === 0 ? (
                <div className="h-28 border border-dashed border-surface-border rounded-2xl flex items-center justify-center text-center p-4">
                  <p className="text-xs text-text-muted">No tickets in this lane</p>
                </div>
              ) : (
                columnTickets.map(ticket => (
                  <div
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket)}
                    className={cn(
                      'bg-surface-elevated/70 hover:bg-surface border border-surface-border rounded-2xl p-3.5 space-y-2.5 cursor-pointer transition-all duration-150 group shadow-sm hover:shadow hover:border-indigo-400/50',
                      ticket.membershipTier === 'Diamond Elite' && 'border-l-4 border-l-indigo-500'
                    )}
                  >
                    {/* Top Row: Ticket ID & Tier */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                        {ticket.ticketId}
                      </span>
                      {ticket.membershipTier === 'Diamond Elite' && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          Diamond
                        </span>
                      )}
                    </div>

                    {/* Subject */}
                    <h4 className="text-xs font-bold text-text-pure group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {ticket.subject}
                    </h4>

                    {/* Requester & Category */}
                    <div className="text-[11px] text-text-muted flex items-center justify-between gap-2 pt-1 border-t border-surface-border">
                      <span className="font-medium truncate text-text-soft">{ticket.requesterName}</span>
                      <span className="truncate">{ticket.category}</span>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-1 pt-1" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="priority" value={ticket.priority} size="sm" />
                        <a
                          href={`https://wa.me/91${ticket.requesterPhone}?text=${encodeURIComponent(`Hello ${ticket.requesterName}, regarding your ticket ${ticket.ticketId}: `)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-xl bg-surface hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-surface-border text-emerald-600 dark:text-emerald-400 transition"
                          title="WhatsApp Chat"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </a>
                      </div>

                      {ticket.status === 'New' && (
                        <button
                          onClick={() => onStartSupport(ticket.ticketId)}
                          className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold flex items-center gap-1 transition shadow-2xs"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          Start
                        </button>
                      )}

                      {ticket.status === 'In Progress' && (
                        <button
                          onClick={() => onResolveTicket(ticket)}
                          className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 transition shadow-2xs"
                        >
                          <CheckCircle className="w-2.5 h-2.5" />
                          Resolve
                        </button>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

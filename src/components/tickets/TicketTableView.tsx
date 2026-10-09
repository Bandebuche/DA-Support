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
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface TicketTableViewProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onStartSupport: (ticketId: string) => void;
  onResolveTicket: (ticket: Ticket) => void;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
}

export const TicketTableView: React.FC<TicketTableViewProps> = ({
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
    <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-surface-border bg-surface-elevated/70 text-xs font-semibold text-text-muted select-none">
              <th className="py-3 px-4">Ticket ID</th>
              <th className="py-3 px-4">Requester</th>
              <th className="py-3 px-4">Subject & Ecosystem</th>
              <th className="py-3 px-4">Status & Timer</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Raised (IST)</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border text-xs">
            {tickets.map(ticket => {
              const isDiamond = ticket.membershipTier === 'Diamond Elite';
              const isLive = ticket.status === 'In Progress' && !!ticket.supportStartedAt;

              return (
                <tr
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket)}
                  className="hover:bg-surface-elevated/60 transition-colors cursor-pointer group"
                >
                  {/* Ticket ID */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 group-hover:underline">
                      {ticket.ticketId}
                    </span>
                  </td>

                  {/* Requester */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-text-pure flex items-center gap-1.5">
                        <span>{ticket.requesterName}</span>
                        {isDiamond && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium">
                            DIAMOND
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-muted flex items-center gap-1.5">
                        <span className="font-mono">{ticket.requesterPhone}</span>
                        <span>•</span>
                        <span>{ticket.userType.includes('Franchise') ? 'Franchise' : 'Student'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Subject & Ecosystem */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="space-y-0.5">
                      <div className="font-medium text-text-pure truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {ticket.subject}
                      </div>
                      <div className="text-xs text-text-muted truncate">
                        {ticket.ecosystem} • {ticket.category}
                      </div>
                    </div>
                  </td>

                  {/* Status & Stopwatch */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Badge variant="status" value={ticket.status} size="sm" />
                      {isLive && (
                        <LiveStopwatch 
                          startedAtUtc={ticket.supportStartedAt!} 
                          size="sm" 
                          variant="compact" 
                        />
                      )}
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge variant="priority" value={ticket.priority} size="sm" />
                  </td>

                  {/* Raised (IST) */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-text-muted">
                    <div className="font-medium">{formatToISTDateString(ticket.createdAt)}</div>
                    <div className="text-[11px] font-mono">{formatToISTTimeString(ticket.createdAt)} IST</div>
                  </td>

                  {/* Duration */}
                  <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                    {ticket.status === 'Resolved' ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        {formatDurationHuman(ticket.resolutionDurationSeconds || ticket.activeDurationSeconds || 0)}
                      </span>
                    ) : ticket.status === 'In Progress' ? (
                      <span className="text-amber-700 dark:text-amber-300 font-medium text-xs">Live</span>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {/* WhatsApp Button */}
                      <a
                        href={`https://wa.me/91${ticket.requesterPhone}?text=${encodeURIComponent(`Hello ${ticket.requesterName}, regarding your ticket ${ticket.ticketId}: `)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-surface-elevated hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-surface-border text-emerald-600 dark:text-emerald-400 transition"
                        title="Chat on WhatsApp"
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

                      {ticket.status === 'In Progress' && (
                        <button
                          onClick={() => onResolveTicket(ticket)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Resolve
                        </button>
                      )}

                      <button
                        onClick={() => onSelectTicket(ticket)}
                        className="p-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-muted hover:text-text-pure transition"
                        title="View Details"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

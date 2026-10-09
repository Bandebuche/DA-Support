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
  User, 
  Clock, 
  Sparkles, 
  ChevronRight,
  ExternalLink 
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
  onStatusChange,
}) => {
  if (tickets.length === 0) {
    return (
      <div className="bg-surface-obsidian border border-surface-border rounded-3xl p-12 text-center backdrop-blur-xl">
        <p className="text-sm font-mono text-text-muted">No tickets match the selected filters</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-obsidian border border-surface-border rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-surface-border bg-surface-elevated/70 text-[11px] font-mono uppercase tracking-wider text-text-faint select-none">
              <th className="py-3.5 px-4">Ticket ID</th>
              <th className="py-3.5 px-4">Requester</th>
              <th className="py-3.5 px-4">Ecosystem & Query</th>
              <th className="py-3.5 px-4">Status & Stopwatch</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Raised (IST)</th>
              <th className="py-3.5 px-4">Duration</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/50 text-xs">
            {tickets.map(ticket => {
              const isDiamond = ticket.membershipTier === 'Diamond Elite';
              const isLive = ticket.status === 'In Progress' && !!ticket.supportStartedAt;

              return (
                <tr
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket)}
                  className="hover:bg-surface-cosmic/80 transition cursor-pointer group"
                >
                  {/* Ticket ID */}
                  <td className="py-4 px-4 font-mono font-bold text-text-pure whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {isDiamond && (
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-electric shadow-[0_0_8px_#A78BFA]" title="Diamond Elite" />
                      )}
                      <span className="group-hover:text-neon-electric transition tracking-wider">
                        {ticket.ticketId}
                      </span>
                    </div>
                  </td>

                  {/* Requester */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{ticket.requesterName}</span>
                        {isDiamond && (
                          <span className="text-[9px] font-mono px-1 rounded bg-violet-500/20 text-neon-electric border border-violet-500/30">
                            DIAMOND
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-text-muted flex items-center gap-2">
                        <span>{ticket.requesterPhone}</span>
                        <span>•</span>
                        <span>{ticket.userType}</span>
                      </div>
                    </div>
                  </td>

                  {/* Ecosystem & Subject */}
                  <td className="py-4 px-4 max-w-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-white truncate group-hover:text-violet-200 transition">
                        {ticket.subject}
                      </div>
                      <div className="font-mono text-[11px] text-neon-electric truncate">
                        {ticket.ecosystem} • {ticket.category}
                      </div>
                    </div>
                  </td>

                  {/* Status & Stopwatch */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Badge variant="status" value={ticket.status} size="sm" />
                      {isLive && (
                        <div className="flex items-center gap-1 bg-amber-500/15 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          <LiveStopwatch 
                            startedAtUtc={ticket.supportStartedAt!} 
                            size="sm" 
                            variant="compact" 
                          />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <Badge variant="priority" value={ticket.priority} size="sm" />
                  </td>

                  {/* Raised (IST) */}
                  <td className="py-4 px-4 font-mono text-[11px] text-text-muted whitespace-nowrap">
                    <div>{formatToISTDateString(ticket.createdAt)}</div>
                    <div className="text-text-faint">{formatToISTTimeString(ticket.createdAt)} IST</div>
                  </td>

                  {/* Duration */}
                  <td className="py-4 px-4 font-mono text-[11px] whitespace-nowrap">
                    {ticket.status === 'Resolved' ? (
                      <span className="text-emerald-400 font-bold">
                        {formatDurationHuman(ticket.resolutionDurationSeconds || ticket.activeDurationSeconds || 0)}
                      </span>
                    ) : ticket.status === 'In Progress' ? (
                      <span className="text-amber-300 font-semibold">Ticking Live</span>
                    ) : (
                      <span className="text-text-faint">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {/* WhatsApp Button */}
                      <a
                        href={`https://wa.me/91${ticket.requesterPhone}?text=${encodeURIComponent(`Hello ${ticket.requesterName}, regarding your ticket ${ticket.ticketId}: `)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-surface-border text-emerald-400 hover:text-white transition"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      </a>

                      {ticket.status === 'New' && (
                        <button
                          onClick={() => onStartSupport(ticket.ticketId)}
                          className="px-3 py-1 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono text-[11px] font-bold flex items-center gap-1 shadow-nexus-glow transition"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Start
                        </button>
                      )}

                      {ticket.status === 'In Progress' && (
                        <button
                          onClick={() => onResolveTicket(ticket)}
                          className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-void font-mono text-[11px] font-black flex items-center gap-1 shadow-[0_0_15px_-2px_rgba(16,185,129,0.5)] transition"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Resolve
                        </button>
                      )}

                      <button
                        onClick={() => onSelectTicket(ticket)}
                        className="p-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-muted hover:text-white transition"
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

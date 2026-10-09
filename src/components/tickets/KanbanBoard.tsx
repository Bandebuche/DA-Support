import React from 'react';
import { Ticket, TicketStatus } from '../../types/ticket';
import { LiveStopwatch } from '../stopwatch/LiveStopwatch';
import { Badge } from '../ui/Badge';
import { formatDurationHuman } from '../../lib/stopwatch';
import { formatToISTDateString, formatToISTTimeString } from '../../lib/timezone';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  User, 
  ExternalLink, 
  Phone, 
  ArrowRight,
  MoreVertical,
  Layers,
  Sparkles,
  MessageCircle
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
  { id: 'New', label: 'New Inquiries', description: 'Incoming queue', dotColor: 'bg-violet-400' },
  { id: 'In Progress', label: 'In Progress', description: 'Active stopwatch sessions', dotColor: 'bg-amber-400 animate-ping' },
  { id: 'Waiting for User', label: 'Waiting for User', description: 'Student response pending', dotColor: 'bg-slate-400' },
  { id: 'Resolved', label: 'Resolved', description: 'Closed SLA records', dotColor: 'bg-emerald-400' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tickets,
  onSelectTicket,
  onStartSupport,
  onResolveTicket,
  onStatusChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      {COLUMNS.map(col => {
        const columnTickets = tickets.filter(t => t.status === col.id);

        return (
          <div
            key={col.id}
            className="bg-surface-obsidian border border-surface-border rounded-3xl p-3.5 flex flex-col min-h-[600px] max-h-[82vh] backdrop-blur-xl shadow-xl"
          >
            {/* Column Header */}
            <div className="px-2 py-2 flex items-center justify-between border-b border-surface-border pb-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', col.dotColor)} />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-pure">
                    {col.label}
                  </h3>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold',
                      col.id === 'In Progress' 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                        : col.id === 'Resolved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-surface-elevated text-text-muted border border-surface-border'
                    )}
                  >
                    {columnTickets.length}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-text-faint mt-0.5 pl-4">{col.description}</p>
              </div>
            </div>

            {/* Column Cards List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {columnTickets.length === 0 ? (
                <div className="h-32 border border-dashed border-surface-border rounded-2xl flex items-center justify-center text-center p-4">
                  <p className="text-xs font-mono text-text-faint">No tickets in this lane</p>
                </div>
              ) : (
                columnTickets.map(ticket => (
                  <div
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket)}
                    className={cn(
                      'bg-surface-elevated/70 hover:bg-surface-cosmic border border-surface-border rounded-2xl p-4 space-y-3 cursor-pointer transition-all duration-300 group relative backdrop-blur-md shadow-md',
                      'hover:border-neon-violet/40 hover:shadow-nexus-glow',
                      ticket.membershipTier === 'Diamond Elite' && 'border-l-4 border-l-violet-500'
                    )}
                  >
                    {/* Top Row: Ticket ID & Tier */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-black text-white group-hover:text-neon-electric transition tracking-wider">
                        {ticket.ticketId}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {ticket.membershipTier === 'Diamond Elite' && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-violet-500/20 text-neon-electric border border-violet-500/30">
                            DIAMOND
                          </span>
                        )}
                        <Badge variant="status" value={ticket.status} size="sm" />
                      </div>
                    </div>

                    {/* Requester & Ecosystem */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-violet-200 transition">
                        {ticket.subject}
                      </h4>
                      <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed font-sans">
                        {ticket.description}
                      </p>
                    </div>

                    {/* Requester info */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-text-faint pt-1 border-t border-surface-border">
                      <div className="flex items-center gap-1.5 text-text-soft truncate max-w-[140px]">
                        <User className="w-3 h-3 text-text-faint shrink-0" />
                        <span className="truncate">{ticket.requesterName}</span>
                      </div>
                      <span className="text-[10px] text-neon-electric shrink-0">
                        {ticket.ecosystem.replace(' CRM', '')}
                      </span>
                    </div>

                    {/* Active Stopwatch Counting UP */}
                    {ticket.status === 'In Progress' && ticket.supportStartedAt && (
                      <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between bg-amber-500/5 -mx-4 -mb-4 p-3 rounded-b-2xl">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          <span className="text-[10px] font-mono text-amber-300 font-bold">Live Support:</span>
                        </div>
                        <LiveStopwatch 
                          startedAtUtc={ticket.supportStartedAt} 
                          size="sm" 
                          variant="compact" 
                        />
                      </div>
                    )}

                    {ticket.status === 'Resolved' && (
                      <div className="pt-2 border-t border-surface-border flex items-center justify-between text-[11px] font-mono">
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Total Time:
                        </span>
                        <span className="text-white font-bold">
                          {formatDurationHuman(ticket.resolutionDurationSeconds || ticket.activeDurationSeconds || 0)}
                        </span>
                      </div>
                    )}

                    {/* Quick Action Dock */}
                    <div className="pt-2 flex items-center justify-between gap-1.5" onClick={e => e.stopPropagation()}>
                      {/* WhatsApp Link */}
                      <a
                        href={`https://wa.me/91${ticket.requesterPhone}?text=${encodeURIComponent(`Hello ${ticket.requesterName}, regarding your Nexus ticket ${ticket.ticketId}: `)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-surface-border text-emerald-400 hover:text-white transition"
                        title="Quick WhatsApp Chat"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      </a>

                      <div className="flex items-center gap-1.5">
                        {ticket.status === 'New' && (
                          <button
                            onClick={() => onStartSupport(ticket.ticketId)}
                            className="px-3 py-1 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-mono font-bold flex items-center gap-1 shadow-nexus-glow transition"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Start
                          </button>
                        )}

                        {ticket.status === 'In Progress' && (
                          <button
                            onClick={() => onResolveTicket(ticket)}
                            className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-void text-[11px] font-mono font-black flex items-center gap-1 shadow-[0_0_15px_-2px_rgba(16,185,129,0.5)] transition"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Resolve
                          </button>
                        )}

                        {ticket.status === 'Waiting for User' && (
                          <button
                            onClick={() => onStatusChange(ticket.ticketId, 'In Progress')}
                            className="px-3 py-1 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-white text-[11px] font-mono font-medium flex items-center gap-1 transition"
                          >
                            <ArrowRight className="w-3 h-3 text-neon-electric" />
                            Resume
                          </button>
                        )}
                      </div>
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

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
  Phone, 
  Mail, 
  ExternalLink,
  MessageCircle,
  Sliders,
  Sparkles,
  Shield,
  Zap,
  Tag
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {tickets.map(ticket => {
        const isDiamond = ticket.membershipTier === 'Diamond Elite';
        const isLive = ticket.status === 'In Progress' && !!ticket.supportStartedAt;

        return (
          <div
            key={ticket.id}
            onClick={() => onSelectTicket(ticket)}
            className={cn(
              'bg-surface-obsidian hover:bg-surface-cosmic border border-surface-border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer group relative backdrop-blur-xl shadow-lg',
              'hover:border-neon-violet/40 hover:shadow-nexus-glow',
              isDiamond && 'border-l-4 border-l-violet-500'
            )}
          >
            {/* Top Row: Glowing Monospace Ticket ID, Category Chip, and Status Badge */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-white group-hover:text-neon-electric tracking-wider transition drop-shadow-[0_0_10px_rgba(167,139,250,0.3)]">
                    {ticket.ticketId}
                  </span>
                  {isDiamond && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-violet-500/20 text-neon-electric border border-violet-500/30 flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-2.5 h-2.5 text-neon-electric" />
                      DIAMOND
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Badge variant="status" value={ticket.status} size="sm" />
                </div>
              </div>

              {/* Category & Ecosystem Chip */}
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-void/60 text-neon-electric border border-surface-border">
                  {ticket.userType === 'Franchise Hub' ? '🏢 Franchise' : '👨‍🎓 Student'} • {ticket.membershipTier.replace(' Elite', '').replace(' Pass', '')}
                </span>
                <span className="text-text-faint">•</span>
                <span className="text-text-muted truncate">
                  {ticket.ecosystem.replace(' CRM', '')}
                </span>
              </div>

              {/* Query Module: Subject & 2-Line Expandable Teaser with Tag Highlights */}
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-violet-200 transition line-clamp-1">
                  {ticket.subject}
                </h3>
                <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mt-1 font-sans">
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* Requester Dossier & Live Action Dock */}
            <div className="mt-4 pt-3 border-t border-surface-border space-y-3">
              
              {/* Requester Section */}
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-white font-bold truncate">
                  <div className="w-5 h-5 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-[10px] text-neon-electric shrink-0">
                    {ticket.requesterName.charAt(0)}
                  </div>
                  <span className="truncate">{ticket.requesterName}</span>
                </div>
                
                <div className="flex items-center gap-1 text-[11px] text-text-faint shrink-0">
                  <Clock className="w-3 h-3 text-text-faint" />
                  <span>{formatToISTTimeString(ticket.createdAt)} IST</span>
                </div>
              </div>

              {/* Live Stopwatch Counting UP Second-by-Second */}
              {isLive && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between shadow-[0_0_15px_-3px_rgba(245,158,11,0.25)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-xs font-mono text-amber-300 font-bold">Active Timer:</span>
                  </div>
                  <LiveStopwatch 
                    startedAtUtc={ticket.supportStartedAt!} 
                    size="sm" 
                    variant="compact" 
                  />
                </div>
              )}

              {ticket.status === 'Resolved' && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2 flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    Support Duration:
                  </span>
                  <span className="text-emerald-300 font-bold">
                    {formatDurationHuman(ticket.resolutionDurationSeconds || ticket.activeDurationSeconds || 0)}
                  </span>
                </div>
              )}

              {/* Live Action Dock (One-Click Timers & Direct Actions) */}
              <div 
                className="flex items-center justify-between pt-1 gap-2" 
                onClick={e => e.stopPropagation()}
              >
                {/* WhatsApp Quick Chat */}
                <a
                  href={`https://wa.me/91${ticket.requesterPhone}?text=${encodeURIComponent(`Hello ${ticket.requesterName}, regarding your Nexus ticket ${ticket.ticketId}: `)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-emerald-400 hover:text-white text-xs font-mono flex items-center gap-1.5 transition shadow-sm"
                  title="Direct WhatsApp Chat"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>

                {/* State Transition Actions */}
                {ticket.status === 'New' && (
                  <button
                    onClick={() => onStartSupport(ticket.ticketId)}
                    className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-nexus-glow transition"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Start Support</span>
                  </button>
                )}

                {ticket.status === 'In Progress' && (
                  <button
                    onClick={() => onResolveTicket(ticket)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-void text-xs font-mono font-black flex items-center gap-1.5 shadow-[0_0_20px_-3px_rgba(16,185,129,0.5)] transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Resolve / Done</span>
                  </button>
                )}

                {ticket.status === 'Waiting for User' && (
                  <button
                    onClick={() => onStatusChange(ticket.ticketId, 'In Progress')}
                    className="px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-white text-xs font-mono flex items-center gap-1.5 transition"
                  >
                    <Play className="w-3 h-3 text-neon-electric" />
                    <span>Resume Timer</span>
                  </button>
                )}

                {ticket.status === 'Resolved' && (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    Done
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

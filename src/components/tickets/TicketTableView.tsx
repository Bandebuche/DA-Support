import React, { useState, useMemo } from 'react';
import { Ticket, TicketStatus } from '../../types/ticket';
import { LiveStopwatch } from '../stopwatch/LiveStopwatch';
import { Badge } from '../ui/Badge';
import { formatDurationHuman } from '../../lib/stopwatch';
import { formatToISTDateString } from '../../lib/timezone';
import { 
  Play, 
  CheckCircle, 
  MessageCircle, 
  ChevronRight,
  Trash2,
  RotateCcw,
  CheckSquare,
  Square,
  MinusSquare,
  MoreVertical,
  User,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface TicketTableViewProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onStartSupport: (ticketId: string) => void;
  onResolveTicket: (ticket: Ticket) => void;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
  onDeleteTicket?: (ticketId: string) => void;
  onDeleteTickets?: (ticketIds: string[]) => void;
  onResetAllTickets?: () => void;
}

export const TicketTableView: React.FC<TicketTableViewProps> = ({
  tickets,
  onSelectTicket,
  onStartSupport,
  onResolveTicket,
  onDeleteTicket,
  onDeleteTickets,
  onResetAllTickets,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Check selection states
  const allSelected = useMemo(() => {
    return tickets.length > 0 && tickets.every(t => selectedIds.has(t.ticketId));
  }, [tickets, selectedIds]);

  const someSelected = useMemo(() => {
    return selectedIds.size > 0 && !allSelected;
  }, [selectedIds, allSelected]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tickets.map(t => t.ticketId)));
    }
  };

  const toggleSelectRow = (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(ticketId)) {
      next.delete(ticketId);
    } else {
      next.add(ticketId);
    }
    setSelectedIds(next);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (window.confirm(`Are you sure you want to delete ${count} selected ticket(s)? This action cannot be undone.`)) {
      onDeleteTickets?.(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleResetAll = () => {
    if (window.confirm('⚠️ WARNING: Are you sure you want to RESET and DELETE ALL tickets? All logged records will be permanently erased.')) {
      onResetAllTickets?.();
      setSelectedIds(new Set());
    }
  };

  const handleSingleDelete = (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete ticket ${ticketId}?`)) {
      onDeleteTicket?.(ticketId);
      const next = new Set(selectedIds);
      next.delete(ticketId);
      setSelectedIds(next);
    }
  };

  // Helper for requester avatar initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0].toUpperCase())
      .join('');
  };

  return (
    <div className="space-y-4">
      
      {/* Section Header: All Support Tickets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-pure tracking-tight">
            All Support Tickets
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            List of tickets opened by Customer
          </p>
        </div>

        {/* Bulk Action Controls */}
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition animate-in fade-in"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          )}

          {onResetAllTickets && (
            <button
              type="button"
              onClick={handleResetAll}
              className="px-3 py-1.5 rounded-xl bg-surface hover:bg-red-50 dark:hover:bg-red-950/40 border border-surface-border hover:border-red-200 dark:hover:border-red-800 text-text-soft hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Delete all tickets and reset database"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar Sub-bar: Latest Tickets Selector */}
      <div className="bg-surface border border-surface-border rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-text-pure hover:text-indigo-600 dark:hover:text-indigo-400 transition select-none"
          >
            {allSelected ? (
              <CheckSquare className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            ) : someSelected ? (
              <MinusSquare className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Square className="w-4.5 h-4.5 text-text-muted" />
            )}
            <span>
              Latest Tickets (Showing {tickets.length > 0 ? `01 to ${tickets.length.toString().padStart(2, '0')}` : '0'} of {tickets.length} Tickets)
            </span>
          </button>

          {selectedIds.size > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-in fade-in">
              {selectedIds.size} Selected
            </span>
          )}
        </div>
      </div>

      {/* Tickets List Container */}
      {tickets.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-2xl p-12 text-center shadow-sm space-y-4">
          <p className="text-sm font-medium text-text-muted">No tickets match the selected filters</p>
          {onResetAllTickets && (
            <button
              onClick={handleResetAll}
              className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-semibold inline-flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Ticket Store</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-surface-elevated/70 text-xs font-semibold text-text-muted select-none">
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={input => {
                        if (input) {
                          input.indeterminate = someSelected;
                        }
                      }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-3">ID</th>
                  <th className="py-3.5 px-4">Requester Name</th>
                  <th className="py-3.5 px-4">Subjects</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Assignee</th>
                  <th className="py-3.5 px-4">Create Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs">
                {tickets.map(ticket => {
                  const isSelected = selectedIds.has(ticket.ticketId);
                  const isDiamond = ticket.membershipTier.includes('Diamond');
                  const isGold = ticket.membershipTier.includes('Gold');
                  const isPmp = ticket.membershipTier.includes('PMP');
                  const isLive = ticket.status === 'In Progress' && !!ticket.supportStartedAt;

                  const specialist = ticket.assignedSpecialist || 'General Support Desk';
                  const isSachin = specialist === 'Sachin Sir';
                  const isOmkar = specialist === 'Omkar Kulkarni';

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => onSelectTicket(ticket)}
                      className={cn(
                        'transition-colors cursor-pointer group',
                        isSelected 
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/30 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40' 
                          : 'hover:bg-surface-elevated/60'
                      )}
                    >
                      {/* Row Checkbox */}
                      <td className="py-4 px-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => toggleSelectRow(ticket.ticketId, e as any)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* ID */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 group-hover:underline">
                          #{ticket.ticketId}
                        </span>
                      </td>

                      {/* Requester Name with Avatar Thumbnail */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0 border border-surface-border">
                            {getInitials(ticket.requesterName) || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-text-pure flex items-center gap-1.5">
                              <span>{ticket.requesterName}</span>
                              {isDiamond && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                                  DIAMOND
                                </span>
                              )}
                              {isGold && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                                  GOLD
                                </span>
                              )}
                              {isPmp && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                                  PMP
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-text-muted font-mono block">
                              {ticket.requesterPhone}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Subjects & Ecosystem */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="space-y-0.5">
                          <div className="font-medium text-text-pure truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {ticket.subject}
                          </div>
                          <div className="text-[11px] text-text-muted truncate">
                            {ticket.ecosystem} • {ticket.category}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border',
                            ticket.status === 'Resolved'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : ticket.status === 'In Progress'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : ticket.status === 'Waiting for User'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          )}>
                            <span className={cn(
                              'w-2 h-2 rounded-full',
                              ticket.status === 'Resolved' ? 'bg-emerald-500' :
                              ticket.status === 'In Progress' ? 'bg-blue-500 animate-pulse' :
                              ticket.status === 'Waiting for User' ? 'bg-amber-500' : 'bg-slate-400'
                            )} />
                            <span>{ticket.status}</span>
                          </span>
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
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-[11px] font-semibold border',
                          ticket.priority === 'Urgent'
                            ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                            : ticket.priority === 'High'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : ticket.priority === 'Normal'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                        )}>
                          {ticket.priority}
                        </span>
                      </td>

                      {/* Assignee (Sachin Sir / Omkar Kulkarni) */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 text-white',
                            isSachin ? 'bg-emerald-600' : isOmkar ? 'bg-indigo-600' : 'bg-slate-600'
                          )}>
                            {isSachin ? 'SS' : isOmkar ? 'OK' : 'GD'}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-text-pure block leading-tight">
                              {specialist}
                            </span>
                            <span className={cn(
                              'text-[10px] font-semibold block',
                              isSachin 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : isOmkar 
                                ? 'text-indigo-600 dark:text-indigo-400' 
                                : 'text-text-muted'
                            )}>
                              {isSachin ? 'All Other Ops' : isOmkar ? 'Meta Related' : 'Triage Desk'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Create Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-text-muted">
                        <span className="font-medium">{formatToISTDateString(ticket.createdAt)}</span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp */}
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

                          {onDeleteTicket && (
                            <button
                              type="button"
                              onClick={e => handleSingleDelete(ticket.ticketId, e)}
                              className="p-1.5 rounded-lg bg-surface-elevated hover:bg-red-50 dark:hover:bg-red-950/30 border border-surface-border text-text-muted hover:text-red-600 dark:hover:text-red-400 transition"
                              title="Delete this ticket"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      )}

    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Ticket, TicketStatus } from '../../types/ticket';
import { LiveStopwatch } from '../stopwatch/LiveStopwatch';
import { Badge } from '../ui/Badge';
import { formatDurationHuman } from '../../lib/stopwatch';
import { formatToISTDateString, formatToISTTimeString } from '../../lib/timezone';
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
  UserCheck
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

  if (tickets.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk Action & Selection Toolbar */}
      <div className="bg-surface border border-surface-border rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Select All Checkbox Button */}
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-semibold text-text-pure hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            ) : someSelected ? (
              <MinusSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Square className="w-4 h-4 text-text-muted" />
            )}
            <span>
              {allSelected 
                ? 'Deselect All' 
                : someSelected 
                ? `Select All (${tickets.length})` 
                : 'Select All'}
            </span>
          </button>

          {/* Selected Count Indicator */}
          {selectedIds.size > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold animate-in fade-in">
              {selectedIds.size} Selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Delete Selected Button */}
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

          {/* Reset / Delete All Tickets Button */}
          {onResetAllTickets && (
            <button
              type="button"
              onClick={handleResetAll}
              className="px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-red-50 dark:hover:bg-red-950/40 border border-surface-border hover:border-red-200 dark:hover:border-red-800 text-text-soft hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Delete all tickets and reset database"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-border bg-surface-elevated/70 text-xs font-semibold text-text-muted select-none">
                <th className="py-3 px-3 w-10 text-center">
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
                    title="Select All Tickets"
                  />
                </th>
                <th className="py-3 px-3">Ticket ID</th>
                <th className="py-3 px-4">Assigned Specialist</th>
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
                    {/* Checkbox Column */}
                    <td className="py-3.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => toggleSelectRow(ticket.ticketId, e as any)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* Ticket ID */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 group-hover:underline">
                        {ticket.ticketId}
                      </span>
                    </td>

                    {/* Assigned Specialist */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 text-white',
                          isSachin ? 'bg-blue-600' : isOmkar ? 'bg-emerald-600' : 'bg-slate-600'
                        )}>
                          {isSachin ? 'SS' : isOmkar ? 'OK' : 'GD'}
                        </div>
                        <span className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-md border',
                          isSachin 
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                            : isOmkar 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        )}>
                          {specialist}
                        </span>
                      </div>
                    </td>

                    {/* Requester */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-text-pure flex items-center gap-1.5">
                          <span>{ticket.requesterName}</span>
                          {isDiamond && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                              DIAMOND
                            </span>
                          )}
                          {isGold && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                              GOLD
                            </span>
                          )}
                          {isPmp && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                              PMP
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

                        {/* Single Delete Button */}
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
    </div>
  );
};

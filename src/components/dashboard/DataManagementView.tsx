import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Trash2, 
  RotateCcw, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Archive, 
  Search, 
  Filter, 
  Check, 
  X, 
  ExternalLink,
  Layers,
  FileSpreadsheet,
  Activity,
  HardDrive
} from 'lucide-react';
import { Ticket } from '../../types/ticket';
import { ticketService } from '../../services/ticketService';
import { StoredDeletedTicket, StoredDeletionAudit } from '../../lib/storage';
import { formatToISTDateTimeString } from '../../lib/timezone';
import { cn } from '../../lib/utils';
import { useToast } from '../ui/Toast';

interface DataManagementViewProps {
  tickets: Ticket[];
  onRefresh: () => void;
  currentUser: { name: string; role: string } | null;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({
  tickets,
  onRefresh,
  currentUser,
}) => {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'control' | 'trash' | 'audit'>('control');
  
  // Cloud status state
  const [syncStatus, setSyncStatus] = useState(() => ticketService.getCloudSyncStatus());
  const [isSyncing, setIsSyncing] = useState(false);

  // Trash & Audit state
  const [trashList, setTrashList] = useState<StoredDeletedTicket[]>(() => ticketService.getRecycleBinTickets());
  const [auditLogs, setAuditLogs] = useState<StoredDeletionAudit[]>(() => ticketService.getDeletionAuditLog());
  const [trashSearch, setTrashSearch] = useState('');

  // Confirmation Modals State
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);
  const [clearAllConfirmText, setClearAllConfirmText] = useState('');
  const [isProcessingClear, setIsProcessingClear] = useState(false);

  const [cleanOldModal, setCleanOldModal] = useState<{
    isOpen: boolean;
    type: 'resolved' | '7days' | '30days';
    title: string;
    description: string;
    matchingCount: number;
  }>({
    isOpen: false,
    type: 'resolved',
    title: '',
    description: '',
    matchingCount: 0,
  });

  const [singleActionModal, setSingleActionModal] = useState<{
    isOpen: boolean;
    ticketId: string;
    type: 'restore' | 'purge';
    title: string;
    description: string;
  }>({
    isOpen: false,
    ticketId: '',
    type: 'restore',
    title: '',
    description: '',
  });

  // Refresh local status & trash on tickets update or tab change
  const refreshInternalState = () => {
    setSyncStatus(ticketService.getCloudSyncStatus());
    setTrashList(ticketService.getRecycleBinTickets());
    setAuditLogs(ticketService.getDeletionAuditLog());
  };

  useEffect(() => {
    refreshInternalState();
  }, [tickets, activeSubTab]);

  // Periodic poll for cloud ping & status
  useEffect(() => {
    const timer = setInterval(() => {
      setSyncStatus(ticketService.getCloudSyncStatus());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Filtered trash records
  const filteredTrash = useMemo(() => {
    const q = trashSearch.toLowerCase().trim();
    if (!q) return trashList;
    return trashList.filter(d => 
      d.ticketId.toLowerCase().includes(q) ||
      (d.snapshot?.requesterName || '').toLowerCase().includes(q) ||
      (d.snapshot?.subject || '').toLowerCase().includes(q) ||
      (d.deletedBy || '').toLowerCase().includes(q)
    );
  }, [trashList, trashSearch]);

  // Compute clean-up counts
  const resolvedCount = useMemo(() => tickets.filter(t => t.status === 'Resolved').length, [tickets]);
  const olderThan7DaysCount = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    return tickets.filter(t => new Date(t.createdAt).getTime() < cutoff).length;
  }, [tickets]);
  const olderThan30DaysCount = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return tickets.filter(t => new Date(t.createdAt).getTime() < cutoff).length;
  }, [tickets]);

  // Handle Manual Force Cloud Sync
  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await ticketService.fetchCloudTickets();
      onRefresh();
      refreshInternalState();
      toast({
        title: 'Cloud Synchronization Complete',
        description: 'Latest records, tombstones, and deletion states verified across cloud storage.',
        type: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Sync Warning',
        description: err.message || 'Unable to sync with cloud.',
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Download Backup JSON
  const handleDownloadBackup = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      activeTicketsCount: tickets.length,
      tickets,
      recycleBin: trashList,
      auditLog: auditLogs,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `digital-azadi-support-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Backup Downloaded',
      description: `Saved ${tickets.length} active tickets to your device.`,
      type: 'info',
    });
  };

  // Handle Clear All Tickets
  const handleConfirmClearAll = async () => {
    if (clearAllConfirmText.trim().toUpperCase() !== 'CLEAR ALL') {
      toast({
        title: 'Confirmation Mismatch',
        description: 'Please type "CLEAR ALL" exactly to confirm.',
        type: 'error',
      });
      return;
    }

    setIsProcessingClear(true);
    const admin = currentUser?.name || 'Super Admin';

    try {
      await ticketService.clearAllTickets(admin, 'Admin initiated Clear All in Data Management');
      onRefresh();
      refreshInternalState();
      setClearAllModalOpen(false);
      setClearAllConfirmText('');
      toast({
        title: 'All Tickets Cleared',
        description: 'All active tickets cleared from cloud and archived to Recycle Bin. Outdated devices cannot resurrect them.',
        type: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error Clearing Tickets',
        description: err.message || 'Failed to clear cloud tickets.',
        type: 'error',
      });
    } finally {
      setIsProcessingClear(false);
    }
  };

  // Handle Clean Old Data
  const handleExecuteCleanOld = async () => {
    const admin = currentUser?.name || 'Super Admin';
    try {
      if (cleanOldModal.type === 'resolved') {
        await ticketService.clearOldData({ onlyResolved: true }, admin);
      } else if (cleanOldModal.type === '7days') {
        await ticketService.clearOldData({ olderThanDays: 7 }, admin);
      } else if (cleanOldModal.type === '30days') {
        await ticketService.clearOldData({ olderThanDays: 30 }, admin);
      }
      onRefresh();
      refreshInternalState();
      setCleanOldModal(prev => ({ ...prev, isOpen: false }));
      toast({
        title: 'Clean-up Successful',
        description: `Successfully cleaned up ${cleanOldModal.matchingCount} ticket(s) from cloud.`,
        type: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error Cleaning Data',
        description: err.message,
        type: 'error',
      });
    }
  };

  // Handle Single Restore
  const handleRestoreTicket = async (ticketId: string) => {
    const admin = currentUser?.name || 'Super Admin';
    try {
      await ticketService.restoreTicket(ticketId, admin);
      onRefresh();
      refreshInternalState();
      toast({
        title: 'Ticket Restored',
        description: `Ticket ${ticketId} restored to active queue across devices.`,
        type: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Restore Failed',
        description: err.message,
        type: 'error',
      });
    }
  };

  // Handle Single Purge
  const handlePurgeSingle = async (ticketId: string) => {
    const admin = currentUser?.name || 'Super Admin';
    try {
      await ticketService.purgeTrash([ticketId], admin);
      refreshInternalState();
      toast({
        title: 'Permanently Purged',
        description: `Ticket ${ticketId} permanently purged from Recycle Bin.`,
        type: 'info',
      });
    } catch (err: any) {
      toast({
        title: 'Purge Failed',
        description: err.message,
        type: 'error',
      });
    }
  };

  // Handle Empty All Trash
  const handleEmptyAllTrash = async () => {
    const admin = currentUser?.name || 'Super Admin';
    try {
      await ticketService.purgeTrash(undefined, admin);
      refreshInternalState();
      toast({
        title: 'Recycle Bin Emptied',
        description: 'All items permanently purged. Anti-resurrection tombstones retained.',
        type: 'info',
      });
    } catch (err: any) {
      toast({
        title: 'Error Emptying Trash',
        description: err.message,
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-surface border border-surface-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Database className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-text-pure tracking-tight">
              Data Management & Cloud Synchronization
            </h2>
          </div>
          <p className="text-xs text-text-muted">
            Permanent Data Deletion, Anti-Resurrection Tombstones, Cloud Synchronization & Safe Recovery Recycle Bin.
          </p>
        </div>

        {/* Cloud Sync Health Pill & Action */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-surface-elevated border border-surface-border text-xs font-mono">
            <span className={cn('w-2.5 h-2.5 rounded-full animate-pulse', syncStatus.isOnline ? 'bg-emerald-500' : 'bg-red-500')} />
            <span className="font-bold text-text-pure">
              {syncStatus.isOnline ? 'Cloud Synced' : 'Offline Mode'}
            </span>
            {syncStatus.pingMs > 0 && (
              <span className="text-[10px] text-text-muted">({syncStatus.pingMs}ms)</span>
            )}
          </div>

          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            title="Force instantaneous cloud synchronization"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Tickets */}
        <div className="p-4 rounded-3xl bg-surface border border-surface-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Active Cloud Tickets
            </span>
            <span className="text-2xl font-extrabold text-text-pure font-mono mt-0.5 block">
              {tickets.length}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Synchronized on all devices
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Recycle Bin Records */}
        <div className="p-4 rounded-3xl bg-surface border border-surface-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Recycle Bin (Trash)
            </span>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">
              {trashList.filter(d => Boolean(d.snapshot)).length}
            </span>
            <span className="text-[10px] text-text-muted font-medium">
              Recoverable deleted items
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Archive className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Anti-Resurrection Tombstones */}
        <div className="p-4 rounded-3xl bg-surface border border-surface-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Protected Tombstones
            </span>
            <span className="text-2xl font-extrabold text-text-pure font-mono mt-0.5 block">
              {trashList.length}
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
              Prevents zombie resurrects
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Last Cloud Sync Time */}
        <div className="p-4 rounded-3xl bg-surface border border-surface-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              Last Verified Sync
            </span>
            <span className="text-sm font-bold text-text-pure font-mono mt-1 block">
              {syncStatus.lastSyncTime ? formatToISTDateTimeString(syncStatus.lastSyncTime.toISOString()).split('at')[1]?.trim() || 'Active' : 'Live'}
            </span>
            <span className="text-[10px] text-text-muted font-medium">
              Continuous 1.5s live polling
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Segmented Sub-Tab Switcher */}
      <div className="flex border-b border-surface-border pb-1 gap-2">
        <button
          onClick={() => setActiveSubTab('control')}
          className={cn(
            'px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer',
            activeSubTab === 'control'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-text-muted hover:text-text-pure hover:bg-surface-elevated'
          )}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Data Operations & Clean-Up</span>
        </button>

        <button
          onClick={() => setActiveSubTab('trash')}
          className={cn(
            'px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer',
            activeSubTab === 'trash'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-text-muted hover:text-text-pure hover:bg-surface-elevated'
          )}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Recycle Bin ({trashList.filter(d => Boolean(d.snapshot)).length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={cn(
            'px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer',
            activeSubTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-text-muted hover:text-text-pure hover:bg-surface-elevated'
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Deletion Audit Log ({auditLogs.length})</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* SUB-TAB 1: DATA OPERATIONS & CLEAN-UP */}
      {/* ==================================================================== */}
      {activeSubTab === 'control' && (
        <div className="space-y-6">
          
          {/* Card 1: Clear All Tickets (Nuclear Action) */}
          <div className="p-6 rounded-3xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-red-900 dark:text-red-300">
                    Clear All Active Support Tickets
                  </h3>
                  <p className="text-xs text-red-700/80 dark:text-red-400 leading-relaxed">
                    Instantly wipes all {tickets.length} active queries from cloud storage and local databases. Automatically sets an authoritative cutoff timestamp to prevent outdated client caches or offline devices from restoring deleted data.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Safe recovery enabled: All cleared tickets are snapshotted in the Recycle Bin before wipe.
                </span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-elevated border border-surface-border text-text-pure text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup First</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setClearAllConfirmText('');
                    setClearAllModalOpen(true);
                  }}
                  disabled={tickets.length === 0}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All ({tickets.length} Tickets)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Filtered Old Data Clean-up */}
          <div className="p-6 rounded-3xl bg-surface border border-surface-border shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-text-pure">
                Automated Old Data Clean-Up Tools
              </h3>
              <p className="text-xs text-text-muted">
                Selectively purge resolved or aged tickets while keeping active support sessions and new queries 100% untouched.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Option A: Purge Resolved */}
              <div className="p-4 rounded-2xl bg-surface-elevated border border-surface-border flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-text-pure">Resolved Archive</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      {resolvedCount} ready
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Remove all queries with status "Resolved". Active & New tickets remain untouched.
                  </p>
                </div>

                <button
                  onClick={() => setCleanOldModal({
                    isOpen: true,
                    type: 'resolved',
                    title: 'Purge Resolved Tickets Only',
                    description: `This will remove all ${resolvedCount} resolved tickets from cloud storage and local caches. They will be archived in the Recycle Bin.`,
                    matchingCount: resolvedCount,
                  })}
                  disabled={resolvedCount === 0}
                  className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge Resolved ({resolvedCount})</span>
                </button>
              </div>

              {/* Option B: Purge Older Than 7 Days */}
              <div className="p-4 rounded-2xl bg-surface-elevated border border-surface-border flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-text-pure">Aged &gt; 7 Days</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300">
                      {olderThan7DaysCount} found
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Purge tickets older than 1 week to maintain peak performance and declutter dashboards.
                  </p>
                </div>

                <button
                  onClick={() => setCleanOldModal({
                    isOpen: true,
                    type: '7days',
                    title: 'Purge Tickets Older Than 7 Days',
                    description: `This will remove ${olderThan7DaysCount} ticket(s) submitted more than 7 days ago.`,
                    matchingCount: olderThan7DaysCount,
                  })}
                  disabled={olderThan7DaysCount === 0}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge &gt; 7 Days ({olderThan7DaysCount})</span>
                </button>
              </div>

              {/* Option C: Purge Older Than 30 Days */}
              <div className="p-4 rounded-2xl bg-surface-elevated border border-surface-border flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-text-pure">Aged &gt; 30 Days</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
                      {olderThan30DaysCount} found
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Purge legacy monthly tickets. All affected records are archived with anti-resurrection tags.
                  </p>
                </div>

                <button
                  onClick={() => setCleanOldModal({
                    isOpen: true,
                    type: '30days',
                    title: 'Purge Tickets Older Than 30 Days',
                    description: `This will remove ${olderThan30DaysCount} ticket(s) submitted more than 30 days ago.`,
                    matchingCount: olderThan30DaysCount,
                  })}
                  disabled={olderThan30DaysCount === 0}
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge &gt; 30 Days ({olderThan30DaysCount})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Cloud Synchronization Details */}
          <div className="p-6 rounded-3xl bg-surface border border-surface-border shadow-xs space-y-3">
            <h3 className="text-base font-bold text-text-pure">
              Cloud Infrastructure & Storage Architecture
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-surface-border space-y-1">
                <span className="font-bold text-text-pure block">Central Cloud Endpoint:</span>
                <code className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono break-all block">
                  {syncStatus.endpoint}
                </code>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-surface-border space-y-1">
                <span className="font-bold text-text-pure block">Anti-Resurrection Protection:</span>
                <p className="text-text-muted leading-relaxed text-[11px]">
                  Tombstone registries active in both Cloud Blob and Browser Storage. Deleted items are strictly filtered during sync.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 2: RECYCLE BIN / TRASH MANAGEMENT */}
      {/* ==================================================================== */}
      {activeSubTab === 'trash' && (
        <div className="p-6 rounded-3xl bg-surface border border-surface-border shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-text-pure">
                Recycle Bin (Trash) & Recovery Console
              </h3>
              <p className="text-xs text-text-muted">
                Restore deleted tickets to active operations or permanently purge them forever.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEmptyAllTrash}
                disabled={trashList.length === 0}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Recycle Bin</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={trashSearch}
              onChange={e => setTrashSearch(e.target.value)}
              placeholder="Search deleted records by ticket ID, requester name, or subject..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-elevated border border-surface-border text-xs text-text-pure placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Trash Records Table */}
          {filteredTrash.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted space-y-2">
              <Archive className="w-8 h-8 mx-auto text-text-faint" />
              <p>Recycle Bin is empty. No deleted tickets currently in trash.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-surface-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-elevated text-text-muted uppercase text-[10px] font-bold border-b border-surface-border">
                  <tr>
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Requester</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Deleted At</th>
                    <th className="py-3 px-4">Deleted By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-text-pure">
                  {filteredTrash.map(item => (
                    <tr key={item.ticketId} className="hover:bg-surface-hover/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {item.ticketId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold block">{item.snapshot?.requesterName || 'Unknown'}</span>
                        <span className="text-[10px] text-text-muted">{item.snapshot?.requesterPhone}</span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate" title={item.snapshot?.subject}>
                        {item.snapshot?.subject || item.reason || 'Record deleted'}
                      </td>
                      <td className="py-3 px-4 text-text-muted text-[11px]">
                        {formatToISTDateTimeString(item.deletedAt)}
                      </td>
                      <td className="py-3 px-4 text-text-muted text-[11px]">
                        {item.deletedBy || 'Admin'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.snapshot && (
                            <button
                              type="button"
                              onClick={() => handleRestoreTicket(item.ticketId)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
                              title="Restore ticket to active operations"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restore</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handlePurgeSingle(item.ticketId)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                            title="Purge permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 3: DELETION AUDIT TRAIL */}
      {/* ==================================================================== */}
      {activeSubTab === 'audit' && (
        <div className="p-6 rounded-3xl bg-surface border border-surface-border shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-text-pure">
              Admin Deletion & Audit Trail
            </h3>
            <p className="text-xs text-text-muted">
              Immutable chronological record of all deletion, clear, purge, and restore actions.
            </p>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted space-y-2">
              <Clock className="w-8 h-8 mx-auto text-text-faint" />
              <p>No deletion events recorded yet in audit history.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-surface-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-elevated text-text-muted uppercase text-[10px] font-bold border-b border-surface-border">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">Admin</th>
                    <th className="py-3 px-4">Affected Count</th>
                    <th className="py-3 px-4">Timestamp (IST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-text-pure">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-surface-hover/50 transition">
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={cn(
                          'px-2 py-0.5 rounded-md text-[10px] font-mono',
                          log.action.includes('CLEAR') ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                          log.action.includes('RESTORE') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                        )}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-sm truncate text-text-pure">
                        {log.details}
                      </td>
                      <td className="py-3 px-4 font-semibold text-text-pure">
                        {log.admin}
                      </td>
                      <td className="py-3 px-4 font-mono text-text-muted">
                        {log.affectedCount}
                      </td>
                      <td className="py-3 px-4 text-text-muted text-[11px]">
                        {formatToISTDateTimeString(log.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: HIGH SECURITY CLEAR ALL CONFIRMATION */}
      {/* ==================================================================== */}
      {clearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
            onClick={() => !isProcessingClear && setClearAllModalOpen(false)}
          />

          <div className="relative w-full max-w-md bg-surface border border-red-300 dark:border-red-900/60 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-text-pure">
                Clear All {tickets.length} Support Tickets?
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                This action will wipe all active tickets from Cloud Storage and all connected devices. All {tickets.length} tickets will be preserved in the Recycle Bin for safe recovery if needed.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-800 dark:text-red-300 space-y-2">
              <p className="font-semibold">
                To confirm permanent deletion, please type <span className="font-mono font-bold text-red-600 dark:text-red-400 underline">CLEAR ALL</span> below:
              </p>
              <input
                type="text"
                value={clearAllConfirmText}
                onChange={e => setClearAllConfirmText(e.target.value)}
                placeholder="Type CLEAR ALL to confirm"
                className="w-full h-10 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 font-mono text-xs uppercase font-bold text-text-pure focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setClearAllModalOpen(false)}
                disabled={isProcessingClear}
                className="px-4 py-2.5 rounded-xl border border-surface-border text-xs font-semibold hover:bg-surface-elevated transition cursor-pointer"
              >
                Cancel / Keep
              </button>

              <button
                type="button"
                onClick={handleConfirmClearAll}
                disabled={isProcessingClear || clearAllConfirmText.trim().toUpperCase() !== 'CLEAR ALL'}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {isProcessingClear ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Clear All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: CLEAN OLD DATA CONFIRMATION */}
      {/* ==================================================================== */}
      {cleanOldModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
            onClick={() => setCleanOldModal(prev => ({ ...prev, isOpen: false }))}
          />

          <div className="relative w-full max-w-md bg-surface border border-surface-border rounded-3xl p-6 sm:p-7 shadow-2xl z-10 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-text-pure">
                {cleanOldModal.title}
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                {cleanOldModal.description}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCleanOldModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl border border-surface-border text-xs font-semibold hover:bg-surface-elevated transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteCleanOld}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Purge ({cleanOldModal.matchingCount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

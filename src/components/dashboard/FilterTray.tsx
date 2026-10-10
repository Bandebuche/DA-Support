import React from 'react';
import { 
  Filter, 
  ArrowUpDown, 
  RotateCcw
} from 'lucide-react';
import { ProductEcosystem, MembershipTier, TicketPriority } from '../../types/ticket';
import { cn } from '../../lib/utils';

export interface FilterState {
  ecosystem: ProductEcosystem | 'all';
  membershipTier: MembershipTier | 'all';
  priority: TicketPriority | 'all';
  category: string;
  specialist: string | 'all';
  dateRange: 'all' | 'today' | 'week' | 'month';
  sortBy: 'newest' | 'oldest' | 'priority' | 'duration';
}

interface FilterTrayProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableCategories: string[];
  totalCount: number;
  filteredCount: number;
}

export const FilterTray: React.FC<FilterTrayProps> = ({
  filters,
  onFilterChange,
  availableCategories,
  totalCount,
  filteredCount,
}) => {
  const updateFilter = <K extends keyof FilterState>(key: K, val: FilterState[K]) => {
    onFilterChange({
      ...filters,
      [key]: val,
    });
  };

  const resetFilters = () => {
    onFilterChange({
      ecosystem: 'all',
      membershipTier: 'all',
      priority: 'all',
      category: 'all',
      specialist: 'all',
      dateRange: 'all',
      sortBy: 'newest',
    });
  };

  const isFiltered = 
    filters.ecosystem !== 'all' ||
    filters.membershipTier !== 'all' ||
    filters.priority !== 'all' ||
    filters.category !== 'all' ||
    filters.specialist !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.sortBy !== 'newest';

  return (
    <div className="bg-surface border border-surface-border rounded-2xl p-4 space-y-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Filter label and counts */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-text-pure font-bold tracking-wide">Filter Queue</span>
          <span className="px-2 py-0.5 rounded-md bg-surface-elevated text-text-muted border border-surface-border font-medium">
            Showing {filteredCount} of {totalCount}
          </span>
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline transition ml-2 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          )}
        </div>

        {/* Right: Sort selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted flex items-center gap-1 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
            Sort:
          </span>
          <select
            value={filters.sortBy}
            onChange={e => updateFilter('sortBy', e.target.value as FilterState['sortBy'])}
            className="bg-surface-elevated text-text-pure text-xs rounded-xl border border-surface-border px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">Highest Priority</option>
            <option value="duration">Active Time</option>
          </select>
        </div>
      </div>

      {/* Filter Selectors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
        {/* Specialist */}
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            Agents (Specialist)
          </label>
          <select
            value={filters.specialist}
            onChange={e => updateFilter('specialist', e.target.value)}
            className="w-full bg-surface-elevated text-text-pure text-xs rounded-xl border border-surface-border px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none truncate"
          >
            <option value="all">All Agents</option>
            <option value="Sachin Sir">Sachin Sir (All Other Ops)</option>
            <option value="Onkar Kulkarni">Onkar Kulkarni (Meta Only)</option>
            <option value="General Support Desk">General Desk</option>
          </select>
        </div>

        {/* Ecosystem */}
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            Ecosystem
          </label>
          <select
            value={filters.ecosystem}
            onChange={e => updateFilter('ecosystem', e.target.value as FilterState['ecosystem'])}
            className="w-full bg-surface-elevated text-text-pure text-xs rounded-xl border border-surface-border px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none truncate"
          >
            <option value="all">All Ecosystems</option>
            <option value="Chakravyuh CRM">Chakravyuh CRM</option>
            <option value="Digital Azadi Hub">Digital Azadi Hub</option>
            <option value="WordPress & Hosting">WordPress & Hosting</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Membership Tier */}
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            Membership
          </label>
          <select
            value={filters.membershipTier}
            onChange={e => updateFilter('membershipTier', e.target.value as FilterState['membershipTier'])}
            className="w-full bg-surface-elevated text-text-pure text-xs rounded-xl border border-surface-border px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none truncate"
          >
            <option value="all">All Memberships</option>
            <option value="Diamond Member">Diamond Member</option>
            <option value="Silver Member">Silver Member</option>
            <option value="Chakravyuh Member">Chakravyuh Member</option>
            <option value="Franchise Member">Franchise Member</option>
            <option value="PMP Member">PMP Member</option>
            <option value="Gold Member">Gold Member (Legacy)</option>
            <option value="Diamond Elite">Diamond Elite (Legacy)</option>
            <option value="Silver Pass">Silver Pass (Legacy)</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            Priority
          </label>
          <select
            value={filters.priority}
            onChange={e => updateFilter('priority', e.target.value as FilterState['priority'])}
            className="w-full bg-surface-elevated text-text-pure text-xs rounded-xl border border-surface-border px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none truncate"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            Category
          </label>
          <select
            value={filters.category}
            onChange={e => updateFilter('category', e.target.value)}
            className="w-full bg-surface-elevated text-text-pure text-xs rounded-xl border border-surface-border px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none truncate"
          >
            <option value="all">All Categories</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            Timeframe (IST)
          </label>
          <select
            value={filters.dateRange}
            onChange={e => updateFilter('dateRange', e.target.value as FilterState['dateRange'])}
            className="w-full bg-surface-elevated text-text-pure text-xs rounded-xl border border-surface-border px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none truncate"
          >
            <option value="all">All Time</option>
            <option value="today">Today (IST)</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>
    </div>
  );
};

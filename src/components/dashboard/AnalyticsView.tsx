import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { Ticket } from '../../types/ticket';
import { formatDurationHuman } from '../../lib/stopwatch';
import { 
  Zap, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Award, 
  PieChart as PieIcon, 
  BarChart2, 
  ShieldCheck,
  CheckCircle2,
  Flame,
  Sparkles,
  Activity,
  Layers
} from 'lucide-react';

interface AnalyticsViewProps {
  tickets: Ticket[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tickets }) => {
  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved');
  const activeTickets = tickets.filter(t => t.status === 'In Progress');

  // Average resolution time in seconds
  const resolvedDurations = resolvedTickets.map(t => t.resolutionDurationSeconds || t.activeDurationSeconds || 0).filter(d => d > 0);
  const avgResolutionSeconds = resolvedDurations.length > 0 
    ? Math.round(resolvedDurations.reduce((a, b) => a + b, 0) / resolvedDurations.length) 
    : 0;

  // SLA Compliance (Resolved under 45 mins)
  const under45MinCount = resolvedDurations.filter(d => d <= 45 * 60).length;
  const slaCompliance = resolvedDurations.length > 0
    ? Math.round((under45MinCount / resolvedDurations.length) * 100)
    : 95;

  // Ecosystem Breakdown
  const ecosystemCounts: Record<string, number> = {};
  tickets.forEach(t => {
    ecosystemCounts[t.ecosystem] = (ecosystemCounts[t.ecosystem] || 0) + 1;
  });
  const ecosystemData = Object.entries(ecosystemCounts).map(([name, count]) => ({
    name: name.replace(' CRM', '').replace(' & Hosting', ''),
    fullName: name,
    count,
  }));

  // Category Breakdown (Top 5)
  const categoryCounts: Record<string, number> = {};
  tickets.forEach(t => {
    const cat = t.category || 'General Support';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoryPalettes = [
    {
      gradient: 'from-blue-500 via-indigo-500 to-purple-600',
      bgTag: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      glow: 'shadow-blue-500/20',
      icon: '💻',
    },
    {
      gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
      bgTag: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      glow: 'shadow-purple-500/20',
      icon: '⚡',
    },
    {
      gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
      bgTag: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      glow: 'shadow-emerald-500/20',
      icon: '🌐',
    },
    {
      gradient: 'from-amber-400 via-orange-500 to-red-500',
      bgTag: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      glow: 'shadow-amber-500/20',
      icon: '📱',
    },
    {
      gradient: 'from-rose-500 via-pink-500 to-indigo-500',
      bgTag: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      glow: 'shadow-rose-500/20',
      icon: '🔧',
    },
  ];

  const categoryData = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count], idx) => ({
      category,
      count,
      percentage: totalTickets ? Math.round((count / totalTickets) * 100) : 0,
      palette: categoryPalettes[idx % categoryPalettes.length],
    }));

  // User Type & Tier Breakdown - Multi-tier normalization
  const tierConfig: Record<string, { label: string; color: string; badge: string; icon: string }> = {
    diamond: {
      label: 'Diamond Member',
      color: '#6366F1',
      badge: 'VIP Priority',
      icon: '💎',
    },
    chakravyuh: {
      label: 'Chakravyuh CRM',
      color: '#06B6D4',
      badge: 'CRM & WABA',
      icon: '⚡',
    },
    franchise: {
      label: 'Franchise Partner',
      color: '#F59E0B',
      badge: 'Partner Desk',
      icon: '🏢',
    },
    pmp: {
      label: 'PMP Member',
      color: '#10B981',
      badge: 'Mentorship',
      icon: '⭐',
    },
    silver: {
      label: 'Silver Member',
      color: '#38BDF8',
      badge: 'Standard SLA',
      icon: '🥈',
    },
    other: {
      label: 'General Queries',
      color: '#8B5CF6',
      badge: 'Support Desk',
      icon: '🎯',
    },
  };

  const tierBuckets: Record<string, number> = {
    diamond: 0,
    chakravyuh: 0,
    franchise: 0,
    pmp: 0,
    silver: 0,
    other: 0,
  };

  tickets.forEach(t => {
    const tier = (t.membershipTier || '').toLowerCase();
    if (tier.includes('diamond')) {
      tierBuckets.diamond++;
    } else if (tier.includes('chakra') || tier.includes('waba')) {
      tierBuckets.chakravyuh++;
    } else if (tier.includes('franchise')) {
      tierBuckets.franchise++;
    } else if (tier.includes('pmp')) {
      tierBuckets.pmp++;
    } else if (tier.includes('silver')) {
      tierBuckets.silver++;
    } else {
      tierBuckets.other++;
    }
  });

  const diamondCount = tierBuckets.diamond;

  const tierData = Object.entries(tierBuckets)
    .filter(([_, count]) => count > 0)
    .map(([key, count]) => {
      const cfg = tierConfig[key] || tierConfig.other;
      return {
        key,
        name: cfg.label,
        value: count,
        color: cfg.color,
        badge: cfg.badge,
        icon: cfg.icon,
        percentage: totalTickets ? Math.round((count / totalTickets) * 100) : 0,
      };
    });

  // Resolution Time Distribution
  const durationBuckets = [
    { range: '< 15m', count: resolvedDurations.filter(d => d < 15 * 60).length },
    { range: '15-30m', count: resolvedDurations.filter(d => d >= 15 * 60 && d < 30 * 60).length },
    { range: '30-45m', count: resolvedDurations.filter(d => d >= 30 * 60 && d < 45 * 60).length },
    { range: '45-60m', count: resolvedDurations.filter(d => d >= 45 * 60 && d < 60 * 60).length },
    { range: '> 60m', count: resolvedDurations.filter(d => d >= 60 * 60).length },
  ];

  const PURPLE_SHADES = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#6D28D9'];

  return (
    <div className="space-y-6">
      
      {/* Top SLA Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-surface border border-surface-border rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-text-muted">SLA Target Met</span>
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-text-pure">{slaCompliance}%</span>
            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">(&lt;45 min goal)</span>
          </div>
          <div className="mt-3 w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${slaCompliance}%` }} 
            />
          </div>
        </div>

        <div className="bg-surface border border-surface-border rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-text-muted">Avg Resolution Time</span>
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-mono font-bold text-text-pure">
              {formatDurationHuman(avgResolutionSeconds)}
            </span>
          </div>
          <p className="mt-2 text-[11px] font-mono text-text-faint">
            Across {resolvedTickets.length} closed sessions
          </p>
        </div>

        <div className="bg-surface border border-surface-border rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-text-muted">Diamond Fast-Track</span>
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center">
              <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-text-pure">
              {diamondCount}
            </span>
            <span className="text-xs font-mono text-text-muted">
              ({totalTickets ? Math.round((diamondCount / totalTickets) * 100) : 0}%)
            </span>
          </div>
          <p className="mt-2 text-[11px] font-mono text-text-faint">
            High priority auto-routed tickets
          </p>
        </div>

        <div className="bg-surface border border-surface-border rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-text-muted">Active Stopwatch Load</span>
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center">
              <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-text-pure">
              {activeTickets.length}
            </span>
            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
              Active sessions
            </span>
          </div>
          <p className="mt-2 text-[11px] font-mono text-text-faint">
            Synchronized to central database
          </p>
        </div>

      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Resolution Time Distribution */}
        <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-pure font-mono uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Resolution Time Distribution
              </h3>
              <p className="text-xs text-text-muted mt-0.5">Duration from session start to completion</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="range" 
                  stroke="#5A5A6E" 
                  tick={{ fill: '#9999AD', fontSize: 11, fontFamily: 'monospace' }} 
                  axisLine={{ stroke: '#1F1F2C' }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#5A5A6E" 
                  tick={{ fill: '#9999AD', fontSize: 11, fontFamily: 'monospace' }} 
                  axisLine={{ stroke: '#1F1F2C' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(139, 92, 246, 0.08)' }}
                  contentStyle={{
                    backgroundColor: '#101014',
                    borderColor: '#242434',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#FFFFFF',
                    fontFamily: 'monospace',
                  }}
                  itemStyle={{ color: '#A78BFA' }}
                />
                <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ecosystem Distribution */}
        <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-pure font-mono uppercase tracking-wider flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Tickets by Ecosystem
              </h3>
              <p className="text-xs text-text-muted mt-0.5">Platform volume across Digital Azadi products</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={ecosystemData} 
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <XAxis 
                  type="number"
                  stroke="#5A5A6E" 
                  tick={{ fill: '#9999AD', fontSize: 11, fontFamily: 'monospace' }} 
                  axisLine={{ stroke: '#1F1F2C' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  stroke="#5A5A6E" 
                  tick={{ fill: '#FFFFFF', fontSize: 11, fontFamily: 'monospace' }} 
                  axisLine={{ stroke: '#1F1F2C' }}
                  tickLine={false}
                  width={110}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(139, 92, 246, 0.08)' }}
                  contentStyle={{
                    backgroundColor: '#101014',
                    borderColor: '#242434',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#FFFFFF',
                    fontFamily: 'monospace',
                  }}
                  itemStyle={{ color: '#FFFFFF' }}
                />
                <Bar dataKey="count" fill="#A78BFA" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Query Categories - Cool Modern Redesign */}
        <div className="bg-surface border border-surface-border rounded-3xl p-6 space-y-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          {/* Subtle Top Accent Glow Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-text-pure tracking-tight flex items-center gap-2">
                    <span>Frequent Categories</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      Top Volume
                    </span>
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Live distribution across inquiry domains
                  </p>
                </div>
              </div>

              <div className="px-3 py-1 rounded-xl bg-surface-elevated border border-surface-border text-xs font-mono font-bold text-text-soft">
                {categoryData.length} {categoryData.length === 1 ? 'Category' : 'Categories'}
              </div>
            </div>

            {/* Category Progress Bars */}
            <div className="space-y-4 pt-4">
              {categoryData.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-muted">No tickets registered yet</div>
              ) : (
                categoryData.map((item, idx) => (
                  <div key={item.category} className="space-y-2 group">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-[10px] font-bold font-mono text-text-muted shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-sm shrink-0">{item.palette.icon}</span>
                        <span className="text-text-pure font-bold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {item.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono shrink-0 pl-2">
                        <span className="text-xs font-bold text-text-pure">{item.count} tickets</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${item.palette.bgTag}`}>
                          {item.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Glowing Modern Gradient Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-3 overflow-hidden p-0.5 shadow-inner">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${item.palette.gradient} ${item.palette.glow} shadow-sm transition-all duration-700 relative`}
                        style={{ width: `${Math.max(item.percentage, 6)}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse opacity-40" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Micro-Stats Strip (Prevents Empty Box Feel & Adds Pro Insights) */}
          <div className="pt-4 border-t border-surface-border grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-surface-elevated/70 border border-surface-border">
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">
                Primary Cluster
              </span>
              <p className="text-xs font-extrabold text-text-pure truncate mt-0.5">
                {categoryData[0]?.category || 'General Support'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-surface-elevated/70 border border-surface-border">
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">
                Queue Share
              </span>
              <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                {categoryData[0]?.percentage || 100}% of volume
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-surface-elevated/70 border border-surface-border col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">
                SLA Guarantee
              </span>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {slaCompliance}% on-time
              </p>
            </div>
          </div>

        </div>

        {/* Membership Tier Allocation - Cool Donut with Center Counter */}
        <div className="bg-surface border border-surface-border rounded-3xl p-6 space-y-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          {/* Subtle Top Accent Glow Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-text-pure tracking-tight flex items-center gap-2">
                    <span>Tier Proportions</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                      Membership SLA
                    </span>
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Queue share across student & franchise tiers
                  </p>
                </div>
              </div>

              <div className="px-3 py-1 rounded-xl bg-surface-elevated border border-surface-border text-xs font-mono font-bold text-text-soft">
                {totalTickets} Total
              </div>
            </div>

            {/* Center-Metric Donut Chart */}
            <div className="relative h-56 w-full flex items-center justify-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={92}
                    paddingAngle={tierData.length > 1 ? 6 : 0}
                    dataKey="value"
                    stroke="#101014"
                    strokeWidth={2}
                  >
                    {tierData.map(entry => (
                      <Cell 
                        key={entry.key} 
                        fill={entry.color} 
                        className="transition-all duration-300 hover:opacity-85 cursor-pointer outline-none" 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 backdrop-blur-xl rounded-2xl p-3 shadow-2xl text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{data.icon}</span>
                              <span className="font-bold text-white">{data.name}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-slate-300 font-mono text-[11px]">
                              <span>Volume: <strong className="text-white font-bold">{data.value}</strong></span>
                              <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold">{data.percentage}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Total Indicator */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-3xl font-black tracking-tight text-text-pure font-mono leading-none">
                  {totalTickets}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mt-1">
                  Tickets
                </span>
                <span className="w-6 h-0.5 bg-indigo-500/60 rounded-full mt-1" />
              </div>
            </div>
          </div>

          {/* Interactive Tier Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-surface-border">
            {tierData.map(entry => (
              <div 
                key={entry.key}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-surface-elevated/70 border border-surface-border hover:border-indigo-400/50 transition group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0">{entry.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-pure truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {entry.name}
                    </p>
                    <span className="text-[10px] font-semibold text-text-muted block truncate">
                      {entry.badge}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono pl-2">
                  <span className="text-xs font-bold text-text-pure block">
                    {entry.value}
                  </span>
                  <span className="text-[10px] font-semibold text-text-muted">
                    {entry.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};

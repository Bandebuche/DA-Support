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
  ShieldCheck 
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
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });
  const categoryData = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));

  // User Type & Tier Breakdown
  const diamondCount = tickets.filter(t => t.membershipTier === 'Diamond Elite').length;
  const silverCount = tickets.filter(t => t.membershipTier === 'Silver Pass').length;
  const otherTierCount = totalTickets - diamondCount - silverCount;

  const tierData = [
    { name: 'Diamond Elite', value: diamondCount, color: '#A78BFA' },
    { name: 'Silver Pass', value: silverCount, color: '#FFFFFF' },
    { name: 'Standard / Other', value: otherTierCount, color: '#4B4B5A' },
  ].filter(d => d.value > 0);

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
              <ShieldCheck className="w-4 h-4 text-nexus-electric" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-text-pure">{slaCompliance}%</span>
            <span className="text-xs font-mono text-nexus-electric">(&lt;45 min goal)</span>
          </div>
          <div className="mt-3 w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-nexus h-full rounded-full transition-all duration-500" 
              style={{ width: `${slaCompliance}%` }} 
            />
          </div>
        </div>

        <div className="bg-surface border border-surface-border rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-text-muted">Avg Resolution Time</span>
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
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
              <Award className="w-4 h-4 text-nexus-electric" />
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
              <Zap className="w-4 h-4 text-nexus-electric animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-text-pure">
              {activeTickets.length}
            </span>
            <span className="text-xs font-mono text-nexus-electric">
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
                <BarChart2 className="w-4 h-4 text-nexus" />
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
                <PieIcon className="w-4 h-4 text-nexus-electric" />
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

        {/* Top Query Categories */}
        <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-pure font-mono uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-white" />
                Frequent Categories
              </h3>
              <p className="text-xs text-text-muted mt-0.5">Highest volume support query subjects</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {categoryData.map((item, idx) => {
              const pct = totalTickets ? Math.round((item.count / totalTickets) * 100) : 0;
              return (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-text-pure">{item.category}</span>
                    <span className="text-text-muted">{item.count} tickets ({pct}%)</span>
                  </div>
                  <div className="w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-white h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, opacity: 0.9 - idx * 0.15 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Membership Tier Allocation */}
        <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-pure font-mono uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-nexus-electric" />
                Tier Proportions
              </h3>
              <p className="text-xs text-text-muted mt-0.5">Diamond Elite vs Silver Pass queue share</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#101014" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#101014',
                    borderColor: '#242434',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#FFFFFF',
                    fontFamily: 'monospace',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-1 text-xs font-mono">
            {tierData.map(entry => (
              <div key={entry.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-text-muted">{entry.name}: <strong className="text-text-pure">{entry.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

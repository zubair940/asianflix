import React, { useState, useEffect, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import { analyticsApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../common/LoadingSpinner.js';
import {
  TrendingUp, Users, Eye, Clock, ArrowUpRight, ArrowDownRight,
  Activity, BarChart3, PieChart as PieChartIcon, DollarSign,
  Film, Tv, Users as UsersIcon, Eye as EyeIcon, Clock as ClockIcon,
  TrendingUp as TrendingUpIcon, Plus, Circle, CheckCircle
} from 'lucide-react';

const COLORS = ['#06b6d4', '#f43f5e', '#10b981', '#fbbf24', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

const statCards = [
  { label: 'Total Dramas', key: 'totalDramas', icon: Film, color: 'text-cyan-400' },
  { label: 'Total Episodes', key: 'totalEpisodes', icon: Tv, color: 'text-pink-400' },
  { label: 'Total Users', key: 'totalUsers', icon: UsersIcon, color: 'text-purple-400' },
  { label: 'Total Views', key: 'totalViews', icon: EyeIcon, color: 'text-emerald-400' },
  { label: 'Watch Time (min)', key: 'totalWatchTimeMinutes', icon: ClockIcon, color: 'text-amber-400' },
  { label: 'Active (24h)', key: 'activeUsers24h', icon: CheckCircle, color: 'text-green-400' },
  { label: 'Active (7d)', key: 'activeUsers7d', icon: Circle, color: 'text-blue-400' },
  { label: 'New Users (24h)', key: 'newUsers24h', icon: Plus, color: 'text-rose-400' },
];

export const AdminAnalytics: React.FC = () => {
  const { showToast } = useToast();
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('7d');
  const [selectedDrama, setSelectedDrama] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['adminAnalytics', 'dashboard'],
    queryFn: analyticsApi.getDashboardStats,
    refetchInterval: 60000,
  });

  const { data: realtime, isLoading: realtimeLoading } = useQuery({
    queryKey: ['adminAnalytics', 'realtime'],
    queryFn: analyticsApi.getRealtimeStats,
    refetchInterval: 30000,
  });

  const { data: engagement, isLoading: engagementLoading } = useQuery({
    queryKey: ['adminAnalytics', 'engagement', timeRange],
    queryFn: () => analyticsApi.getUserEngagement(timeRange),
  });

  const { data: contentPerformance, isLoading: contentLoading } = useQuery({
    queryKey: ['adminAnalytics', 'content', timeRange],
    queryFn: () => analyticsApi.getContentPerformance(timeRange, 10),
  });

  const { data: retention, isLoading: retentionLoading } = useQuery({
    queryKey: ['adminAnalytics', 'retention', timeRange],
    queryFn: () => analyticsApi.getUserRetention(timeRange),
  });

  useEffect(() => {
    if (statsError) {
      showToast('Failed to load analytics data', 'error');
    }
  }, [statsError, showToast]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <LoadingSpinner label="Loading analytics..." size="lg" />
      </div>
    );
  }

  const dramaOptions = stats?.topViewed.map(d => ({ value: d.id, label: d.title })) || [];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gray-900 border border-gray-800 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-400/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Admin Analytics</h1>
              <p className="text-xs text-gray-400">Real-time platform metrics and insights</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '1h' | '24h' | '7d' | '30d')}
              className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm outline-none focus:border-cyan-400"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            {selectedDrama && (
              <select
                value={selectedDrama}
                onChange={(e) => setSelectedDrama(e.target.value || null)}
                className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm outline-none focus:border-cyan-400"
              >
                <option value="">All Dramas</option>
                {dramaOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            )}
            <button
              onClick={() => refetchStats()}
              className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              title="Refresh Data"
            >
              <Activity className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.key} className="p-5 rounded-2xl bg-gray-900 border border-gray-800 space-y-2">
                <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
                  <span>{stat.label}</span>
                  <span className={stat.color} style={{ fontSize: '1.5rem' }}>
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </span>
                </div>
                <p className="text-2xl font-black text-white">{stats ? formatNumber(stats[stat.key as keyof typeof stats] as number) : '—'}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUpIcon className="w-4 h-4 text-rose-500" /> Top Viewed Dramas
            </h3>
            <div className="space-y-3 pt-2">
              {stats?.topViewed.slice(0, 10).map((item, index) => {
                const maxViews = stats.topViewed[0]?.views || 1;
                const percentage = Math.min(100, Math.round((item.views / maxViews) * 100));
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-300">
                      <span className="font-semibold truncate max-w-[200px]">{item.title}</span>
                      <span className="font-mono text-gray-400">{formatNumber(item.views)} views</span>
                    </div>
                    <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden p-0.5 border border-gray-800">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-pink-500" /> Genre Distribution
            </h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.genreDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats?.genreDistribution?.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value.toLocaleString(), 'dramas']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800 space-y-4 lg:col-span-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <EyeIcon className="w-4 h-4 text-emerald-400" /> Content Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contentPerformance?.dramas || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis dataKey="title" type="category" width={180} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [value.toLocaleString(), 'views']} />
                <Legend />
                <Bar dataKey="views" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Views" />
                <Bar dataKey="uniqueViewers" fill="#f43f5e" radius={[0, 4, 4, 0]} name="Unique Viewers" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-purple-400" /> User Engagement
            </h3>
            <div className="space-y-4">
              {engagement && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 text-center">
                      <div className="text-2xl font-bold text-cyan-400">{engagement.totalActiveUsers}</div>
                      <div className="text-xs text-gray-400">Active Users</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 text-center">
                      <div className="text-2xl font-bold text-amber-400">{engagement.avgWatchTimePerUserMinutes} min</div>
                      <div className="text-xs text-gray-400">Avg Watch Time</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 text-center">
                      <div className="text-2xl font-bold text-emerald-400">{engagement.avgDramasPerUser}</div>
                      <div className="text-xs text-gray-400">Avg Dramas/User</div>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={engagement.userStats.slice(0, 20)}>
                        <defs>
                          <linearGradient id="colorWatchTime" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            name === 'totalWatchTimeMinutes' ? `${value} min` : value,
                            name === 'totalWatchTimeMinutes' ? 'Watch Time' : 'Dramas'
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="totalWatchTimeMinutes"
                          stroke="#06b6d4"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorWatchTime)"
                          name="Watch Time (min)"
                        />
                        <Area
                          type="monotone"
                          dataKey="dramasWatched"
                          stroke="#f43f5e"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="#f43f5e20"
                          name="Dramas Watched"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-amber-400" /> User Retention
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={retention?.cohorts?.slice(0, 6) || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="cohort" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Retention']}
                  labelFormatter={(label: string) => `Cohort: ${label}`}
                />
                <Legend />
                {retention?.cohorts?.slice(0, 6).map((cohort, index) => (
                  <Line
                    key={cohort.cohort}
                    type="monotone"
                    dataKey={cohort.cohort}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name={cohort.cohort}
                    data={cohort.retention.map(r => ({ [cohort.cohort]: r.percentage, day: r.day }))}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800 space-y-4 lg:col-span-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Realtime Activity
            </h3>
            {realtime && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gray-950 border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <EyeIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-gray-400">Currently Watching</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{realtime.currentlyWatching}</div>
                </div>
                <div className="p-4 rounded-xl bg-gray-950 border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUpIcon className="w-4 h-4 text-rose-400" />
                    <span className="text-xs text-gray-400">Completed (1h)</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{realtime.completedLastHour}</div>
                </div>
                <div className="p-4 rounded-xl bg-gray-950 border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <UsersIcon className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-400">Unique Viewers (1h)</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{realtime.uniqueViewersLastHour}</div>
                </div>
                <div className="p-4 rounded-xl bg-gray-950 border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-gray-400">Total Views (1h)</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{realtime.totalViewsLastHour}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

AdminAnalytics.displayName = 'AdminAnalytics';

export default AdminAnalytics;
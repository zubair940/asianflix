import React, { useState, useEffect, memo } from 'react';
import { useToast } from '../../context/ToastContext.js';
import { Activity, Trash2, Filter, Download, Loader2, RefreshCw, Eye, User, Shield, Plus, Edit, Trash, Clock, FileText, Video, Layers, X, Search } from 'lucide-react';

interface ActivityLogEntry {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  action: 'create' | 'update' | 'delete' | 'publish' | 'schedule' | 'bulk_create' | 'reorder' | 'moderate' | 'settings';
  resourceType: 'drama' | 'episode' | 'user' | 'review' | 'danmaku' | 'banner' | 'settings';
  resourceId: string;
  resourceTitle: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

const ACTION_ICONS = {
  create: Plus,
  update: Edit,
  delete: Trash,
  publish: Video,
  schedule: Clock,
  bulk_create: Layers,
  reorder: Activity,
  moderate: Shield,
  settings: FileText,
};

const RESOURCE_ICONS = {
  drama: FileText,
  episode: Video,
  user: User,
  review: Shield,
  danmaku: Activity,
  banner: FileText,
  settings: FileText,
};

interface AdminActivityLogProps {
  onClose: () => void;
}

const AdminActivityLog = memo(function AdminActivityLog({ onClose }: AdminActivityLogProps) {
  const { showToast } = useToast();

  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: 'all',
    resourceType: 'all',
    dateRange: 'all',
    search: '',
  });
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    const stored = localStorage.getItem('admin_activity_log');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLogs(parsed.sort((a: ActivityLogEntry, b: ActivityLogEntry) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } catch {
        setLogs([]);
      }
    }
    setLoading(false);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filters.action !== 'all' && log.action !== filters.action) return false;
    if (filters.resourceType !== 'all' && log.resourceType !== filters.resourceType) return false;
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      if (!log.resourceTitle.toLowerCase().includes(q) &&
          !log.adminName.toLowerCase().includes(q) &&
          !log.details?.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const logDate = new Date(log.timestamp);
      let cutoff: Date;
      switch (filters.dateRange) {
        case 'today': cutoff = new Date(now.setHours(0,0,0,0)); break;
        case 'week': cutoff = new Date(now.setDate(now.getDate() - 7)); break;
        case 'month': cutoff = new Date(now.setMonth(now.getMonth() - 1)); break;
        default: return true;
      }
      if (logDate < cutoff) return false;
    }
    return true;
  }).sort((a, b) => {
    const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    return sortOrder === 'desc' ? diff : -diff;
  });

  const stats = {
    total: logs.length,
    today: logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length,
    creates: logs.filter(l => l.action === 'create').length,
    deletes: logs.filter(l => l.action === 'delete').length,
    updates: logs.filter(l => l.action === 'update').length,
  };

  const exportLogs = () => {
    const csv = ['Timestamp,Admin,Action,Resource Type,Resource Title,Details'].join('\n') + '\n' +
      filteredLogs.map(l => 
        `"${new Date(l.timestamp).toISOString()}","${l.adminName}","${l.action}","${l.resourceType}","${l.resourceTitle}","${l.details || ''}"`
      ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-activity-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Activity log exported', 'success');
  };

  const clearLogs = () => {
    if (!confirm('Are you sure you want to clear ALL activity logs? This cannot be undone.')) return;
    setLogs([]);
    localStorage.removeItem('admin_activity_log');
    showToast('Activity logs cleared', 'info');
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'text-green-400 bg-green-500/10';
      case 'update': return 'text-blue-400 bg-blue-500/10';
      case 'delete': return 'text-rose-400 bg-rose-500/10';
      case 'publish': return 'text-cyan-400 bg-cyan-500/10';
      case 'schedule': return 'text-amber-400 bg-amber-500/10';
      case 'bulk_create': return 'text-purple-400 bg-purple-500/10';
      case 'reorder': return 'text-pink-400 bg-pink-500/10';
      case 'moderate': return 'text-orange-400 bg-orange-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Admin Activity Log</h2>
            <p className="text-xs text-slate-400">Track all administrative actions across the platform</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={exportLogs} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button type="button" onClick={clearLogs} className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </button>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-2xl font-extrabold text-white">{stats.total}</div>
          <div className="text-xs text-slate-400">Total Actions</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-2xl font-extrabold text-green-400">{stats.today}</div>
          <div className="text-xs text-slate-400">Today</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-2xl font-extrabold text-rose-400">{stats.deletes}</div>
          <div className="text-xs text-slate-400">Deletions</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-2xl font-extrabold text-blue-400">{stats.updates}</div>
          <div className="text-xs text-slate-400">Updates</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activity..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400"
          >
            <option value="all">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="publish">Publish</option>
            <option value="schedule">Schedule</option>
            <option value="bulk_create">Bulk Create</option>
            <option value="reorder">Reorder</option>
            <option value="moderate">Moderate</option>
            <option value="settings">Settings</option>
          </select>
          <select
            value={filters.resourceType}
            onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400"
          >
            <option value="all">All Resources</option>
            <option value="drama">Dramas</option>
            <option value="episode">Episodes</option>
            <option value="user">Users</option>
            <option value="review">Reviews</option>
            <option value="danmaku">Danmaku</option>
            <option value="banner">Banners</option>
            <option value="settings">Settings</option>
          </select>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white hover:bg-slate-800 flex items-center gap-1"
          >
            {sortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}
          </button>
        </div>
      </div>

      {/* Activity Log Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Activity Found</h3>
            <p className="text-slate-400 text-sm">No activity matches your current filters</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800 sticky top-0">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Admin</th>
                <th className="p-3">Action</th>
                <th className="p-3">Resource</th>
                <th className="p-3">Title</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredLogs.slice(0, 100).map((log) => {
                const ActionIcon = ACTION_ICONS[log.action] || Activity;
                const ResourceIcon = RESOURCE_ICONS[log.resourceType] || FileText;
                return (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="p-3 whitespace-nowrap font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-medium text-white">{log.adminName}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${getActionColor(log.action)}`}>
                        <ActionIcon className="w-3 h-3" />
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        <ResourceIcon className="w-3 h-3 text-cyan-400" />
                        {log.resourceType}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-white truncate max-w-[200px] block">{log.resourceTitle}</span>
                    </td>
                    <td className="p-3 text-slate-400 max-w-[300px] truncate">
                      {log.details || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {filteredLogs.length > 100 && (
        <div className="text-center text-sm text-slate-500 p-4">
          Showing 100 of {filteredLogs.length} entries. Export CSV for full log.
        </div>
      )}
    </div>
  );
});

AdminActivityLog.displayName = 'AdminActivityLog';

export { AdminActivityLog };

// Helper to log activity (to be used in other components)
export function logAdminActivity(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) {
  const stored = localStorage.getItem('admin_activity_log');
  const logs: ActivityLogEntry[] = stored ? JSON.parse(stored) : [];
  const newEntry: ActivityLogEntry = {
    ...entry,
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newEntry);
  // Keep only last 10000 entries
  if (logs.length > 10000) logs.length = 10000;
  localStorage.setItem('admin_activity_log', JSON.stringify(logs));
}
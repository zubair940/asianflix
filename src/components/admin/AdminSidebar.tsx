import React from 'react';
import { BarChart3, Film, Video, Users, ListOrdered, ShieldCheck } from 'lucide-react';

export type AdminTab = 'stats' | 'dramas' | 'episodes' | 'users' | 'reorder' | 'reviews';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  dramasCount?: number;
  episodesCount?: number;
  usersCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  dramasCount = 0,
  episodesCount = 0,
  usersCount = 0
}) => {
  const navItems = [
    {
      id: 'stats' as AdminTab,
      label: 'Dashboard Overview',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'dramas' as AdminTab,
      label: 'Manage Dramas',
      icon: Film,
      badge: dramasCount
    },
    {
      id: 'episodes' as AdminTab,
      label: 'Manage Episodes',
      icon: Video,
      badge: episodesCount
    },
    {
      id: 'reorder' as AdminTab,
      label: 'Reorder Episodes',
      icon: ListOrdered,
      badge: 'Drag & Drop'
    },
    {
      id: 'users' as AdminTab,
      label: 'Manage Users',
      icon: Users,
      badge: usersCount
    }
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-6">
      {/* Admin Title */}
      <div className="flex items-center gap-3 p-2 border-b border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-extrabold text-white tracking-tight">Admin Console</h2>
          <p className="text-[10px] text-slate-400 font-mono">KDramaBox Control</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

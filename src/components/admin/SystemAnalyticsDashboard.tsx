import React from 'react';
import { DashboardStats } from '../../types.js';
import { Activity, Server, Cpu, HardDrive, Wifi, Users, Film, ArrowUpRight } from 'lucide-react';

interface SystemAnalyticsDashboardProps {
  stats: DashboardStats;
}

export const SystemAnalyticsDashboard: React.FC<SystemAnalyticsDashboardProps> = ({ stats }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#00C2FF]" /> Stream Cluster & System Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Real-time mirror server health, bandwidth metrics, active watch parties, and CDN nodes.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>CDN Stream Bandwidth</span>
            <Wifi className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">4.82 Gbps</div>
          <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Peak 1080p Ultra Traffic
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Live Streamers</span>
            <Users className="w-4 h-4 text-[#00C2FF]" />
          </div>
          <div className="text-2xl font-extrabold text-white">1,480 Users</div>
          <div className="text-[11px] text-[#00C2FF] font-bold">12 Active Watch Parties</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Server CPU Load</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">18.4%</div>
          <div className="text-[11px] text-slate-400">Node Cluster Healthy</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Disk Upload Cache</span>
            <HardDrive className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">14.2 GB / 500 GB</div>
          <div className="text-[11px] text-slate-400">Byte-range Streaming Ready</div>
        </div>
      </div>

      {/* Server Mirror Node Status */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-[#00C2FF]" /> Multi-Server Streaming Mirror Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase">SERVER ALPHA (VIP)</span>
              <h4 className="text-sm font-bold text-white mt-0.5">Primary CDN Node</h4>
              <p className="text-[11px] text-slate-400">Response Ping: 18ms</p>
            </div>
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase">SERVER BETA (HLS)</span>
              <h4 className="text-sm font-bold text-white mt-0.5">Adaptive Bitrate Mirror</h4>
              <p className="text-[11px] text-slate-400">Response Ping: 24ms</p>
            </div>
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase">SERVER GAMMA (BACKUP)</span>
              <h4 className="text-sm font-bold text-white mt-0.5">MovieBox Cloud Fallback</h4>
              <p className="text-[11px] text-slate-400">Response Ping: 32ms</p>
            </div>
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

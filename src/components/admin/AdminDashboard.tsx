import React, { useState, useEffect, Suspense, lazy, memo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardStats, Drama } from '../../types.js';
import { adminService } from '../../services/adminService.js';
import { dramaService } from '../../services/dramaService.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../common/LoadingSpinner.js';
import { EmptyState } from '../common/EmptyState.js';
import { SmartImage } from '../common/SmartImage.js';
import {
  Film,
  Users,
  Eye,
  Layers,
  Plus,
  Trash2,
  Edit,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Video,
  ListOrdered,
  Activity,
  Clock,
  FileText,
  History,
  Sparkles,
  Zap,
  LayoutDashboard,
  BarChart2,
  RefreshCw
} from 'lucide-react';

const AddDrama = lazy(() => import('./AddDrama.js').then(m => ({ default: m.AddDrama })));
const AddEpisode = lazy(() => import('./AddEpisode.js').then(m => ({ default: m.AddEpisode })));
const EditDramaModal = lazy(() => import('./EditDramaModal.js').then(m => ({ default: m.EditDramaModal })));
const ReorderEpisodesModal = lazy(() => import('./ReorderEpisodesModal.js').then(m => ({ default: m.ReorderEpisodesModal })));
const ManageUsers = lazy(() => import('./ManageUsers.js').then(m => ({ default: m.ManageUsers })));
const EpisodeManagement = lazy(() => import('./EpisodeManagement.js').then(m => ({ default: m.EpisodeManagement })));
const DanmakuModerationTab = lazy(() => import('./DanmakuModerationTab.js').then(m => ({ default: m.DanmakuModerationTab })));
const SystemAnalyticsDashboard = lazy(() => import('./SystemAnalyticsDashboard.js').then(m => ({ default: m.SystemAnalyticsDashboard })));
const ScheduledPublishing = lazy(() => import('./ScheduledPublishing.js').then(m => ({ default: m.ScheduledPublishing })));
const AdminActivityLog = lazy(() => import('./AdminActivityLog.js').then(m => ({ default: m.AdminActivityLog })));
const EpisodeTemplates = lazy(() => import('./EpisodeTemplates.js').then(m => ({ default: m.EpisodeTemplates })));
const AdminAnalytics = lazy(() => import('./AdminAnalytics.js').then(m => ({ default: m.default })));

const TabLoader = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <LoadingSpinner label="Loading..." />
  </div>
);

interface AdminDashboardProps {
  initialTab?: 'stats' | 'dramas' | 'episodes' | 'users' | 'reorder' | 'reviews' | 'danmaku' | 'cluster' | 'schedule' | 'activity' | 'templates' | 'analytics';
}

const AdminDashboard: React.FC<AdminDashboardProps> = memo(function AdminDashboard({ initialTab }) {
  const { showToast } = useToast();
  const location = useLocation();

  const getStartingTab = () => {
    if (initialTab) return initialTab;
    if (location.pathname.includes('/episodes')) return 'episodes';
    if (location.pathname.includes('/users')) return 'users';
    if (location.pathname.includes('/dramas')) return 'dramas';
    return 'stats';
  };

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  // Force refresh timestamp to bust cache
  const [refreshKey, setRefreshKey] = useState(0);

  const [activeTab, setActiveTab] = useState<'stats' | 'dramas' | 'episodes' | 'users' | 'reorder' | 'reviews' | 'danmaku' | 'cluster' | 'schedule' | 'activity' | 'templates' | 'analytics'>(getStartingTab);

  const [showAddDrama, setShowAddDrama] = useState(false);
  const [showAddEpisode, setShowAddEpisode] = useState(false);
  const [selectedDramaForEp, setSelectedDramaForEp] = useState<string | undefined>(undefined);

  // Modals for editing drama & reordering
  const [editingDrama, setEditingDrama] = useState<Drama | null>(null);
  const [reorderDramaId, setReorderDramaId] = useState<string | undefined>(undefined);
  const [showReorderModal, setShowReorderModal] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Add timestamp to bust cache
      const timestamp = Date.now();
      const [sData, dData] = await Promise.all([
        adminService.getDashboardStats(),
        dramaService.getAllDramas()
      ]);
      
      // Fallback: if stats API returns 0 episodes but dramas have episodeCount, calculate from dramas
      let totalEpisodes = sData?.totalEpisodes || 0;
      if (totalEpisodes === 0 && dData?.dramas?.length > 0) {
        totalEpisodes = dData.dramas.reduce((sum: number, d: any) => sum + (d.episodeCount || 0), 0);
      }
      
      setStats({ ...sData, totalEpisodes });
      setDramas(dData.dramas);
      setRefreshKey(timestamp);
    } catch (err: any) {
      showToast(err.message || 'Error loading admin data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
    loadDashboardData();
  };

  const handleDeleteDrama = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" and all its episodes?`)) return;
    try {
      await dramaService.deleteDrama(id);
      showToast(`Drama "${title}" deleted`, 'info');
      loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Error deleting drama', 'error');
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      await adminService.deleteReview(id);
      showToast('Review removed', 'info');
      loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Error deleting review', 'error');
    }
  };

  if (loading) return <LoadingSpinner label="Loading Admin Dashboard..." />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-16">
      {/* Edit Drama Modal */}
      {editingDrama && (
        <Suspense fallback={<TabLoader />}>
          <EditDramaModal
            isOpen={!!editingDrama}
            drama={editingDrama}
            onSuccess={() => {
              setEditingDrama(null);
              loadDashboardData();
            }}
            onCancel={() => setEditingDrama(null)}
          />
        </Suspense>
      )}

      {/* Reorder Episodes Modal */}
      {showReorderModal && (
        <Suspense fallback={<TabLoader />}>
          <ReorderEpisodesModal
            isOpen={showReorderModal}
            dramaId={reorderDramaId}
            dramas={dramas}
            onSuccess={() => {
              setShowReorderModal(false);
              setReorderDramaId(undefined);
              loadDashboardData();
            }}
            onCancel={() => {
              setShowReorderModal(false);
              setReorderDramaId(undefined);
            }}
          />
        </Suspense>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Admin Control Panel</h1>
              <p className="text-xs text-slate-400">Manage K-Dramas, upload episodes, monitor views & moderate content.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                setShowAddDrama(true);
                setShowAddEpisode(false);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Drama
            </button>
            <button
              onClick={() => {
                setShowAddEpisode(true);
                setShowAddDrama(false);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-rose-400" /> Add Episode
            </button>
            <button
              onClick={forceRefresh}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh dashboard data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Last Updated Timestamp */}
        {refreshKey > 0 && (
          <div className="text-[10px] text-slate-500 mt-2">
            Last updated: {new Date(refreshKey).toLocaleTimeString()}
          </div>
        )}

        {/* Modal overlays for forms */}
        {showAddDrama && (
          <Suspense fallback={<TabLoader />}>
            <AddDrama
              onSuccess={() => {
                setShowAddDrama(false);
                loadDashboardData();
              }}
              onCancel={() => setShowAddDrama(false)}
            />
          </Suspense>
        )}

        {showAddEpisode && (
          <Suspense fallback={<TabLoader />}>
            <AddEpisode
              dramas={dramas}
              preselectedDramaId={selectedDramaForEp}
              onSuccess={() => {
                setShowAddEpisode(false);
                loadDashboardData();
              }}
              onCancel={() => setShowAddEpisode(false)}
            />
          </Suspense>
        )}

        {/* Dashboard Stat Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Dramas</span>
              <Film className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats?.totalDramas || 0}</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Episodes</span>
              <Layers className="w-4 h-4 text-pink-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats?.totalEpisodes || 0}</p>
            {stats && stats.totalEpisodes === 0 && dramas.length > 0 && (
              <p className="text-[10px] text-slate-500 mt-1">
                Calculated from {dramas.length} drama(s): {dramas.reduce((sum, d) => sum + (d.episodeCount || 0), 0)} episodes
              </p>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Registered Users</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats?.totalUsers || 0}</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Platform Views</span>
              <Eye className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">{(stats?.totalViews || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'stats'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Analytics
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Analytics
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'schedule'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" /> Scheduled Pub
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'templates'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Templates
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'activity'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" /> Activity Log
          </button>

          <button
            onClick={() => setActiveTab('danmaku')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'danmaku'
                ? 'border-[#00C2FF] text-[#00C2FF]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Live Danmaku Mod
          </button>

          <button
            onClick={() => setActiveTab('cluster')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'cluster'
                ? 'border-[#00C2FF] text-[#00C2FF]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" /> Cluster Health
          </button>

          <button
            onClick={() => setActiveTab('dramas')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'dramas'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-4 h-4" /> Dramas ({dramas.length})
          </button>

          <button
            onClick={() => setActiveTab('episodes')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'episodes'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-4 h-4" /> Episodes ({stats?.totalEpisodes || 0})
          </button>

          <button
            onClick={() => {
              setActiveTab('reorder');
              setShowReorderModal(true);
            }}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'reorder'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-4 h-4 text-[#00C2FF]" /> Reorder
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'users'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Users
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Reviews
          </button>
        </div>

        {/* Tab Content 1: Overview Analytics */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-500" /> Most Viewed Dramas
              </h3>
              <div className="space-y-3 pt-2">
                {stats?.topViewed.map((item) => {
                  const maxViews = stats.topViewed[0]?.views || 1;
                  const percentage = Math.min(100, Math.round((item.views / maxViews) * 100));
                  return (
                    <div key={item.title} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span className="font-semibold truncate max-w-[200px]">{item.title}</span>
                        <span className="font-mono text-slate-400">{item.views.toLocaleString()} views</span>
                      </div>
                      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
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

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-pink-500" /> Genre Breakdown
              </h3>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {stats?.genreDistribution.map((g) => (
                  <div key={g.name} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-300">{g.name}</span>
                    <span className="text-xs font-bold text-rose-400">{g.value} dramas</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: Danmaku Moderation */}
        {activeTab === 'danmaku' && (
          <Suspense fallback={<TabLoader />}>
            <DanmakuModerationTab />
          </Suspense>
        )}

        {/* Tab Content 4: System Cluster Analytics */}
        {activeTab === 'cluster' && stats && (
          <Suspense fallback={<TabLoader />}>
            <SystemAnalyticsDashboard stats={stats} />
          </Suspense>
        )}

        {/* Tab Content 5: Scheduled Publishing */}
        {activeTab === 'schedule' && (
          <Suspense fallback={<TabLoader />}>
            <ScheduledPublishing
              dramas={dramas.map(d => ({ id: d.id, title: d.title }))}
              episodes={[]}
              onClose={() => setActiveTab('stats')}
            />
          </Suspense>
        )}

        {/* Tab Content 6: Episode Templates */}
        {activeTab === 'templates' && (
          <Suspense fallback={<TabLoader />}>
            <EpisodeTemplates onClose={() => setActiveTab('stats')} />
          </Suspense>
        )}

        {/* Tab Content 7: Admin Activity Log */}
        {activeTab === 'activity' && (
          <Suspense fallback={<TabLoader />}>
            <AdminActivityLog onClose={() => setActiveTab('stats')} />
          </Suspense>
        )}

        {/* Tab Content 8: Dramas Management List */}
        {activeTab === 'dramas' && (
          dramas.length === 0 ? (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <EmptyState
                title="Total Dramas: 0"
                description="Upload your first drama to get started!"
                actionText="Upload First Drama Now"
                onActionClick={() => setShowAddDrama(true)}
                showAdminPrompt={false}
              />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Title</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Genre</th>
                    <th className="p-3.5">Year</th>
                    <th className="p-3.5">Rating</th>
                    <th className="p-3.5">Views</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {dramas.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="p-3.5 flex items-center gap-3">
                        <SmartImage src={d.poster} alt={d.title} className="w-10 h-14 rounded object-cover border border-slate-800" />
                        <div>
                          <span className="font-bold text-white block">{d.title}</span>
                          {d.titleKR && <span className="text-[11px] text-[#00C2FF] font-mono">{d.titleKR}</span>}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30">
                          {d.category || 'K-Drama'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">{d.genre.join(', ')}</td>
                      <td className="p-3.5 text-slate-400">{d.releaseYear}</td>
                      <td className="p-3.5 font-bold text-amber-400">★ {d.averageRating.toFixed(1)}</td>
                      <td className="p-3.5 text-slate-400">{d.views.toLocaleString()}</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => setEditingDrama(d)}
                          className="p-1.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 cursor-pointer"
                          title="Edit Drama Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setReorderDramaId(d.id);
                            setShowReorderModal(true);
                          }}
                          className="p-1.5 rounded bg-cyan-500/10 text-[#00C2FF] hover:bg-cyan-500/20 cursor-pointer"
                          title="Reorder Episodes"
                        >
                          <ListOrdered className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDramaForEp(d.id);
                            setShowAddEpisode(true);
                          }}
                          className="px-2.5 py-1 rounded bg-[#00C2FF]/20 text-[#00C2FF] hover:bg-[#00C2FF]/30 font-semibold text-[11px] cursor-pointer"
                        >
                          + Ep
                        </button>
                        <button
                          onClick={() => handleDeleteDrama(d.id, d.title)}
                          className="p-1.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                          title="Delete Drama"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Tab Content 6: Episode Management System */}
        {activeTab === 'episodes' && (
          <Suspense fallback={<TabLoader />}>
            <EpisodeManagement onOpenAddEpisode={() => setShowAddEpisode(true)} />
          </Suspense>
        )}

        {/* Tab Content 7: Reorder Episodes Standalone view */}
        {activeTab === 'reorder' && (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <ListOrdered className="w-12 h-12 text-[#00C2FF] mx-auto" />
            <h3 className="text-lg font-extrabold text-white">Reorder Drama Episodes</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Select a drama from the dropdown to drag and drop or re-sequence episodes. Episode numbers auto-update sequentially.
            </p>
            <button
              onClick={() => setShowReorderModal(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-rose-600/30 cursor-pointer"
            >
              Open Drag & Drop Reorder Panel
            </button>
          </div>
        )}

        {/* Tab Content 8: Users Management */}
        {activeTab === 'users' && (
          <Suspense fallback={<TabLoader />}>
            <ManageUsers />
          </Suspense>
        )}

        {/* Tab Content 9: Reviews Moderation */}
        {activeTab === 'reviews' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Recent User Reviews ({stats?.recentReviews.length})</h3>
            {stats?.recentReviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{rev.userName}</span>
                    <span className="text-amber-400 text-xs">★ {rev.rating}</span>
                  </div>
                  <p className="text-xs text-slate-300">{rev.review}</p>
                </div>
                <button
                  onClick={() => handleDeleteReview(rev.id)}
                  className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                  title="Remove Review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab Content 10: Analytics */}
        {activeTab === 'analytics' && (
          <Suspense fallback={<TabLoader />}>
            <AdminAnalytics />
          </Suspense>
        )}
      </div>
    </div>
  );
});

AdminDashboard.displayName = 'AdminDashboard';

export { AdminDashboard };
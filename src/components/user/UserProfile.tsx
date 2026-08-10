import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { userService } from '../../services/userService.js';
import { authService } from '../../services/authService.js';
import { Drama, WatchHistoryItem } from '../../types.js';
import { DramaCard } from '../homepage/DramaCard.js';
import { LoadingSpinner } from '../common/LoadingSpinner.js';
import { User, Bookmark, History, Clock, Film, Edit3, Check } from 'lucide-react';

interface UserProfileProps {
  defaultTab?: 'watchlist' | 'history';
}

export const UserProfile: React.FC<UserProfileProps> = ({ defaultTab = 'watchlist' }) => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'watchlist' | 'history'>(defaultTab);
  const [watchlistDramas, setWatchlistDramas] = useState<Drama[]>([]);
  const [historyItems, setHistoryItems] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [wl, hist] = await Promise.all([
        userService.getWatchlist(),
        userService.getWatchHistory()
      ]);
      setWatchlistDramas(wl);
      setHistoryItems(hist);
    } catch (err: any) {
      showToast(err.message || 'Error loading profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await authService.updateProfile(newName.trim());
      updateUser(res.user);
      setIsEditingName(false);
      showToast('Name updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile name', 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* User Banner Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center gap-5 z-10 text-center sm:text-left">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-2xl border-2 border-rose-500/50 object-cover shadow-xl"
            />
            <div className="space-y-1">
              {isEditingName ? (
                <form onSubmit={handleUpdateName} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-slate-950 border border-rose-500 rounded-lg px-3 py-1 text-sm text-white font-bold outline-none"
                  />
                  <button type="submit" className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500">
                    <Check className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                  <button onClick={() => setIsEditingName(true)} className="text-slate-400 hover:text-rose-400">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-400">{user.email}</p>
              <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-[10px] font-bold text-rose-400 uppercase">
                  {user.role} Account
                </span>
                <span className="text-[11px] text-slate-400">
                  Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 z-10 border-t sm:border-t-0 border-slate-800 pt-4 sm:pt-0 w-full sm:w-auto justify-center">
            <div className="text-center px-4 py-2 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-lg font-extrabold text-rose-400 block">{user.watchlist.length}</span>
              <span className="text-[10px] uppercase font-semibold text-slate-400">Watchlist</span>
            </div>
            <div className="text-center px-4 py-2 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-lg font-extrabold text-pink-400 block">{historyItems.length}</span>
              <span className="text-[10px] uppercase font-semibold text-slate-400">Watched</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'watchlist'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4" /> My Watchlist ({user.watchlist.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" /> Watch History ({historyItems.length})
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <LoadingSpinner label="Loading your profile items..." />
        ) : activeTab === 'watchlist' ? (
          watchlistDramas.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
              <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-400">Your Watchlist is empty.</p>
              <p className="text-xs text-slate-500">Explore dramas and tap the bookmark icon to save them for later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {watchlistDramas.map((drama) => (
                <DramaCard key={drama.id} drama={drama} />
              ))}
            </div>
          )
        ) : historyItems.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
            <History className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-400">No watch history recorded yet.</p>
            <p className="text-xs text-slate-500">Start watching any K-Drama episode to track your progress automatically.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.drama?.poster || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=100'}
                    alt={item.drama?.title}
                    className="w-14 h-20 rounded-lg object-cover border border-slate-800"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.drama?.title}</h3>
                    <p className="text-xs text-rose-400 font-medium">
                      Episode {item.episode?.episodeNumber}: {item.episode?.title}
                    </p>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Last watched: {new Date(item.lastWatched).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="w-full sm:w-48 space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Progress</span>
                    <span>{Math.round((item.progress / (item.duration || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-600 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((item.progress / (item.duration || 1)) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

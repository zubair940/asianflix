import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { userService } from '@/services/userService';
import { Drama, WatchHistoryItem } from '@/types';
import { DramaCard } from '@/components/homepage/DramaCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AvatarSelector } from '@/components/common/AvatarSelector';
import { SmartImage } from '@/components/common/SmartImage';
import { User, Bookmark, History, Clock, Film, Edit3, Check, Trash2, Eye, ArrowRight, Loader2 } from 'lucide-react';

interface ProfilePageProps {
  defaultTab?: 'watchlist' | 'history' | 'settings';
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ defaultTab = 'watchlist' }) => {
  const { user, updateUser, refreshAuth } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'watchlist' | 'history' | 'settings'>(defaultTab);
  const [watchlistDramas, setWatchlistDramas] = useState<Drama[]>([]);
  const [historyItems, setHistoryItems] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [newBio, setNewBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

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
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Error loading profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setSaving(true);
    try {
      const res = await userService.updateProfile(newName.trim(), newBio);
      updateUser(res.user);
      setIsEditingName(false);
      showToast('Profile updated successfully', 'success');
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await userService.updateProfile(newName.trim(), newBio);
      updateUser(res.user);
      showToast('Bio updated successfully', 'success');
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Failed to update bio', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (index: number) => {
    try {
      const res = await userService.updateProfile(undefined, undefined, index);
      updateUser(res.user);
      showToast('Avatar updated successfully', 'success');
      setShowAvatarSelector(false);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Failed to update avatar', 'error');
    }
  };

  const handleClearHistory = async (dramaId?: string) => {
    if (!confirm(dramaId ? 'Remove this drama from history?' : 'Clear all watch history? This cannot be undone.')) {
      return;
    }
    try {
      await userService.clearWatchHistory(dramaId);
      if (dramaId) {
        setHistoryItems(prev => prev.filter(h => h.dramaId !== dramaId));
        showToast('Drama removed from history', 'success');
      } else {
        setHistoryItems([]);
        showToast('Watch history cleared', 'success');
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Failed to clear history', 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-gray-900 border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center gap-5 z-10 text-center sm:text-left">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-2xl border-2 border-rose-500/50 object-cover shadow-xl"
              />
              <button
                onClick={() => setShowAvatarSelector(true)}
                className="absolute -bottom-1 -right-1 p-2 rounded-full bg-cyan-400 text-gray-950 hover:bg-cyan-300 transition-colors shadow-lg"
                aria-label="Change avatar"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              {isEditingName ? (
                <form onSubmit={handleUpdateName} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-gray-950 border border-rose-500 rounded-lg px-3 py-1 text-sm text-white font-bold outline-none w-48"
                  />
                  <button type="submit" disabled={saving} className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50">
                    <Check className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                  <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-rose-400">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-400">{user.email}</p>
              <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-[10px] font-bold text-rose-400 uppercase">
                  {user.role} Account
                </span>
                <span className="text-[11px] text-gray-400">
                  Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 z-10 border-t sm:border-t-0 border-gray-800 pt-4 sm:pt-0 w-full sm:w-auto justify-center">
            <div className="text-center px-4 py-2 bg-gray-950/60 rounded-xl border border-gray-800">
              <span className="text-lg font-extrabold text-rose-400 block">{user.watchlist.length}</span>
              <span className="text-[10px] uppercase font-semibold text-gray-400">Watchlist</span>
            </div>
            <div className="text-center px-4 py-2 bg-gray-950/60 rounded-xl border border-gray-800">
              <span className="text-lg font-extrabold text-pink-400 block">{historyItems.length}</span>
              <span className="text-[10px] uppercase font-semibold text-gray-400">Watched</span>
            </div>
            <div className="text-center px-4 py-2 bg-gray-950/60 rounded-xl border border-gray-800">
              <span className="text-lg font-extrabold text-emerald-400 block">
                {Math.round((user.watchHistory?.reduce((acc, h) => acc + (h.progress || 0), 0) || 0) / 60)}
              </span>
              <span className="text-[10px] uppercase font-semibold text-gray-400">Min Watched</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 border-b border-gray-800 pb-2">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'watchlist'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Bookmark className="w-4 h-4" /> My Watchlist ({user.watchlist.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <History className="w-4 h-4" /> Watch History ({historyItems.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <User className="w-4 h-4" /> Settings
          </button>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading your profile items..." />
        ) : activeTab === 'watchlist' ? (
          watchlistDramas.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-gray-900/40 rounded-2xl border border-gray-800">
              <Bookmark className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-sm font-medium text-gray-400">Your Watchlist is empty.</p>
              <p className="text-xs text-gray-500">Explore dramas and tap the bookmark icon to save them for later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {watchlistDramas.map((drama) => (
                <DramaCard key={drama.id} drama={drama} />
              ))}
            </div>
          )
        ) : activeTab === 'history' ? (
          historyItems.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-gray-900/40 rounded-2xl border border-gray-800">
              <History className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-sm font-medium text-gray-400">No watch history recorded yet.</p>
              <p className="text-xs text-gray-500">Start watching any K-Drama episode to track your progress automatically.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-400">{historyItems.length} items</span>
                <button
                  onClick={() => handleClearHistory()}
                  className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              </div>
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-gray-900 border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <SmartImage
                      src={item.drama?.poster || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=100'}
                      alt={item.drama?.title}
                      loading="lazy"
                      decoding="async"
                      className="w-14 h-20 rounded-lg object-cover border border-gray-800 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{item.drama?.title}</h3>
                      <p className="text-xs text-rose-400 font-medium">
                        Episode {item.episode?.episodeNumber}: {item.episode?.title}
                      </p>
                      <span className="text-[11px] text-gray-500 block mt-1">
                        Last watched: {new Date(item.lastWatched).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="w-full sm:w-64 space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>Progress</span>
                      <span>{Math.round((item.progress / (item.duration || 1)) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-600 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((item.progress / (item.duration || 1)) * 100))}%` }}
                      />
                    </div>
                    <button
                      onClick={() => handleClearHistory(item.dramaId)}
                      className="w-full text-left px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove from History
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-6 max-w-2xl">
            <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">Profile Information</h3>
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-300">Display Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-300">Bio</label>
                  <textarea
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                    placeholder="Tell others about yourself..."
                  ></textarea>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Avatar</label>
                    <button
                      onClick={() => setShowAvatarSelector(true)}
                      className="flex items-center gap-3 p-2 rounded-lg bg-gray-950 border border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-700"
                      />
                      <span className="text-sm text-gray-300">Change Avatar</span>
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold hover:from-rose-500 hover:to-pink-500 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Changes
                </button>
              </form>
            </div>

            <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">Account Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-950/50 border border-gray-800">
                  <div>
                    <p className="font-medium text-white">Change Password</p>
                    <p className="text-xs text-gray-400">Update your account password</p>
                  </div>
                  <button className="px-3 py-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300">Change</button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-950/50 border border-gray-800">
                  <div>
                    <p className="font-medium text-white">Delete Account</p>
                    <p className="text-xs text-gray-400">Permanently delete your account and all data</p>
                  </div>
                  <button className="px-3 py-1.5 text-sm font-medium text-rose-400 hover:text-rose-300">Delete</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAvatarSelector && (
        <AvatarSelector onClose={() => setShowAvatarSelector(false)} />
      )}
    </div>
  );
};

export default ProfilePage;
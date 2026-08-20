import React, { useState, useEffect, memo } from 'react';
import { useToast } from '../../context/ToastContext.js';
import { Clock, Calendar, Send, Trash2, Edit, Bell, Loader2, CheckCircle, XCircle, Zap, X } from 'lucide-react';

interface ScheduledEpisode {
  id: string;
  dramaId: string;
  dramaTitle: string;
  episodeNumber: number;
  title: string;
  scheduledAt: string;
  status: 'pending' | 'published' | 'failed';
  createdAt: string;
}

interface ScheduledPublishingProps {
  dramas: { id: string; title: string }[];
  episodes: { id: string; dramaId: string; episodeNumber: number; title: string }[];
  onClose: () => void;
}

const ScheduledPublishing = memo(function ScheduledPublishing({
  dramas,
  episodes,
  onClose,
}: ScheduledPublishingProps) {
  const { showToast } = useToast();

  const [scheduled, setScheduled] = useState<ScheduledEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [formDramaId, setFormDramaId] = useState('');
  const [formEpisodeId, setFormEpisodeId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dramaEpisodes = episodes.filter((e) => e.dramaId === formDramaId);

  useEffect(() => {
    // Load scheduled episodes from localStorage (in production, this would be from API)
    const stored = localStorage.getItem('scheduled_episodes');
    if (stored) {
      try {
        setScheduled(JSON.parse(stored));
      } catch {
        setScheduled([]);
      }
    }
    setLoading(false);
  }, []);

  const saveScheduled = (newScheduled: ScheduledEpisode[]) => {
    setScheduled(newScheduled);
    localStorage.setItem('scheduled_episodes', JSON.stringify(newScheduled));
  };

  const handleCreateSchedule = async () => {
    if (!formDramaId || !formEpisodeId || !formDate || !formTime) {
      showToast('Please fill all fields', 'error');
      return;
    }

    const selectedDrama = dramas.find((d) => d.id === formDramaId);
    const selectedEpisode = episodes.find((e) => e.id === formEpisodeId);

    if (!selectedDrama || !selectedEpisode) {
      showToast('Invalid selection', 'error');
      return;
    }

    const scheduledAt = new Date(`${formDate}T${formTime}`);
    if (scheduledAt <= new Date()) {
      showToast('Schedule time must be in the future', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const newSchedule: ScheduledEpisode = {
        id: `sched_${Date.now()}`,
        dramaId: formDramaId,
        dramaTitle: selectedDrama.title,
        episodeNumber: selectedEpisode.episodeNumber,
        title: selectedEpisode.title,
        scheduledAt: scheduledAt.toISOString(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      saveScheduled([...scheduled, newSchedule]);
      showToast(`Episode scheduled for ${scheduledAt.toLocaleString()}`, 'success');
      setShowCreate(false);
      setFormDramaId('');
      setFormEpisodeId('');
      setFormDate('');
      setFormTime('');
    } catch (err: any) {
      showToast(err.message || 'Error scheduling', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = (id: string) => {
    if (!confirm('Cancel this scheduled publication?')) return;
    saveScheduled(scheduled.filter((s) => s.id !== id));
    showToast('Scheduled publication cancelled', 'info');
  };

  const handlePublishNow = async (item: ScheduledEpisode) => {
    // In production, this would call the API to publish
    showToast(`Publishing "${item.title}" now...`, 'info');
    // Simulate API call
    setTimeout(() => {
      saveScheduled(scheduled.map((s) => (s.id === item.id ? { ...s, status: 'published' } : s)));
      showToast(`Episode "${item.title}" published!`, 'success');
    }, 1000);
  };

  const pendingSchedules = scheduled.filter((s) => s.status === 'pending').sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const publishedSchedules = scheduled.filter((s) => s.status === 'published').sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const failedSchedules = scheduled.filter((s) => s.status === 'failed');

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
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          Scheduled Publishing
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/30"
          >
            <Zap className="w-3.5 h-3.5" /> Schedule New
          </button>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Create Schedule Form */}
      {showCreate && (
        <div className="space-y-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800 animate-slide-down">
          <h3 className="font-semibold text-white">Schedule Episode Publication</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Select Drama</label>
              <select
                value={formDramaId}
                onChange={(e) => {
                  setFormDramaId(e.target.value);
                  setFormEpisodeId('');
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-cyan-400"
              >
                <option value="">-- Choose Drama --</option>
                {dramas.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Select Episode</label>
              <select
                value={formEpisodeId}
                onChange={(e) => setFormEpisodeId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-cyan-400"
                disabled={!formDramaId}
              >
                <option value="">-- Choose Episode --</option>
                {dramaEpisodes.map((ep) => (
                  <option key={ep.id} value={ep.id}>Ep {ep.episodeNumber}: {ep.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-cyan-400"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Time (24hr)</label>
              <input
                type="time"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-cyan-400"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateSchedule}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Schedule
            </button>
          </div>
        </div>
      )}

      {/* Pending Schedules */}
      {pendingSchedules.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Pending ({pendingSchedules.length})
          </h3>
          <div className="space-y-2">
            {pendingSchedules.map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-slate-950/50 border border-amber-500/30 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-white truncate">{item.dramaTitle}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Ep {item.episodeNumber}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5 truncate">{item.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.scheduledAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Zap className="w-3 h-3" />
                      In {Math.max(0, Math.round((new Date(item.scheduledAt).getTime() - Date.now()) / 60000))} min
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handlePublishNow(item)}
                    className="px-3 py-1.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-semibold flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" /> Publish Now
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(item.id)}
                    className="p-1.5 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                    title="Cancel schedule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Published Schedules */}
      {publishedSchedules.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-green-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Published ({publishedSchedules.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {publishedSchedules.slice(0, 10).map((item) => (
              <div key={item.id} className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.dramaTitle} - Ep {item.episodeNumber}</p>
                    <p className="text-xs text-slate-400 truncate">{item.title}</p>
                  </div>
                </div>
                <span className="text-xs text-green-400 whitespace-nowrap">
                  {new Date(item.scheduledAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Schedules */}
      {failedSchedules.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Failed ({failedSchedules.length})
          </h3>
          <div className="space-y-2">
            {failedSchedules.map((item) => (
              <div key={item.id} className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{item.dramaTitle} - Ep {item.episodeNumber}</p>
                    <p className="text-xs text-slate-400">{item.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSchedule(item.id)}
                  className="px-3 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-semibold"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {scheduled.length === 0 && !showCreate && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Scheduled Publications</h3>
          <p className="text-slate-400 text-sm mb-4">Schedule episodes to auto-publish at a future date/time</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold text-sm flex items-center gap-2 mx-auto shadow-lg shadow-cyan-500/30"
          >
            <Zap className="w-4 h-4" /> Create First Schedule
          </button>
        </div>
      )}
    </div>
  );
});

ScheduledPublishing.displayName = 'ScheduledPublishing';

export { ScheduledPublishing };
import React, { useEffect, useState } from 'react';
import { DanmakuComment } from '../../types.js';
import { featureService } from '../../services/featureService.js';
import { useToast } from '../../context/ToastContext.js';
import { MessageSquare, Trash2, Clock, User, Filter } from 'lucide-react';

export const DanmakuModerationTab: React.FC = () => {
  const { showToast } = useToast();
  const [comments, setComments] = useState<DanmakuComment[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await featureService.getAllDanmakuAdmin();
      setComments(res);
    } catch (err: any) {
      showToast('Error loading live comments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await featureService.deleteDanmaku(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      showToast('Danmaku comment deleted', 'info');
    } catch (err: any) {
      showToast('Error deleting comment', 'error');
    }
  };

  const filtered = comments.filter(
    (c) =>
      c.text.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.userName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.episodeId.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#00C2FF]" /> Live Danmaku Comment Moderation
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review and delete live streaming bullet comments across all drama episodes.
          </p>
        </div>

        <input
          type="text"
          placeholder="Filter comments or users..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00C2FF]"
        />
      </div>

      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No live comments found matching filter.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Episode ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Comment Text</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                    <img
                      src={c.userAvatar}
                      alt={c.userName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    {c.userName}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{c.episodeId}</td>
                  <td className="py-3.5 px-4 text-cyan-400 font-mono font-bold">{c.timestampSec}s</td>
                  <td className="py-3.5 px-4 text-slate-200 font-bold" style={{ color: c.color }}>
                    {c.text}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors cursor-pointer"
                      title="Delete Comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { Episode, Drama } from '../../types.js';
import { Edit, Video, Trash2, Clock, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EpisodeTableProps {
  episodes: Episode[];
  dramasMap: Record<string, Drama>;
  onEdit: (ep: Episode) => void;
  onReplaceVideo: (ep: Episode) => void;
  onDelete: (ep: Episode) => void;
}

export const EpisodeTable: React.FC<EpisodeTableProps> = ({
  episodes,
  dramasMap,
  onEdit,
  onReplaceVideo,
  onDelete
}) => {
  if (episodes.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs space-y-2">
        <p className="font-bold text-slate-300 text-sm">No episodes found matching filters</p>
        <p className="text-slate-500">Try selecting a different K-Drama or clearing your search term.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
          <tr>
            <th className="p-3.5">K-Drama</th>
            <th className="p-3.5">Ep #</th>
            <th className="p-3.5">Episode Title</th>
            <th className="p-3.5">Video Source</th>
            <th className="p-3.5">Duration</th>
            <th className="p-3.5">Preview</th>
            <th className="p-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80">
          {episodes.map((ep) => {
            const drama = dramasMap[ep.dramaId];
            const dramaTitle = drama ? drama.title : ep.dramaId;
            const isLocal = ep.videoUrl?.includes('/uploads/');

            return (
              <tr key={ep.id} className="hover:bg-slate-850/50 transition-colors">
                {/* Drama */}
                <td className="p-3.5">
                  <div className="flex items-center gap-2.5">
                    {drama?.poster && (
                      <img
                        src={drama.poster}
                        alt={dramaTitle}
                        className="w-8 h-11 rounded object-cover border border-slate-800 shrink-0"
                      />
                    )}
                    <div>
                      <span className="font-bold text-white block truncate max-w-[160px]">{dramaTitle}</span>
                      {drama?.releaseYear && (
                        <span className="text-[10px] text-slate-500 font-mono">{drama.releaseYear}</span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Ep # */}
                <td className="p-3.5 font-bold text-[#00C2FF] font-mono">
                  EP {ep.episodeNumber}
                </td>

                {/* Title */}
                <td className="p-3.5">
                  <span className="font-semibold text-slate-100 block max-w-[200px] truncate">{ep.title}</span>
                  {ep.subtitles && ep.subtitles.length > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400">
                      CC: {ep.subtitles.map((s) => s.language.toUpperCase()).join(', ')}
                    </span>
                  )}
                </td>

                {/* Video Source */}
                <td className="p-3.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isLocal
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}
                  >
                    {isLocal ? 'Uploaded MP4' : 'External Stream'}
                  </span>
                </td>

                {/* Duration */}
                <td className="p-3.5 text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" /> {ep.duration}
                  </span>
                </td>

                {/* Stream Preview Link */}
                <td className="p-3.5">
                  <Link
                    to={`/watch/${ep.dramaId}/${ep.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-all"
                  >
                    <Play className="w-3 h-3 text-rose-400 fill-rose-400" /> Stream
                  </Link>
                </td>

                {/* Actions */}
                <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                  {/* ✏️ Edit */}
                  <button
                    onClick={() => onEdit(ep)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] inline-flex items-center gap-1 border border-slate-700 transition-all cursor-pointer"
                    title="Edit Episode Details"
                  >
                    <Edit className="w-3 h-3 text-slate-400" /> Edit
                  </button>

                  {/* 🎬 Replace Video */}
                  <button
                    onClick={() => onReplaceVideo(ep)}
                    className="px-2.5 py-1 rounded bg-[#00C2FF]/10 hover:bg-[#00C2FF]/20 text-[#00C2FF] font-semibold text-[11px] inline-flex items-center gap-1 border border-[#00C2FF]/20 transition-all cursor-pointer"
                    title="Replace Episode Video"
                  >
                    <Video className="w-3 h-3" /> Replace Video
                  </button>

                  {/* 🗑️ Delete */}
                  <button
                    onClick={() => onDelete(ep)}
                    className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors inline-flex items-center cursor-pointer"
                    title="Delete Episode"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

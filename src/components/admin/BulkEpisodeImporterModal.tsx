import React, { useState } from 'react';
import { Drama } from '../../types.js';
import { featureService } from '../../services/featureService.js';
import { useToast } from '../../context/ToastContext.js';
import { Layers, Zap, X, Film, CheckCircle2 } from 'lucide-react';

interface BulkEpisodeImporterModalProps {
  dramas: Drama[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkEpisodeImporterModal: React.FC<BulkEpisodeImporterModalProps> = ({
  dramas,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { showToast } = useToast();

  const [selectedDramaId, setSelectedDramaId] = useState(dramas[0]?.id || '');
  const [epCount, setEpCount] = useState(16);
  const [startNum, setStartNum] = useState(1);
  const [duration, setDuration] = useState('65 mins');
  const [videoUrl, setVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedDramaId || !epCount) return;

    setLoading(true);
    try {
      const res = await featureService.bulkGenerateEpisodes({
        dramaId: selectedDramaId,
        count: epCount,
        startEpNum: startNum,
        duration,
        defaultVideoUrl: videoUrl
      });
      showToast(res.message, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error bulk generating episodes', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[#00C2FF]">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#00C2FF] uppercase tracking-wider">
              ADMIN BATCH TOOL
            </span>
            <h3 className="text-lg font-extrabold text-white">Bulk Episode Generator</h3>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Target Drama:</label>
            <select
              value={selectedDramaId}
              onChange={(e) => setSelectedDramaId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00C2FF]"
            >
              {dramas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.releaseYear})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Total Episodes:</label>
              <input
                type="number"
                min={1}
                max={50}
                value={epCount}
                onChange={(e) => setEpCount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00C2FF]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Start Ep Number:</label>
              <input
                type="number"
                min={1}
                value={startNum}
                onChange={(e) => setStartNum(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00C2FF]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Episode Duration:</label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00C2FF]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Base Direct Video Stream / Mirror URL:
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-[#00C2FF]"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              *Generates 3 fast multi-server mirrors (Server 1 VIP, Server 2 NetMirror, Server 3 MovieBox Dub) + VTT subtitles per episode automatically!
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00C2FF] to-[#0047FF] hover:brightness-110 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-4 h-4" /> Bulk Create {epCount} Episodes Now
          </button>
        </div>
      </div>
    </div>
  );
};
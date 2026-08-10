import React, { useState } from 'react';
import { Drama, Episode } from '../../types.js';
import { useToast } from '../../context/ToastContext.js';
import { Download, CheckCircle2, HardDrive, X, Film, ShieldCheck } from 'lucide-react';

interface OfflineDownloadModalProps {
  drama: Drama;
  episode: Episode;
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineDownloadModal: React.FC<OfflineDownloadModalProps> = ({
  drama,
  episode,
  isOpen,
  onClose
}) => {
  const { showToast } = useToast();
  const [quality, setQuality] = useState<'1080p' | '720p' | '480p'>('1080p');
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState('14.2 MB/s');
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const getEstSize = () => {
    switch (quality) {
      case '1080p': return '680 MB';
      case '720p': return '390 MB';
      case '480p': return '190 MB';
    }
  };

  const handleStartDownload = () => {
    setDownloading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloading(false);
          setDownloaded(true);

          // Save to local downloads storage
          const savedDownloads = JSON.parse(localStorage.getItem('kdramabox_offline_downloads') || '[]');
          const item = {
            id: `dl_${Date.now()}`,
            dramaId: drama.id,
            dramaTitle: drama.title,
            episodeId: episode.id,
            episodeNumber: episode.episodeNumber,
            title: episode.title,
            thumbnail: episode.thumbnail || drama.poster,
            quality,
            size: getEstSize(),
            downloadedAt: new Date().toLocaleDateString()
          };
          savedDownloads.unshift(item);
          localStorage.setItem('kdramabox_offline_downloads', JSON.stringify(savedDownloads));

          showToast(`${drama.title} Ep ${episode.episodeNumber} saved for offline streaming!`, 'success');
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 10;
      });
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[#00C2FF]">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#00C2FF] uppercase tracking-wider">
              OFFLINE STREAM DOWNLOAD
            </span>
            <h3 className="text-lg font-extrabold text-white">
              Episode {episode.episodeNumber}: {episode.title}
            </h3>
          </div>
        </div>

        {/* Quality Selector */}
        {!downloading && !downloaded ? (
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-300 block">Select Video Quality:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['1080p', '720p', '480p'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    quality === q
                      ? 'bg-cyan-500/20 border-[#00C2FF] text-[#00C2FF] font-extrabold shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm">{q}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {q === '1080p' ? '~680 MB' : q === '720p' ? '~390 MB' : '~190 MB'}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-cyan-400" /> Estimated Storage Size
              </span>
              <span className="font-mono font-bold text-white">{getEstSize()}</span>
            </div>

            <button
              onClick={handleStartDownload}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00C2FF] to-[#0047FF] hover:brightness-110 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download to Offline Storage
            </button>
          </div>
        ) : downloading ? (
          /* Downloading Progress View */
          <div className="space-y-4 text-center py-4">
            <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#00C2FF] to-[#0047FF] h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>{progress}% Completed</span>
              <span className="text-[#00C2FF] font-bold">{speed}</span>
            </div>
            <p className="text-xs text-slate-500">Encrypting video stream for local offline playback...</p>
          </div>
        ) : (
          /* Completed View */
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Download Complete!</h4>
              <p className="text-xs text-slate-400 mt-1">
                Episode saved in {quality} ({getEstSize()}). You can watch this anytime without internet!
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

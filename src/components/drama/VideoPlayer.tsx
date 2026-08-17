import React, { useRef, useState, useEffect } from 'react';
import { Episode, Drama, Subtitle, DanmakuComment } from '../../types.js';
import { usePlayer } from '../../context/PlayerContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { userService } from '../../services/userService.js';
import { featureService } from '../../services/featureService.js';
import { formatTime, getMediaUrl } from '../../utils/helpers.js';
import { DanmakuOverlay } from './DanmakuOverlay.js';
import { WatchPartyDrawer } from './WatchPartyDrawer.js';
import { OfflineDownloadModal } from './OfflineDownloadModal.js';
import { SubtitleCustomizerModal, SubtitleStyleConfig } from './SubtitleCustomizerModal.js';
import { useToast } from '../../context/ToastContext.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Settings,
  Subtitles,
  Gauge,
  Check,
  ChevronRight,
  AlertTriangle,
  Loader2,
  MessageSquare,
  Users,
  Download,
  Type,
  Send,
  Sparkles
} from 'lucide-react';

interface VideoPlayerProps {
  drama: Drama;
  episode: Episode;
  allEpisodes: Episode[];
  onSelectEpisode: (ep: Episode) => void;
}

const VideoPlayerComponent: React.FC<VideoPlayerProps> = ({
  drama,
  episode,
  allEpisodes,
  onSelectEpisode
}) => {
  const { autoPlayNext, setAutoPlayNext } = usePlayer();
  const { user } = useAuth();
  const { showToast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState<string>('off');
  const [selectedQuality, setSelectedQuality] = useState('1080p (FHD)');
  const [controlsVisible, setControlsVisible] = useState(true);

  // Single source: the episode's direct video URL (no mirror servers)
  const resolvedVideoUrl = getMediaUrl(episode.videoUrl);

  // Danmaku state
  const [danmakuEnabled, setDanmakuEnabled] = useState(true);
  const [danmakuComments, setDanmakuComments] = useState<DanmakuComment[]>([]);
  const [danmakuText, setDanmakuText] = useState('');
  const [danmakuColor, setDanmakuColor] = useState('#00C2FF');

  // Modals state
  const [showWatchParty, setShowWatchParty] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showSubCustomizer, setShowSubCustomizer] = useState(false);
  const [subConfig, setSubConfig] = useState<SubtitleStyleConfig>({
    fontSize: 'medium',
    color: '#FFFFFF',
    bgColor: 'rgba(0,0,0,0.75)'
  });

  const hideTimeoutRef = useRef<any>(null);

  // Load Danmaku comments
  useEffect(() => {
    featureService
      .getDanmaku(episode.id)
      .then((comments) => setDanmakuComments(comments))
      .catch(() => {});
  }, [episode.id]);

  // Video initialization
  useEffect(() => {
    setHasError(false);
    setErrorMessage('');
    setIsPlaying(false);
    setIsBuffering(true);
    setHasStartedPlaying(false);
    setCurrentTime(0);

    if (videoRef.current) {
      videoRef.current.volume = 1;
      videoRef.current.muted = false;
      setIsMuted(false);
      setVolume(1);

      const savedKey = `kdramabox_progress_${drama.id}_${episode.id}`;
      const savedProgress = localStorage.getItem(savedKey);
      if (savedProgress) {
        const time = parseFloat(savedProgress);
        if (!isNaN(time) && time > 5) {
          videoRef.current.currentTime = time;
        }
      }

      videoRef.current.load();
    }
  }, [drama.id, episode.id, resolvedVideoUrl]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(cur);
    setDuration(dur);

    const savedKey = `kdramabox_progress_${drama.id}_${episode.id}`;
    localStorage.setItem(savedKey, cur.toString());

    if (user && Math.floor(cur) % 10 === 0 && dur > 0) {
      userService.updateWatchHistory(drama.id, episode.id, Math.floor(cur), Math.floor(dur)).catch(() => {});
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.playbackRate = playbackRate;
      setIsBuffering(false);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current || hasError) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      setHasStartedPlaying(true);
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setHasError(false);
            setIsBuffering(false);
          })
          .catch((err) => {
            setHasError(true);
            setErrorMessage('Browser blocked playback or format codec not supported.');
          });
      }
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    setIsBuffering(true);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasStartedPlaying(true);
          setIsBuffering(false);
        })
        .catch(() => {
          setHasError(true);
          setErrorMessage('Could not play video after retry.');
        });
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const error = (e.target as HTMLVideoElement).error;
    setHasError(true);
    setIsBuffering(false);
    setIsPlaying(false);
    setErrorMessage('Video stream unavailable on current mirror server.');
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const skipSeconds = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    }
  };

  const handleSendDanmaku = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!danmakuText.trim()) return;

    const text = danmakuText.trim();
    setDanmakuText('');

    try {
      const newComment = await featureService.postDanmaku(
        episode.id,
        text,
        Math.floor(currentTime),
        danmakuColor
      );
      setDanmakuComments((prev) => [...prev, newComment]);
      showToast('Live comment posted!', 'success');
    } catch (err: any) {
      showToast('Login required to post live comments', 'error');
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuteState = !isMuted;
    videoRef.current.muted = newMuteState;
    setIsMuted(newMuteState);
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSettings(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentEpIndex = allEpisodes.findIndex((e) => e.id === episode.id);
  const nextEpisode = currentEpIndex >= 0 && currentEpIndex < allEpisodes.length - 1 ? allEpisodes[currentEpIndex + 1] : null;

  const handleMouseMove = () => {
    setControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3500);
  };

  return (
    <div className="video-player space-y-3">
      {/* Main Video Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 group select-none"
      >
        {/* Danmaku Floating Bullet Comments Overlay */}
        <DanmakuOverlay
          comments={danmakuComments}
          currentTime={currentTime}
          isPlaying={isPlaying}
          enabled={danmakuEnabled}
        />

        {/* HTML5 Video Element */}
        <video
          ref={videoRef}
          src={resolvedVideoUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            if (autoPlayNext && nextEpisode) onSelectEpisode(nextEpisode);
          }}
          onPlay={() => {
            setIsPlaying(true);
            setHasStartedPlaying(true);
            setHasError(false);
            setIsBuffering(false);
          }}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsPlaying(true);
            setIsBuffering(false);
          }}
          onError={handleVideoError}
          onClick={togglePlay}
          preload="auto"
          playsInline
          className="w-full h-full object-contain cursor-pointer bg-black"
          crossOrigin="anonymous"
        >
          <source src={resolvedVideoUrl} type="video/mp4" />
          {episode.subtitles &&
            episode.subtitles.map((sub: Subtitle) => (
              <track
                key={sub.language}
                kind="subtitles"
                src={sub.url}
                srcLang={sub.language}
                label={sub.label}
                default={activeSubtitle === sub.language}
              />
            ))}
        </video>

        {/* Skip Intro Button Removed — no intro skip UI on the player */}

        {/* Skip Outro Button Overlay */}
        {isPlaying && duration > 120 && duration - currentTime <= 120 && (
          <button
            onClick={() => {
              if (nextEpisode) onSelectEpisode(nextEpisode);
            }}
            className="absolute bottom-20 right-6 z-30 px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-cyan-500/40 text-[#00C2FF] font-bold text-xs flex items-center gap-1.5 shadow-2xl hover:bg-black transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" /> Skip Outro to Ep {nextEpisode?.episodeNumber || ''}
          </button>
        )}

        {/* Initial Poster Backdrop */}
        {!hasStartedPlaying && !isPlaying && !hasError && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 bg-cover bg-center flex items-center justify-center cursor-pointer group/poster z-20"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.8)), url(${
                episode.thumbnail || drama.backdrop || drama.poster
              })`
            }}
          >
            <div className="w-20 h-20 rounded-full bg-[#00C2FF] flex items-center justify-center text-black shadow-2xl shadow-cyan-500/50 transform group-hover/poster:scale-110 transition-all duration-300">
              <Play className="w-9 h-9 fill-black ml-1" />
            </div>
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white">
              <div>
                <span className="text-xs font-bold text-[#00C2FF] uppercase tracking-wider">
                  Episode {episode.episodeNumber}: Now Playing
                </span>
                <h3 className="text-lg font-extrabold text-white">{episode.title}</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-black/60 border border-white/20 text-xs font-mono font-semibold">
                {episode.duration}
              </span>
            </div>
          </div>
        )}

        {/* Buffering Spinner */}
        {isBuffering && hasStartedPlaying && !hasError && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-20 pointer-events-none">
            <div className="p-3 rounded-2xl bg-black/80 border border-white/10 flex items-center gap-2 text-white text-xs font-semibold shadow-2xl">
              <Loader2 className="w-5 h-5 text-[#00C2FF] animate-spin" />
              <span>Buffering...</span>
            </div>
          </div>
        )}

        {/* Video Error Fallback */}
        {hasError && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-40 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-xl">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-lg font-bold text-white">Playback Error</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {errorMessage} Please try again.
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00C2FF] to-[#0047FF] hover:brightness-110 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <RotateCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {/* Controls Overlay */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent space-y-2.5 transition-opacity duration-300 z-30 ${
            controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Seek Bar */}
          <div className="relative group/seeker">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-700/80 accent-[#00C2FF] rounded-lg cursor-pointer transition-all group-hover/seeker:h-2.5"
            />
          </div>

          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="p-2 hover:text-[#00C2FF] transition-colors cursor-pointer">
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>

              <button onClick={() => skipSeconds(-10)} title="Rewind 10s" className="p-1.5 hover:text-[#00C2FF] text-slate-300 cursor-pointer">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={() => skipSeconds(10)} title="Forward 10s" className="p-1.5 hover:text-[#00C2FF] text-slate-300 cursor-pointer">
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group/vol">
                <button onClick={toggleMute} className="p-1.5 hover:text-[#00C2FF] text-slate-300 cursor-pointer">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-slate-700 accent-[#00C2FF] rounded cursor-pointer"
                />
              </div>

              <span className="font-mono text-slate-300 text-xs">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2.5 relative">
              {/* Watch Party Button */}
              <button
                onClick={() => setShowWatchParty(!showWatchParty)}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 text-[#00C2FF] text-xs font-bold flex items-center gap-1 hover:bg-cyan-500/30 transition-all cursor-pointer"
                title="Watch Party"
              >
                <Users className="w-4 h-4" /> Party
              </button>

              {/* Offline Download Button */}
              <button
                onClick={() => setShowDownloadModal(true)}
                className="p-1.5 text-slate-300 hover:text-[#00C2FF] transition-colors cursor-pointer"
                title="Download for Offline"
              >
                <Download className="w-4.5 h-4.5" />
              </button>

              {/* Subtitle Customizer */}
              <button
                onClick={() => setShowSubCustomizer(true)}
                className="p-1.5 text-slate-300 hover:text-[#00C2FF] transition-colors cursor-pointer"
                title="Subtitle Font & Styling"
              >
                <Type className="w-4.5 h-4.5" />
              </button>

              {/* Subtitles Track Switcher */}
              <button
                onClick={() => {
                  setShowSubtitlesMenu(!showSubtitlesMenu);
                  setShowSettings(false);
                }}
                className={`p-1.5 rounded hover:text-[#00C2FF] transition-colors ${
                  activeSubtitle !== 'off' ? 'text-[#00C2FF] font-bold' : 'text-slate-300'
                }`}
              >
                <Subtitles className="w-5 h-5" />
              </button>

              {/* Settings */}
              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowSubtitlesMenu(false);
                }}
                className="p-1.5 text-slate-300 hover:text-[#00C2FF] transition-colors cursor-pointer"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="p-1.5 text-slate-300 hover:text-[#00C2FF] transition-colors cursor-pointer">
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danmaku Interactive Comment Input Bar */}
      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDanmakuEnabled(!danmakuEnabled)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              danmakuEnabled
                ? 'bg-cyan-500/20 border-cyan-500 text-[#00C2FF]'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Live Bullet Comments: {danmakuEnabled ? 'ON' : 'OFF'}
          </button>

          <div className="hidden md:flex items-center gap-1">
            {['#00C2FF', '#FF2A6D', '#FFD700', '#00FF66', '#FFFFFF'].map((hex) => (
              <button
                key={hex}
                onClick={() => setDanmakuColor(hex)}
                style={{ backgroundColor: hex }}
                className={`w-5 h-5 rounded-full border border-slate-700 transition-transform ${
                  danmakuColor === hex ? 'scale-125 ring-2 ring-cyan-400' : 'opacity-70'
                }`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSendDanmaku} className="w-full sm:w-auto flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Send live comment floating across video..."
            value={danmakuText}
            onChange={(e) => setDanmakuText(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00C2FF]"
          />
          <button
            type="submit"
            disabled={!danmakuText.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00C2FF] to-[#0047FF] hover:brightness-110 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </form>
      </div>

      {/* Modals & Drawers */}
      <WatchPartyDrawer
        drama={drama}
        episode={episode}
        isOpen={showWatchParty}
        onClose={() => setShowWatchParty(false)}
        currentTime={currentTime}
        isPlaying={isPlaying}
        onSyncTime={(time) => {
          if (videoRef.current) videoRef.current.currentTime = time;
        }}
      />

      <OfflineDownloadModal
        drama={drama}
        episode={episode}
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />

      <SubtitleCustomizerModal
        isOpen={showSubCustomizer}
        onClose={() => setShowSubCustomizer(false)}
        config={subConfig}
        onChangeConfig={setSubConfig}
      />
    </div>
  );
};

// Memoized: skips re-renders when the drama/episode props haven't changed,
// which keeps the player (and its timers/Danmaku overlay) free of needless
// renders while the page around it updates.
export const VideoPlayer = React.memo(VideoPlayerComponent);


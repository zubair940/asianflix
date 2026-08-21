import React, { useState, useEffect } from 'react';
import { WatchPartyRoom, WatchPartyMessage, Drama, Episode } from '../../types.js';
import { featureService } from '../../services/featureService.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Users, Send, Copy, Check, RefreshCw, X, Play, Pause, Sparkles } from 'lucide-react';

interface WatchPartyDrawerProps {
  drama: Drama;
  episode: Episode;
  isOpen: boolean;
  onClose: () => void;
  currentTime: number;
  isPlaying: boolean;
  onSyncTime: (time: number) => void;
}

export const WatchPartyDrawer: React.FC<WatchPartyDrawerProps> = ({
  drama,
  episode,
  isOpen,
  onClose,
  currentTime,
  isPlaying,
  onSyncTime
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [room, setRoom] = useState<WatchPartyRoom | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Poll room status every 3s if active in a room
  useEffect(() => {
    if (!room) return;

    const interval = setInterval(() => {
      featureService
        .getWatchParty(room.roomCode)
        .then((updated) => setRoom(updated))
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [room]);

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const res = await featureService.createWatchParty(
        drama.id,
        episode.id,
        `${user?.name || 'Friend'}'s ${drama.title} Ep ${episode.episodeNumber} Party`
      );
      setRoom(res);
      showToast(`Watch Party room created! Code: ${res.roomCode}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error creating Watch Party', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCodeInput.trim()) return;
    setLoading(true);
    try {
      const res = await featureService.getWatchParty(joinCodeInput.trim());
      setRoom(res);
      showToast(`Joined ${res.roomName}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Watch Party room not found', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!room || !msgInput.trim()) return;

    const txt = msgInput.trim();
    setMsgInput('');

    try {
      const updated = await featureService.sendWatchPartyMessage(
        room.roomCode,
        txt,
        currentTime,
        isPlaying
      );
      setRoom(updated);
    } catch (err: any) {
      showToast('Error sending message', 'error');
    }
  };

  const handleSyncToHost = () => {
    if (room && room.currentTime !== undefined) {
      onSyncTime(room.currentTime);
      showToast(`Synced video to ${Math.floor(room.currentTime)}s`, 'info');
    }
  };

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Watch Party code copied!', 'info');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-50 flex flex-col transition-all">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-black font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              Watch Party <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </h2>
            <p className="text-[11px] text-slate-400">Watch & Chat together in sync</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!room ? (
        /* Create or Join Room View */
        <div className="p-6 flex-1 flex flex-col justify-center space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-extrabold text-white">Start or Join a Room</h3>
            <p className="text-xs text-slate-400">
              Stream {drama.title} Episode {episode.episodeNumber} in sync with friends across the world!
            </p>
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00C2FF] to-[#0047FF] hover:brightness-110 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Host New Watch Party
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] font-bold text-slate-500 uppercase absolute">
              OR JOIN CODE
            </span>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter 6-character Code (e.g. X7K9P2)"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 font-mono text-center tracking-widest text-sm focus:outline-none focus:border-[#00C2FF]"
            />
            <button
              type="button"
              onClick={handleJoinRoom}
              disabled={loading || !joinCodeInput.trim()}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              Join Party Room
            </button>
          </div>
        </div>
      ) : (
        /* Active Room Chat & Controls View */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Room Banner */}
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-[#00C2FF] text-[10px] font-mono font-bold uppercase">
                  CODE: {room.roomCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="text-slate-400 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <h3 className="text-xs font-bold text-slate-200 mt-1 truncate max-w-[200px]">
                {room.roomName}
              </h3>
            </div>

            <button
              onClick={handleSyncToHost}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-[#00C2FF] text-[11px] font-bold flex items-center gap-1 hover:bg-cyan-500/20 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Sync Host
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {(room.messages || []).map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.userId === user?.id ? 'flex-row-reverse' : ''}`}
              >
                <img
                  src={msg.userAvatar}
                  alt={msg.userName}
                  className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
                />
                <div
                  className={`max-w-[78%] p-2.5 rounded-2xl text-xs space-y-0.5 ${
                    msg.userId === 'system'
                      ? 'bg-cyan-950/40 border border-cyan-500/20 text-cyan-200 w-full text-center'
                      : msg.userId === user?.id
                      ? 'bg-[#00C2FF] text-black font-medium'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/50'
                  }`}
                >
                  {msg.userId !== 'system' && (
                    <div className="flex items-center justify-between text-[10px] opacity-70 mb-0.5 gap-2">
                      <span className="font-bold truncate">{msg.userName}</span>
                      <span className="font-mono text-[9px]">{msg.time}</span>
                    </div>
                  )}
                  <p className="leading-relaxed break-words">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input Box */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
            <input
              type="text"
              placeholder="Chat with watch party..."
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00C2FF]"
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!msgInput.trim()}
              className="p-2 rounded-xl bg-[#00C2FF] text-black font-bold disabled:opacity-50 hover:brightness-110 transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

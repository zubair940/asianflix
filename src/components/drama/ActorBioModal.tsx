import React, { useState } from 'react';
import { Drama } from '../../types.js';
import { Heart, Star, Film, X, Sparkles, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ActorBioModalProps {
  actorName: string;
  dramas: Drama[];
  isOpen: boolean;
  onClose: () => void;
}

export const ActorBioModal: React.FC<ActorBioModalProps> = ({
  actorName,
  dramas,
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const [fansCount, setFansCount] = useState(14820);
  const [isFan, setIsFan] = useState(false);

  if (!isOpen || !actorName) return null;

  // Filter dramas where cast includes actorName
  const actorDramas = dramas.filter((d) =>
    d.cast.some((c) => c.toLowerCase().includes(actorName.toLowerCase()))
  );

  const toggleFan = () => {
    if (isFan) {
      setFansCount((prev) => prev - 1);
      setIsFan(false);
    } else {
      setFansCount((prev) => prev + 1);
      setIsFan(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-rose-500/40 shadow-xl shrink-0">
            <img
              src={`https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80`}
              alt={actorName}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-center sm:text-left space-y-2 flex-1">
            <div>
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-1">
                <Sparkles className="w-3 h-3" /> CELEBRITY PROFILE
              </span>
              <h2 className="text-xl font-extrabold text-white">{actorName}</h2>
              <p className="text-xs text-slate-400">South Korean Actor / Model • Born 1994</p>
            </div>

            <button
              onClick={toggleFan}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isFan
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFan ? 'fill-white' : ''}`} />
              {isFan ? 'In Fan Club' : 'Join Fan Club'} ({fansCount.toLocaleString()} Fans)
            </button>
          </div>
        </div>

        {/* Bio summary */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
          <p>
            {actorName} is one of South Korea's top award-winning leading actors, widely recognized for versatile dramatic roles, romantic comedy leads, and international popularity.
          </p>
        </div>

        {/* Filmography on KDramaBox */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Film className="w-4 h-4 text-[#00C2FF]" /> Starring Dramas ({actorDramas.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
            {actorDramas.map((d) => (
              <div
                key={d.id}
                onClick={() => {
                  onClose();
                  navigate(`/drama/${d.id}`);
                }}
                className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-[#00C2FF] flex items-center gap-3 transition-all cursor-pointer group"
              >
                <img
                  src={d.poster}
                  alt={d.title}
                  className="w-10 h-14 rounded-lg object-cover group-hover:scale-105 transition-transform"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-[#00C2FF] transition-colors">
                    {d.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{d.releaseYear}</span>
                    <span className="flex items-center text-amber-400 font-bold">
                      <Star className="w-3 h-3 fill-amber-400 mr-0.5" /> {d.averageRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

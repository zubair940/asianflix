import React, { useState, useEffect } from 'react';
import { dramaService } from '../services/dramaService.js';
import { userService } from '../services/userService.js';
import { useAuth } from '../context/AuthContext.js';
import { Drama, WatchHistoryItem } from '../types.js';
import { HeroSection } from '../components/homepage/HeroSection.js';
import { DramaRow } from '../components/homepage/DramaRow.tsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { GENRES } from '../utils/constants.js';
import { Flame, Sparkles, Clock, Compass, ThumbsUp, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const { user } = useAuth();

  const [trending, setTrending] = useState<Drama[]>([]);
  const [latest, setLatest] = useState<Drama[]>([]);
  const [recommended, setRecommended] = useState<Drama[]>([]);
  const [historyItems, setHistoryItems] = useState<WatchHistoryItem[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [genreDramas, setGenreDramas] = useState<Drama[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeContent();
  }, [user]);

  const loadHomeContent = async () => {
    setLoading(true);
    try {
      const [tData, lData, allData] = await Promise.all([
        dramaService.getTrending(),
        dramaService.getLatest(),
        dramaService.getAllDramas()
      ]);

      setTrending(tData);
      setLatest(lData);
      setRecommended(allData.dramas.filter((d) => d.averageRating >= 4.8));

      if (user) {
        const hist = await userService.getWatchHistory();
        setHistoryItems(hist);
      }
    } catch (err) {
      console.error('Home content load error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGenre !== 'All') {
      dramaService.getByGenre(selectedGenre).then((res) => setGenreDramas(res)).catch(() => {});
    }
  }, [selectedGenre]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner label="Loading Asian Dramas..." />
      </div>
    );
  }

  // Check if platform has zero dramas
  const hasNoDramas = trending.length === 0 && latest.length === 0 && recommended.length === 0;

  // Hero Drama (top 1 trending)
  const heroDrama = trending[0] || latest[0];

  // Map watch history to dramas for Continue Watching
  const historyMap: Record<string, WatchHistoryItem> = {};
  const continueWatchingDramas: Drama[] = [];

  historyItems.forEach((h) => {
    if (h.drama) {
      historyMap[h.drama.id] = h;
      if (!continueWatchingDramas.some((d) => d.id === h.drama!.id)) {
        continueWatchingDramas.push(h.drama);
      }
    }
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Autoplay Hero Banner */}
      {heroDrama && <HeroSection drama={heroDrama} />}

      {/* Quick Category Genre Pills Filter */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${heroDrama ? '-mt-6' : 'pt-24'} relative z-20`}>
        <div className="p-3 rounded-2xl bg-slate-900/95 border border-white/10 backdrop-blur-md shadow-2xl flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-xs font-bold text-[#00C2FF] px-3 flex items-center gap-1.5 shrink-0">
            <Compass className="w-4 h-4 text-[#00C2FF]" /> Genre Filter:
          </span>
          {GENRES.map((g) => {
            const active = selectedGenre === g;
            return (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-gradient-to-r from-[#00C2FF] to-[#0047FF] text-black shadow-lg shadow-cyan-500/30 font-extrabold'
                    : 'bg-[#050505] text-slate-300 hover:bg-slate-800 hover:text-white border border-white/10'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Empty State if Database is completely empty */}
      {hasNoDramas && selectedGenre === 'All' && (
        <div className="max-w-4xl mx-auto px-4 pt-12">
          <EmptyState
            title="No Dramas Uploaded Yet"
            description="Our database is currently clean and empty. As soon as the administrator uploads dramas and episodes, they will appear right here!"
            showAdminPrompt={true}
          />
        </div>
      )}

      {/* Filtered Genre Row if user selected specific genre */}
      {selectedGenre !== 'All' && (
        genreDramas.length > 0 ? (
          <DramaRow
            title={`${selectedGenre} Dramas`}
            subtitle={`Top rated dramas in ${selectedGenre}`}
            icon={<Heart className="w-5 h-5 text-rose-500" />}
            dramas={genreDramas}
          />
        ) : (
          <div className="max-w-3xl mx-auto px-4 pt-8">
            <EmptyState
              icon="search"
              title={`No ${selectedGenre} Dramas Found`}
              description={`There are currently no uploaded dramas under the ${selectedGenre} category.`}
              actionText="Reset Genre Filter"
              onActionClick={() => setSelectedGenre('All')}
              showAdminPrompt={false}
            />
          </div>
        )
      )}

      {/* Continue Watching Row (if user logged in & has history) */}
      {continueWatchingDramas.length > 0 && (
        <DramaRow
          title="Continue Watching"
          subtitle="Resume playback right where you left off"
          icon={<Clock className="w-5 h-5 text-rose-400" />}
          dramas={continueWatchingDramas}
          historyMap={historyMap}
        />
      )}

      {/* Trending Now Row */}
      {trending.length > 0 && (
        <DramaRow
          title="Trending Now"
          subtitle="Most watched Asian series this week"
          icon={<Flame className="w-5 h-5 text-amber-400" />}
          dramas={trending}
        />
      )}

      {/* Latest Uploads Row */}
      {latest.length > 0 && (
        <DramaRow
          title="Latest Uploads"
          subtitle="Newly added episodes & dramas"
          icon={<Sparkles className="w-5 h-5 text-[#00C2FF]" />}
          dramas={latest}
        />
      )}

      {/* Recommended for You Row */}
      {recommended.length > 0 && (
        <DramaRow
          title="Recommended for You"
          subtitle="Critically acclaimed & top rated 4.8+ stars"
          icon={<ThumbsUp className="w-5 h-5 text-emerald-400" />}
          dramas={recommended}
        />
      )}
    </div>
  );
};

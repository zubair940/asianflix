import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Drama, WatchHistoryItem } from '../types.js';
import { HeroSection } from '../components/homepage/HeroSection.js';
import { DramaRow } from '../components/homepage/DramaRow.tsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { GENRES } from '../utils/constants.js';
import { Flame, Sparkles, Clock, Compass, ThumbsUp, Heart, Film } from 'lucide-react';
import { useHomeData } from '../hooks/index.js';
import { userService } from '../services/userService.js';

export const Home: React.FC = () => {
  const { user } = useAuth();

  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [genreDramas, setGenreDramas] = useState<Drama[]>([]);
  const [historyItems, setHistoryItems] = useState<WatchHistoryItem[]>([]);

  // Single combined fetch: trending + latest + all in one serverless call
  const { data: homeData, loading } = useHomeData();

  // Memoized derived data
  const trending = useMemo(() => homeData?.trending || [], [homeData]);
  const latest = useMemo(() => homeData?.latest || [], [homeData]);
  const recommended = useMemo(
    () => (homeData?.all || []).filter((d) => d.averageRating >= 4.8),
    [homeData]
  );

  const heroDrama = useMemo(() => trending[0] || latest[0], [trending, latest]);

  const hasNoDramas = useMemo(
    () => trending.length === 0 && latest.length === 0 && recommended.length === 0,
    [trending, latest, recommended]
  );

  // Load user watch history
  useEffect(() => {
    if (user) {
      userService.getWatchHistory().then(setHistoryItems).catch(console.error);
    } else {
      setHistoryItems([]);
    }
  }, [user]);

  // Load genre-specific dramas
  useEffect(() => {
    if (selectedGenre !== 'All') {
      fetch(`/api/dramas/genre/${encodeURIComponent(selectedGenre)}`)
        .then((res) => res.json())
        .then(setGenreDramas)
        .catch(() => setGenreDramas([]));
    } else {
      setGenreDramas([]);
    }
  }, [selectedGenre]);

  // Memoized continue watching dramas
  const continueWatchingDramas = useMemo((): Drama[] => {
    const dramaMap = new Map<string, Drama>();
    historyItems.forEach((h) => {
      if (h.drama && !dramaMap.has(h.drama.id)) {
        dramaMap.set(h.drama.id, h.drama);
      }
    });
    return Array.from(dramaMap.values());
  }, [historyItems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <LoadingSpinner label="Loading Asian Dramas..." size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
      {/* Autoplay Hero Banner */}
      {heroDrama && <HeroSection drama={heroDrama} />}

      {/* Quick Category Genre Pills Filter */}
      <div className={`container ${heroDrama ? '-mt-8' : 'pt-28'} relative z-20`}>
        <div className="p-3 rounded-2xl glass-strong shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)] flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-xs font-bold text-cyan-400 px-3 flex items-center gap-1.5 shrink-0">
            <Compass className="w-4 h-4" aria-hidden="true" />
            Genre Filter:
          </span>
          {GENRES.map((g) => {
            const active = selectedGenre === g;
            return (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-gray-950 shadow-lg shadow-cyan-500/30 font-extrabold'
                    : 'bg-gray-950/80 text-gray-300 hover:bg-gray-800 hover:text-white border border-white/10'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Empty State */}
      {hasNoDramas && selectedGenre === 'All' && (
        <div className="container pt-16">
          <EmptyState
            title="No Dramas Uploaded Yet"
            description="Our database is currently clean and empty. As soon as the administrator uploads dramas and episodes, they will appear right here!"
            showAdminPrompt={true}
          />
        </div>
      )}

      {/* Filtered Genre Row */}
      {selectedGenre !== 'All' && (
        genreDramas.length > 0 ? (
          <DramaRow
            title={`${selectedGenre} Dramas`}
            subtitle={`Top rated dramas in ${selectedGenre}`}
            icon={<Heart className="w-5 h-5 text-rose-500" />}
            dramas={genreDramas}
          />
        ) : (
          <div className="container pt-12">
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

      {/* Continue Watching Row */}
      {continueWatchingDramas.length > 0 && (
        <DramaRow
          title="Continue Watching"
          subtitle="Resume playback right where you left off"
          icon={<Clock className="w-5 h-5 text-rose-400" />}
          dramas={continueWatchingDramas}
          historyMap={historyItems.reduce((acc, h) => ({ ...acc, [h.drama!.id]: h }), {} as Record<string, WatchHistoryItem>)}
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
          icon={<Sparkles className="w-5 h-5 text-cyan-400" />}
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

      {/* CTA Section */}
      {hasNoDramas && (
        <div className="container pt-12 pb-8">
          <div className="glass-strong rounded-3xl p-8 sm:p-12 text-center">
            <Film className="w-16 h-16 text-cyan-400/50 mx-auto mb-6" aria-hidden="true" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Welcome to AsianFlix
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              The premier destination for streaming Asian dramas in HD. Discover thousands of titles
              across Korean, Chinese, Japanese, Pakistani, Turkish, and Thai dramas.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href="/search" className="btn-primary">
                <Sparkles className="w-5 h-5" aria-hidden="true" />
                Explore Library
              </a>
              <a href="/login" className="btn-secondary">
                <Film className="w-5 h-5" aria-hidden="true" />
                Sign In to Watch
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
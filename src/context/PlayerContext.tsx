import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Drama, Episode } from '../types.js';

interface PlayerContextType {
  autoPlayNext: boolean;
  setAutoPlayNext: (val: boolean) => void;
  currentDrama: Drama | null;
  setCurrentDrama: (d: Drama | null) => void;
  currentEpisode: Episode | null;
  setCurrentEpisode: (e: Episode | null) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(() => {
    return localStorage.getItem('kdramabox_autoplay') !== 'false';
  });

  const [currentDrama, setCurrentDrama] = useState<Drama | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);

  const handleSetAutoPlayNext = (val: boolean) => {
    setAutoPlayNext(val);
    localStorage.setItem('kdramabox_autoplay', val ? 'true' : 'false');
  };

  return (
    <PlayerContext.Provider
      value={{
        autoPlayNext,
        setAutoPlayNext: handleSetAutoPlayNext,
        currentDrama,
        setCurrentDrama,
        currentEpisode,
        setCurrentEpisode
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};

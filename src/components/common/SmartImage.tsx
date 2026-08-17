import React, { useState } from 'react';

// Default placeholder shown when a drama poster/backdrop/banner fails to load
// (e.g. old Vercel Blob URLs that no longer exist after moving to the local
// media server).
export const DEFAULT_IMAGE_FALLBACK =
  'https://via.placeholder.com/300x450/1a1a2e/ffffff?text=No+Image';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

// <img> that swaps to a fallback URL on error, with a loop guard so a broken
// fallback can't cause infinite retries.
const SmartImage = React.memo(function SmartImage({
  src,
  alt,
  fallbackSrc = DEFAULT_IMAGE_FALLBACK,
  onError,
  ...rest
}: SmartImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const [usedFallback, setUsedFallback] = useState(false);

  return (
    <img
      {...rest}
      src={currentSrc}
      alt={alt}
      onError={(e) => {
        onError?.(e);
        if (usedFallback) return;
        setUsedFallback(true);
        setCurrentSrc(fallbackSrc);
      }}
    />
  );
});

SmartImage.displayName = 'SmartImage';

export { SmartImage };

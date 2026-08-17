import { QueryClient } from '@tanstack/react-query';

// Single shared React Query client for the whole app.
//
// Tuning notes:
//  - staleTime 5m: drama lists/analytics don't change faster than this, so
//    navigating between pages reuses cached data (no refetch flash).
//  - retry with 401/expired guard: never retry auth failures.
//  - refetchOnWindowFocus off: avoids surprise network bursts when tabbing
//    back to the site.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        if (failureCount >= 3) return false;
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('SESSION_EXPIRED'))) return false;
        return true;
      },
      refetchOnWindowFocus: false,
    },
  },
});
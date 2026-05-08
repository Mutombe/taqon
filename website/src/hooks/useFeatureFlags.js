import { useQuery } from '@tanstack/react-query';
import { featureFlagsApi } from '../api/featureFlags';

const STALE_5_MIN = 5 * 60 * 1000;

/**
 * Loads platform feature flags once per session and caches via React Query.
 *
 * Returns:
 *   {
 *     flags: { [key]: bool },
 *     isLoaded: bool,
 *     isFlagOn: (key) => bool,   // false-by-default while loading
 *   }
 *
 * The `isFlagOn` helper defaults to **false** for any unknown or
 * still-loading flag — fail-closed gating is safer than fail-open.
 */
export function useFeatureFlags() {
  const query = useQuery({
    queryKey: ['feature-flags'],
    queryFn: () => featureFlagsApi.get().then((r) => r.data),
    staleTime: STALE_5_MIN,
    gcTime: STALE_5_MIN * 2,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const flags = query.data || {};
  const isLoaded = query.isSuccess;
  const isFlagOn = (key) => Boolean(flags[key]);

  return { flags, isLoaded, isFlagOn, isLoading: query.isLoading, error: query.error };
}

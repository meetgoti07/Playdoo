import useSWR from 'swr';

interface LocationData {
  states?: string[];
  cities?: string[];
  state?: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useStates() {
  const { data, error, isLoading } = useSWR<LocationData>(
    '/api/search/locations',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
    }
  );

  return {
    states: data?.states || [],
    isLoading,
    error
  };
}

export function useCities(state: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<LocationData>(
    state ? `/api/search/locations?state=${encodeURIComponent(state.trim())}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2 * 60 * 1000, // 2 minutes - shorter cache for debugging
    }
  );

  return {
    cities: data?.cities || [],
    isLoading,
    error,
    refresh: mutate // Allow manual refresh
  };

}

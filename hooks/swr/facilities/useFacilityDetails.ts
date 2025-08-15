import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useFacilityDetails(facilityId: string) {
  return useSWR(
    facilityId ? `/api/owner/facilities/${facilityId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );
}

export default useFacilityDetails;

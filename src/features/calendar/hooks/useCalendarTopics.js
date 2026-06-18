import { useQuery } from '@tanstack/react-query';
import { getTopics } from '../../../api/topicService';

// useQuery is React Query's data-fetching hook. Think of it as a reactive Spring
// @Cacheable method — it fetches once, caches the result, and automatically
// refetches in the background when the cache goes stale (after staleTime ms).
export function useCalendarTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: getTopics,
    staleTime: 60_000,
  });
}

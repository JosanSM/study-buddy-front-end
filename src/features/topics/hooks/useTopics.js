import { useQuery } from '@tanstack/react-query';
import { getTopics } from '../../../api/topicService';

export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: getTopics,
  });
}
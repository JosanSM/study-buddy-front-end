import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewTopic } from '../../../api/topicService';

export function useReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, confidence }) => reviewTopic(id, confidence),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}

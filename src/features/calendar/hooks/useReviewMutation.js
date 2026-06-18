import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewTopic } from '../../../api/topicService';

export function useReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, confidence }) => reviewTopic(id, confidence),
    onSuccess: () => {
      // Invalidate the topics cache so the calendar grid refetches updated
      // nextReviewAt dates immediately after marking a topic as studied.
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}

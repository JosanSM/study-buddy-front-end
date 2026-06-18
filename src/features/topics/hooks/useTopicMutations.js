import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTopic, updateTopic, deleteTopic } from '../../../api/topicService';

export function useTopicMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createTopic,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics'] }),
  });

  const update = useMutation({
    mutationFn: updateTopic,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics'] }),
  });

  const remove = useMutation({
    mutationFn: (id) => deleteTopic(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics'] }),
  });

  return { create, update, remove };
}

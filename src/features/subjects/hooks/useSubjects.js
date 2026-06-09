import { useQuery } from '@tanstack/react-query';
import { getSubjects } from '../../../api/subjectService';

export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects,
  });
}
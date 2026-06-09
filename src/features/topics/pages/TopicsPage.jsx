import { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTopics } from '../hooks/useTopics';
import { useSubjects } from '../../subjects/hooks/useSubjects';
import TopicCard from '../components/TopicCard';
import EmptyState from '../../../components/feedback/EmptyState';

export default function TopicsPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const { data: topics = [], isLoading, isError } = useTopics();
  const { data: subjects = [] } = useSubjects();

  const filteredTopics = selectedSubjectId
    ? topics.filter((t) => String(t.subjectId) === String(selectedSubjectId))
    : topics;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load topics. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Subject</InputLabel>
          <Select
            value={selectedSubjectId}
            label="Subject"
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            <MenuItem value="">All Subjects</MenuItem>
            {subjects.map((subject) => (
              <MenuItem key={subject.id} value={subject.id}>
                {subject.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {filteredTopics.length === 0 ? (
        <EmptyState
          message={
            selectedSubjectId
              ? 'No topics found for this subject.'
              : 'No topics yet. Start by adding one.'
          }
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 2,
          }}
        >
          {filteredTopics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </Box>
      )}
    </Box>
  );
}
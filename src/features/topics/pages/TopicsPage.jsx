import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTopics } from '../hooks/useTopics';
import { useSubjects } from '../../subjects/hooks/useSubjects';
import TopicCard from '../components/TopicCard';
import TopicDetailPanel from '../components/TopicDetailPanel';
import NewTopicPanel from '../components/NewTopicPanel';
import EmptyState from '../../../components/feedback/EmptyState';
import { PANEL_DIALOG_SX } from '../../../components/layout/panelDialogSx';

export default function TopicsPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [newTopicOpen, setNewTopicOpen] = useState(false);

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
    <>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Subject</InputLabel>
            <Select
              variant="outlined"
              value={selectedSubjectId}
              label="Select Subject"
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewTopicOpen(true)}
          >
            New Topic
          </Button>
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
              <TopicCard key={topic.id} topic={topic} onOpen={setSelectedTopic} />
            ))}
          </Box>
        )}
      </Box>

      {/* Edit topic */}
      <Dialog
        open={Boolean(selectedTopic)}
        onClose={() => setSelectedTopic(null)}
        maxWidth={false}
        sx={PANEL_DIALOG_SX}
      >
        {selectedTopic !== null && (
          <TopicDetailPanel
            key={selectedTopic.id}
            topic={selectedTopic}
            subjects={subjects}
            onClose={() => setSelectedTopic(null)}
          />
        )}
      </Dialog>

      {/* Create topic */}
      <Dialog
        open={newTopicOpen}
        onClose={() => setNewTopicOpen(false)}
        maxWidth={false}
        sx={PANEL_DIALOG_SX}
      >
        {newTopicOpen && (
          <NewTopicPanel
            key="new-topic"
            subjects={subjects}
            defaultSubjectId={selectedSubjectId}
            onClose={() => setNewTopicOpen(false)}
          />
        )}
      </Dialog>
    </>
  );
}
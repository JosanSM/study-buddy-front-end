import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Dialog,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useCalendarTopics } from '../hooks/useCalendarTopics';
import { useSubjects } from '../../subjects/hooks/useSubjects';
import { CalendarGrid } from '../components/CalendarGrid';
import TopicDetailPanel from '../../topics/components/TopicDetailPanel';
import { PANEL_DIALOG_SX } from '../../../components/layout/panelDialogSx';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarPage() {
  // currentMonth tracks which month is displayed. We store a Date and derive
  // year/month from it so navigation is a simple month offset operation.
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedTopic, setSelectedTopic] = useState(null);

  const { data: topics = [], isLoading, isError } = useCalendarTopics();
  const { data: subjects = [] } = useSubjects();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const goToPrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Build a Map from 'YYYY-MM-DD' → topic[] for all topics that have a nextReviewAt.
  // useMemo recalculates only when the topics array reference changes (i.e., after a
  // React Query refetch) — similar to a @Cacheable method that re-runs on cache eviction.
  const topicsByDate = useMemo(() => {
    const map = new Map();
    topics.forEach((topic) => {
      if (!topic.nextReviewAt) return;
      const key = topic.nextReviewAt; // already 'YYYY-MM-DD'
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(topic);
    });
    return map;
  }, [topics]);

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
        {/* Month navigation header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={goToPrevMonth}
            startIcon={<ChevronLeftIcon />}
          >
            Prev
          </Button>
          <Typography variant="h6" sx={{ minWidth: 180, textAlign: 'center' }}>
            {MONTH_NAMES[month]} {year}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={goToNextMonth}
            endIcon={<ChevronRightIcon />}
          >
            Next
          </Button>
        </Box>

        <CalendarGrid
          year={year}
          month={month}
          topicsByDate={topicsByDate}
          onTopicClick={setSelectedTopic}
        />
      </Box>

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
    </>
  );
}

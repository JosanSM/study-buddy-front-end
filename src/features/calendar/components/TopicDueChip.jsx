import { Chip } from '@mui/material';

export function TopicDueChip({ topic, onClick, isOverdue }) {
  return (
    <Chip
      label={topic.title}
      size="small"
      clickable
      onClick={onClick}
      color={isOverdue ? 'error' : 'primary'}
      aria-label={isOverdue ? `${topic.title} (overdue)` : topic.title}
      sx={{ maxWidth: '100%', mb: 0.5 }}
    />
  );
}

import { Box, Typography } from '@mui/material';
import { TopicDueChip } from './TopicDueChip';

export function CalendarDayCell({ date, topics, isCurrentMonth, isToday, onTopicClick }) {
  return (
    <Box
      sx={{
        minHeight: 100,
        p: 0.75,
        borderRight: '1px solid',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: isCurrentMonth ? 'background.paper' : 'action.hover',
        overflow: 'hidden',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          textAlign: 'right',
          fontWeight: isToday ? 700 : 400,
          color: isToday ? 'primary.main' : isCurrentMonth ? 'text.primary' : 'text.disabled',
          mb: 0.5,
        }}
      >
        {date.getDate()}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {topics.map((topic) => (
          <TopicDueChip
            key={topic.id}
            topic={topic}
            isOverdue={topic._isOverdue}
            onClick={() => onTopicClick(topic)}
          />
        ))}
      </Box>
    </Box>
  );
}

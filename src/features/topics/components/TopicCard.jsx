import { Card, CardContent, CardActions, Box, Typography, IconButton, Chip } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TopicStatusChip from './TopicStatusChip';

export default function TopicCard({ topic, onOpen }) {
  return (
    <Card
      variant="outlined"
      sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Chip label="topic" size="small" variant="outlined" />
          <TopicStatusChip status={topic.topicStatus} />
        </Box>
        <Typography variant="body1" fontWeight={500}>
          {topic.title}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
        <IconButton
          size="small"
          onClick={() => onOpen(topic)}
          aria-label={`Open ${topic.title}`}
        >
          <ArrowForwardIcon fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  );
}
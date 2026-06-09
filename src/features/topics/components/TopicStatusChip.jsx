import { Chip } from '@mui/material';

const STATUS_CONFIG = {
  NOT_STARTED: { label: 'Not Started', color: 'default' },
  IN_PROGRESS: { label: 'In Progress', color: 'info' },
  COMPLETED: { label: 'Completed', color: 'success' },
};

export default function TopicStatusChip({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.NOT_STARTED;
  return <Chip label={config.label} color={config.color} size="small" />;
}
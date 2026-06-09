import { Box, Typography } from '@mui/material';

export default function EmptyState({ message = 'Nothing to show yet.' }) {
  return (
    <Box sx={{ p: 6, textAlign: 'center' }}>
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}
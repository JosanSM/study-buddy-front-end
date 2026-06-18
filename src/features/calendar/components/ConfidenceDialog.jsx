import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slider,
  Box,
  Alert,
  Typography,
} from '@mui/material';

const SLIDER_MARKS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
];

export function ConfidenceDialog({ open, onClose, onConfirm, isPending, error }) {
  const [confidence, setConfidence] = useState(3);

  const handleConfirm = () => {
    onConfirm(confidence);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>How comfortable do you feel with this topic?</DialogTitle>
      <DialogContent>
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            1 — Not at all &nbsp;&nbsp; 5 — Very comfortable
          </Typography>
          <Slider
            value={confidence}
            onChange={(_, val) => setConfidence(val)}
            min={1}
            max={5}
            step={1}
            marks={SLIDER_MARKS}
            valueLabelDisplay="auto"
          />
        </Box>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={isPending}
        >
          Confirm review
        </Button>
      </DialogActions>
    </Dialog>
  );
}

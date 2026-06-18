import { useState } from 'react';
import { Button } from '@mui/material';
import TopicDetailPanel from '../../../features/topics/components/TopicDetailPanel';
import { ConfidenceDialog } from './ConfidenceDialog';
import { useReviewMutation } from '../hooks/useReviewMutation';
import { getErrorMessage } from '../../../utils/errorUtils';

// This component wraps TopicDetailPanel and adds the "Mark as Studied?" flow.
// The calendar feature owns the review action; TopicDetailPanel stays unaware of it.
export function CalendarTopicDetailPanel({ topic, subjects, onClose }) {
  const [confidenceDialogOpen, setConfidenceDialogOpen] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  const reviewMutation = useReviewMutation();

  const handleConfirm = async (confidence) => {
    setReviewError(null);
    try {
      await reviewMutation.mutateAsync({ id: topic.id, confidence });
      setConfidenceDialogOpen(false);
      onClose();
    } catch (err) {
      setReviewError(getErrorMessage(err));
    }
  };

  const footerActions = (
    <Button
      variant="outlined"
      onClick={() => setConfidenceDialogOpen(true)}
      disabled={reviewMutation.isPending}
    >
      Mark as Studied?
    </Button>
  );

  return (
    <>
      <TopicDetailPanel
        topic={topic}
        subjects={subjects}
        onClose={onClose}
        footerActions={footerActions}
      />
      <ConfidenceDialog
        open={confidenceDialogOpen}
        onClose={() => setConfidenceDialogOpen(false)}
        onConfirm={handleConfirm}
        isPending={reviewMutation.isPending}
        error={reviewError}
      />
    </>
  );
}

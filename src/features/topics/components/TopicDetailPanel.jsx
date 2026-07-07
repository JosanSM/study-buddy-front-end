import { useState, useRef } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Chip,
  Menu,
  Divider,
  Alert,
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import RichTextEditor from './RichTextEditor';
import { useTopicMutations } from '../hooks/useTopicMutations';
import { useReviewMutation } from '../hooks/useReviewMutation';
import ConfidenceDialog from '../../../components/feedback/ConfidenceDialog';
import { getErrorMessage } from '../../../utils/errorUtils';

const STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

function parseNotes(notes) {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (parsed?.type === 'doc') return parsed;
    return null;
  } catch {
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: notes }] }],
    };
  }
}

export default function TopicDetailPanel({ topic, subjects, onClose }) {
  const containerRef = useRef(null);
  const [title, setTitle] = useState(topic.title);
  const [status, setStatus] = useState(topic.topicStatus);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [error, setError] = useState(null);
  const [confidenceDialogOpen, setConfidenceDialogOpen] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  const { update, remove } = useTopicMutations();
  const reviewMutation = useReviewMutation();
  const subjectName = subjects.find((s) => String(s.id) === String(topic.subjectId))?.name ?? '—';

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Start writing notes…' }),
    ],
    content: parseNotes(topic.notes),
  });

  const buildPayload = () => ({
    id: topic.id,
    title,
    notes: editor ? JSON.stringify(editor.getJSON()) : topic.notes,
    topicStatus: status,
    subjectId: topic.subjectId,
  });

  const handleSave = async () => {
    setError(null);
    try {
      await update.mutateAsync(buildPayload());
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await remove.mutateAsync(topic.id);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleReviewConfirm = async (confidence) => {
    setReviewError(null);
    try {
      await reviewMutation.mutateAsync({ id: topic.id, confidence });
      setConfidenceDialogOpen(false);
      onClose();
    } catch (err) {
      setReviewError(getErrorMessage(err));
    }
  };

  const closeMenu = () => setMenuAnchor(null);
  const isPending = update.isPending || remove.isPending;

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: 3,
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexShrink: 0 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onClose} variant="outlined" size="small">
          Back
        </Button>
        <IconButton
          size="small"
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          aria-label="Topic options"
        >
          <MoreHorizIcon />
        </IconButton>
        {/* disablePortal keeps the menu in the same DOM tree so ClickAwayListener
            at the page level doesn't misfire when menu items are clicked */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
          disablePortal
        >
          <MenuItem onClick={() => { closeMenu(); onClose(); }}>Exit</MenuItem>
          <MenuItem disabled={isPending} onClick={() => { closeMenu(); handleSave(); }}>
            Save
          </MenuItem>
          <Divider />
          <MenuItem
            disabled={isPending}
            onClick={() => { closeMenu(); handleDelete(); }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        </Menu>
      </Box>

      {/* Title */}
      <TextField
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        label="Topic Title"
        fullWidth
        sx={{ mb: 2, flexShrink: 0 }}
      />

      {/* Subject (static) + Status dropdown */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexShrink: 0 }}>
        <Chip label={subjectName} variant="outlined" size="small" />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Topic Status</InputLabel>
          <Select
            variant="outlined"
            value={status}
            label="Topic Status"
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      {/* TipTap rich text editor — flex: 1 so it fills remaining height, overflow hidden
          lets the editor's inner scroll container handle overflow */}
      <Box sx={{ flex: 1, overflow: 'hidden', mb: 2 }}>
        <RichTextEditor editor={editor} containerRef={containerRef} />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <Button
          variant="outlined"
          onClick={() => setConfidenceDialogOpen(true)}
          disabled={isPending || reviewMutation.isPending}
        >
          Mark as Studied?
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={isPending}>
          Save
        </Button>
      </Box>

      <ConfidenceDialog
        open={confidenceDialogOpen}
        onClose={() => setConfidenceDialogOpen(false)}
        onConfirm={handleReviewConfirm}
        isPending={reviewMutation.isPending}
        error={reviewError}
      />
    </Box>
  );
}

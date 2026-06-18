import { useState, useRef } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import RichTextEditor from './RichTextEditor';
import { useTopicMutations } from '../hooks/useTopicMutations';
import { getErrorMessage } from '../../../utils/errorUtils';

const STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function NewTopicPanel({ subjects, defaultSubjectId, onClose }) {
  const containerRef = useRef(null);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? '');
  const [status, setStatus] = useState('NOT_STARTED');
  const [error, setError] = useState(null);

  const { create } = useTopicMutations();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Start writing notes…' }),
    ],
    content: null,
  });

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!subjectId) {
      setError('Please select a subject.');
      return;
    }
    setError(null);
    try {
      await create.mutateAsync({
        title: title.trim(),
        notes: editor ? JSON.stringify(editor.getJSON()) : null,
        topicStatus: status,
        subjectId,
      });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexShrink: 0 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onClose} variant="outlined" size="small">
          Back
        </Button>
      </Box>

      {/* Title */}
      <TextField
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        label="Topic Title"
        fullWidth
        sx={{ mb: 2, flexShrink: 0 }}
      />

      {/* Subject dropdown + Status dropdown */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexShrink: 0 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Subject</InputLabel>
          <Select
            variant="outlined"
            value={subjectId}
            label="Subject"
            onChange={(e) => setSubjectId(e.target.value)}
          >
            {subjects.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
            {/* Future: add "Create new subject" option here */}
          </Select>
        </FormControl>
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

      {/* Rich text editor — flex: 1 fills remaining height */}
      <Box sx={{ flex: 1, overflow: 'hidden', mb: 2 }}>
        <RichTextEditor editor={editor} containerRef={containerRef} />
      </Box>

      {/* Create button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
        <Button variant="contained" onClick={handleCreate} disabled={create.isPending}>
          Create
        </Button>
      </Box>
    </Box>
  );
}
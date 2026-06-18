import { Box, Divider, IconButton, Paper, Tooltip } from '@mui/material';
import { EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import CodeIcon from '@mui/icons-material/Code';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import DataObjectIcon from '@mui/icons-material/DataObject';

function TBtn({ label, active, onClick, children }) {
  return (
    <Tooltip title={label} placement="top" disableInteractive>
      <IconButton
        size="small"
        onClick={onClick}
        sx={{
          borderRadius: 1,
          p: '4px',
          bgcolor: active ? 'action.selected' : 'transparent',
          color: active ? 'primary.main' : 'text.secondary',
          '&:hover': { bgcolor: active ? 'action.selected' : 'action.hover' },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}

export default function RichTextEditor({ editor, containerRef }) {
  if (!editor) return null;

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Fixed toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.25,
          px: 1,
          py: 0.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50',
          borderRadius: '4px 4px 0 0',
          flexShrink: 0,
        }}
      >
        {/* Inline formatting */}
        <TBtn label="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <FormatBoldIcon sx={{ fontSize: 18 }} />
        </TBtn>
        <TBtn label="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <FormatItalicIcon sx={{ fontSize: 18 }} />
        </TBtn>
        <TBtn label="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <FormatUnderlinedIcon sx={{ fontSize: 18 }} />
        </TBtn>
        <TBtn label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <StrikethroughSIcon sx={{ fontSize: 18 }} />
        </TBtn>
        <TBtn label="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
          <CodeIcon sx={{ fontSize: 18 }} />
        </TBtn>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Headings */}
        <TBtn
          label="Heading 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Box component="span" sx={{ fontSize: '11px', fontWeight: 700, lineHeight: 1, px: '2px' }}>H1</Box>
        </TBtn>
        <TBtn
          label="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Box component="span" sx={{ fontSize: '11px', fontWeight: 700, lineHeight: 1, px: '2px' }}>H2</Box>
        </TBtn>
        <TBtn
          label="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Box component="span" sx={{ fontSize: '11px', fontWeight: 700, lineHeight: 1, px: '2px' }}>H3</Box>
        </TBtn>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Block formatting */}
        <TBtn label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <FormatListBulletedIcon sx={{ fontSize: 18 }} />
        </TBtn>
        <TBtn label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <FormatListNumberedIcon sx={{ fontSize: 18 }} />
        </TBtn>
        <TBtn label="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <FormatQuoteIcon sx={{ fontSize: 18 }} />
        </TBtn>
        <TBtn label="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <DataObjectIcon sx={{ fontSize: 18 }} />
        </TBtn>
      </Box>

      {/* Bubble menu — floats above selected text for quick inline formatting.
          appendTo pins the portal to the panel container so ClickAwayListener
          at the page level doesn't misfire when bubble menu buttons are clicked. */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{
          duration: 100,
          appendTo: () => containerRef?.current ?? document.body,
        }}
      >
        <Paper elevation={4} sx={{ display: 'flex', p: 0.5, gap: 0.25, borderRadius: 1 }}>
          <TBtn label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <FormatBoldIcon sx={{ fontSize: 16 }} />
          </TBtn>
          <TBtn label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <FormatItalicIcon sx={{ fontSize: 16 }} />
          </TBtn>
          <TBtn label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <FormatUnderlinedIcon sx={{ fontSize: 16 }} />
          </TBtn>
          <TBtn label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <StrikethroughSIcon sx={{ fontSize: 16 }} />
          </TBtn>
          <TBtn label="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
            <CodeIcon sx={{ fontSize: 16 }} />
          </TBtn>
        </Paper>
      </BubbleMenu>

      {/* Editable area — flex: 1 fills remaining height, overflow: auto enables scrolling */}
      <Box
        onClick={() => editor.commands.focus()}
        sx={{
          p: 2,
          cursor: 'text',
          flex: 1,
          overflow: 'auto',
          '& .tiptap': {
            outline: 'none',
            minHeight: 80,
            '& p': { my: 0.5 },
            '& h1': { fontSize: '1.5rem', fontWeight: 600, my: 1 },
            '& h2': { fontSize: '1.25rem', fontWeight: 600, my: 0.75 },
            '& h3': { fontSize: '1.1rem', fontWeight: 600, my: 0.75 },
            '& ul, & ol': { pl: 3, my: 0.5 },
            '& blockquote': {
              borderLeft: '3px solid',
              borderColor: 'divider',
              pl: 2,
              ml: 0,
              color: 'text.secondary',
            },
            '& code': {
              bgcolor: 'grey.100',
              borderRadius: 0.5,
              px: 0.5,
              fontFamily: 'monospace',
              fontSize: '0.875em',
            },
            '& pre': {
              bgcolor: 'grey.900',
              color: 'grey.100',
              borderRadius: 1,
              p: 2,
              my: 1,
              overflowX: 'auto',
              '& code': { bgcolor: 'transparent', color: 'inherit', p: 0 },
            },
            '& p.is-editor-empty:first-of-type::before': {
              content: 'attr(data-placeholder)',
              color: 'text.disabled',
              fontStyle: 'italic',
              float: 'left',
              height: 0,
              pointerEvents: 'none',
            },
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}

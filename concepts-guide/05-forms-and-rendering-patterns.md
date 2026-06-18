# 05 — Forms, Rendering Patterns, and MUI Integration

## Controlled vs Uncontrolled inputs

HTML inputs manage their own value by default (uncontrolled). React prefers **controlled inputs** — React state is the single source of truth for the value, and the input reflects that state.

```jsx
// Uncontrolled — DOM owns the value:
<input type="text" defaultValue="hello" />

// Controlled — React state owns the value:
const [title, setTitle] = useState('');
<input value={title} onChange={(e) => setTitle(e.target.value)} />
```

In `TopicDetailPanel`, the title field is controlled:

```jsx
const [title, setTitle] = useState(topic.title);

<TextField
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  label="Topic Title"
/>
```

Every keystroke calls `setTitle`, which updates state, which re-renders the component, which updates `value`. The input always shows exactly what's in state.

---

## React Hook Form

For forms with validation, managing a `useState` per field gets verbose. React Hook Form (RHF) manages all field state internally and only re-renders what changes.

The key integration with MUI is the `Controller` component, which bridges RHF's uncontrolled internals with MUI's controlled inputs:

```jsx
import { useForm, Controller } from 'react-hook-form';

function SubjectForm({ onSubmit }) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: '' }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="name"
        control={control}
        rules={{ required: 'Name is required', maxLength: { value: 100, message: 'Too long' } }}
        render={({ field }) => (
          <TextField
            {...field}           // value, onChange, onBlur, ref — all wired automatically
            label="Subject Name"
            error={!!errors.name}
            helperText={errors.name?.message}
            fullWidth
          />
        )}
      />
      <Button type="submit" variant="contained">Save</Button>
    </form>
  );
}
```

### What `useForm` returns

- `control` — the RHF controller object, passed to every `Controller`.
- `handleSubmit(fn)` — wraps your submit handler. Runs validation first; calls `fn(data)` only if everything passes.
- `formState.errors` — object where each key is a field name and the value is the validation error (if any).

### What `Controller` does

It renders whatever you put in `render`, and passes a `field` object containing `value`, `onChange`, `onBlur`, and `ref`. Spreading `{...field}` onto the MUI `TextField` wires all of these up automatically.

### Server-side errors

After a successful validation but failed API call, surface the server error with an MUI `Alert` above the form — never swallow it silently:

```jsx
{serverError && <Alert severity="error">{serverError}</Alert>}
```

---

## Conditional rendering

React renders nothing for `null`, `undefined`, and `false`. This makes conditional rendering clean:

```jsx
// Short-circuit: renders Alert only when error is truthy
{error && <Alert severity="error">{error}</Alert>}

// Ternary: renders one thing or another
{isLoading ? <CircularProgress /> : <TopicList topics={topics} />}

// Early return: exits the whole component for loading/error states
if (isLoading) return <CircularProgress />;
if (isError) return <Alert>Error</Alert>;
// Rest of the component only runs after data is ready
```

`TopicsPage` uses early returns for loading and error, then renders the main content:

```jsx
if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>;
if (isError) return <Box sx={{ p: 3 }}><Alert severity="error">Failed to load topics.</Alert></Box>;

return ( /* normal render with data */ );
```

---

## Rendering lists

```jsx
{filteredTopics.map((topic) => (
  <TopicCard key={topic.id} topic={topic} onOpen={setSelectedTopic} />
))}
```

**The `key` prop** is required whenever you render a list. React uses it to track which list item is which between renders. Without it, React can't tell if an item was added, removed, or reordered — it just re-renders everything. Use a stable, unique ID from your data (never the array index, which changes when items are removed).

---

## MUI's `sx` prop

MUI components accept an `sx` prop for inline styles. It is not plain CSS — it's a superset that understands MUI's theme tokens and shorthand properties.

```jsx
<Box sx={{
  display: 'flex',
  gap: 2,           // theme.spacing(2) = 16px
  p: 3,             // theme.spacing(3) = 24px = padding on all sides
  mb: 2,            // marginBottom = theme.spacing(2)
  bgcolor: 'grey.50', // theme.palette.grey[50]
  color: 'error.main', // theme.palette.error.main
}}>
```

Spacing shorthand: `p`, `m`, `pt`, `pb`, `pl`, `pr`, `mt`, `mb`, `ml`, `mr`, `px` (horizontal), `py` (vertical), `mx`, `my`.

Breakpoint values: any `sx` value can be an object with breakpoint keys:

```jsx
sx={{ width: { xs: '100%', sm: '50%', md: '33%' } }}
// xs = all sizes, sm = ≥600px, md = ≥900px
```

This is what powers the responsive `left` value in the Dialog — `xs` gets a small viewport offset, `sm` gets the nav-aware offset.

---

## Fragment and the Provider nesting pattern

```jsx
// Two siblings with no wrapper element needed:
return (
  <>
    <Box>...</Box>
    <Dialog>...</Dialog>
  </>
);
```

`<>...</>` is a React Fragment — a wrapper that React uses during rendering but doesn't produce a DOM element. Used in `TopicsPage` so the topic grid and the Dialog can coexist as siblings without adding a real `<div>` to the DOM.

---

## How the render cycle connects everything

Taking `TopicsPage` as the full example:

1. **Mount** — React calls `TopicsPage()`. `useState` initializes `selectedTopic = null`. `useTopics()` fires the query. React renders the loading spinner.

2. **Query resolves** — React Query stores topics in its cache, marks the query as successful, and triggers a re-render. `TopicsPage()` runs again. `isLoading` is now `false`. `topics` has data. React renders the topic cards.

3. **User clicks a card** — `onOpen(topic)` calls `setSelectedTopic(topic)`. React schedules a re-render.

4. **Re-render** — `TopicsPage()` runs again. `selectedTopic` is now a topic object. The Dialog has `open={true}`. React renders the Dialog with `TopicDetailPanel` inside it.

5. **User clicks Save** — `update.mutateAsync(payload)` runs. On success, React Query invalidates `['topics']` and refetches. `onClose()` calls `setSelectedTopic(null)`. React re-renders: Dialog closes, topic list reflects any changes.

Every re-render is just React calling the component function again with new state. The component returns new JSX. React diffs the new JSX against the previous output (the "virtual DOM") and applies only the changed parts to the real DOM.

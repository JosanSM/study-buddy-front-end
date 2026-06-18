# 02 — State and Hooks

## What is State?

State is data that belongs to a component and, when it changes, causes the component to re-render with the new value. It is the React equivalent of a mutable instance field — except React controls when and how re-renders happen.

**Spring analogy:** Imagine a `@RequestScoped` bean whose fields you can update. Every time you update a field, Spring magically re-renders the entire view for that bean. That's roughly what state does in React.

---

## useState

The most fundamental hook. It gives you a state variable and a setter function.

```jsx
const [selectedTopic, setSelectedTopic] = useState(null);
//     ^value          ^setter             ^initial value
```

**Rules:**
1. The setter replaces the value — it does not merge like `setState` in class components.
2. Calling the setter triggers a re-render of this component (and its children).
3. The value is frozen for the current render — reading `selectedTopic` mid-render always gives you the value at render time.

### In this project — TopicsPage

```jsx
const [selectedSubjectId, setSelectedSubjectId] = useState('');
const [selectedTopic, setSelectedTopic] = useState(null);
```

- `selectedSubjectId` drives the subject filter dropdown. When the user picks a subject, `setSelectedSubjectId` runs, the component re-renders, `filteredTopics` is recalculated, and the new card list appears.
- `selectedTopic` controls whether the Dialog is open. `null` = closed. A topic object = open, and that object is passed as props to `TopicDetailPanel`.

### In this project — TopicDetailPanel

```jsx
const [title, setTitle] = useState(topic.title);
const [status, setStatus] = useState(topic.topicStatus);
const [menuAnchor, setMenuAnchor] = useState(null);
const [error, setError] = useState(null);
```

Each state variable has a single job:
- `title` / `status` — controlled inputs (the input's value IS the state).
- `menuAnchor` — position of the "⋯" dropdown menu (null = closed).
- `error` — server error message to show in the Alert.

### Lazy initializer

`useState` accepts a function instead of a value when the initial value is expensive to compute:

```jsx
// This runs localStorage.getItem on every render — wasteful:
const [token, setToken] = useState(localStorage.getItem('accessToken'));

// This only runs the function once, on mount — correct:
const [token, setToken] = useState(() => localStorage.getItem('accessToken'));
```

Used in `AuthContext.jsx` exactly this way.

---

## What is a Hook?

A hook is any function whose name starts with `use`. React gives you built-in hooks (`useState`, `useRef`, `useCallback`, `useContext`, `useEffect`). You can also compose them into custom hooks.

**Three rules that cannot be broken:**
1. Only call hooks at the **top level** of a component or custom hook — never inside `if`, `for`, or a nested function.
2. Only call hooks from **React functions** — never from a plain utility function or class.
3. (Convention) Hook names start with `use`.

These rules exist because React tracks hook calls by order. If you call hooks conditionally, the order changes between renders and React loses track of which state belongs to which hook.

---

## useRef

`useRef` gives you a mutable container whose `.current` property you can change without triggering a re-render. Two main uses:

**1. DOM references** — point directly at a DOM node:

```jsx
const containerRef = useRef(null);

// Attach to a DOM element:
<Box ref={containerRef}>...</Box>

// Later, access the real DOM node:
containerRef.current  // → the actual <div> element
```

In `TopicDetailPanel`, `containerRef` is passed to TipTap's `BubbleMenu` so the floating formatting toolbar knows which DOM element to position itself relative to.

**2. Stable mutable values** — store something that should survive re-renders but shouldn't trigger them (timers, previous values, etc.). Not used that way in this project currently.

---

## useCallback

`useCallback` memoizes a function — it gives you back the **same function reference** between renders unless its dependencies change.

```jsx
const login = useCallback((accessToken) => {
  localStorage.setItem('accessToken', accessToken);
  setToken(accessToken);
}, []); // [] = no dependencies, function never changes
```

**Why does this matter?** In JavaScript, `() => {}` creates a new function object on every call. If `login` was created with a plain arrow function inside `AuthProvider`, every render would produce a new `login` reference. Any child that receives `login` as a prop would see it as "changed" and potentially re-render unnecessarily.

With `useCallback(fn, [deps])`, React returns the same function object until one of the `deps` changes. The `[]` dependency array means "this function never needs to change."

**In this project:** `AuthContext.jsx` wraps `login` and `logout` in `useCallback` so they are stable references when passed to every component via context.

---

## Custom Hooks

A custom hook is just a function that calls other hooks. It is the primary reuse mechanism in React — the equivalent of a service class.

```jsx
// src/hooks/useAuth.js
export function useAuth() {
  return useContext(AuthContext);
}
```

This is the simplest possible custom hook — it wraps `useContext` so components never need to import `AuthContext` directly. They just call `useAuth()`.

```jsx
// src/features/topics/hooks/useTopics.js
export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: getTopics,
  });
}
```

This wraps React Query's `useQuery`. Any component that needs the topic list calls `useTopics()`. If you later add caching config, filtering, or error transformation, you change it in one place.

**Spring analogy:** A custom hook is like a `@Service` class. Components (controllers) call the service; the service owns the logic. Components don't call the repository (API) directly.

---

## useEffect — and why this project avoids it for data fetching

`useEffect(fn, deps)` runs a side effect after the component renders. The most common (and most misused) pattern is fetching data:

```jsx
// DON'T do this — this is what React Query replaces:
useEffect(() => {
  fetch('/topic/')
    .then(res => res.json())
    .then(data => setTopics(data));
}, []);
```

Problems with this pattern:
- No loading state management.
- No error handling.
- No caching — re-fetches on every mount.
- Race conditions if the component unmounts before the fetch completes.
- No refetch-on-focus or stale data handling.

React Query solves all of this. **In this project, `useEffect` is never used for data fetching.** The rule in `CLAUDE.md` is explicit: use a React Query `useQuery` hook instead.

`useEffect` is still valid for non-data side effects — syncing with browser APIs, subscribing to events, starting timers. TipTap's `useEditor` hook uses it internally for this purpose.

---

## How hooks connect in TopicDetailPanel

```jsx
export default function TopicDetailPanel({ topic, subjects, onClose }) {
  // 1. DOM ref — passed to RichTextEditor for BubbleMenu positioning
  const containerRef = useRef(null);

  // 2. Local UI state — controlled form inputs
  const [title, setTitle]         = useState(topic.title);
  const [status, setStatus]       = useState(topic.topicStatus);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [error, setError]         = useState(null);

  // 3. Custom hook — wraps React Query mutations (see 04-react-query.md)
  const { update, remove } = useTopicMutations();

  // 4. TipTap's own hook — sets up the rich text editor instance
  const editor = useEditor({ ... });

  // Everything above runs in order, every render.
}
```

Notice that none of these are inside `if` blocks — they're all at the top level, always called in the same order.

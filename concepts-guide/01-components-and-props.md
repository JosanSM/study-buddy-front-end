# 01 — Components and Props

## What is a Component?

A React component is a JavaScript function that returns UI. That's it. React calls this function whenever it needs to render or re-render that piece of the screen.

```jsx
export default function TopicCard({ topic, onOpen }) {
  return (
    <Card>
      <Typography>{topic.title}</Typography>
    </Card>
  );
}
```

**Spring analogy:** Think of a component like a Thymeleaf fragment or a `@ViewComponent` — except it also owns its own logic (state, event handling). It's not purely a template; it's the template + the controller bundled together for one slice of the UI.

---

## JSX

The HTML-like syntax inside `return (...)` is JSX. It is **not** HTML — it's syntactic sugar that Vite compiles into `React.createElement(...)` calls. The differences that trip people up:

| HTML | JSX |
|---|---|
| `class="foo"` | `className="foo"` |
| `for="input"` | `htmlFor="input"` |
| `onclick="fn()"` | `onClick={fn}` (camelCase, no quotes) |
| Self-closing optional | Self-closing required: `<br />` |

Curly braces `{}` let you embed any JavaScript expression:

```jsx
<Typography>{topic.title}</Typography>           // variable
<Chip label={topic.topicStatus.toLowerCase()} /> // expression
{isError && <Alert>Failed</Alert>}               // conditional render
{topics.map(t => <TopicCard key={t.id} topic={t} />)} // list
```

---

## Props

Props are the inputs to a component — equivalent to method parameters or constructor injection. The parent decides what to pass; the child just receives them.

```jsx
// Parent passes props:
<TopicCard topic={topic} onOpen={setSelectedTopic} />

// Child receives them as one object (destructured):
export default function TopicCard({ topic, onOpen }) {
  // topic  → the topic data object
  // onOpen → a function the parent gave us to call
}
```

**Key rules:**
- Props flow **down only** — parent to child, never the reverse.
- A child that needs to tell the parent something passes a **callback function** as a prop and calls it. `onOpen` in `TopicCard` is this pattern — the child calls `onOpen(topic)` when the arrow button is clicked, and the parent's `setSelectedTopic` runs.
- Props are **read-only** inside the child. Never mutate them.

### Children prop

MUI uses this heavily. When you write:

```jsx
<Card>
  <CardContent>...</CardContent>
</Card>
```

Everything between the `<Card>` tags is passed as `props.children`. MUI's `Card` renders them inside a styled box. You'll use this implicitly through MUI but rarely write `props.children` yourself.

---

## Component tree and data flow

The app's component tree at startup looks like this:

```
main.jsx
└── QueryClientProvider      ← React Query context
    └── ThemeProvider        ← MUI theme context
        └── App
            └── BrowserRouter
                └── AuthProvider    ← Auth context
                    └── AppRouter
                        └── ProtectedRoute
                            └── AppLayout
                                ├── SideNav
                                └── TopicsPage          ← fetches data
                                    ├── TopicCard       ← receives data via props
                                    ├── TopicCard
                                    └── Dialog
                                        └── TopicDetailPanel  ← receives topic via props
```

Data flows **down** through props. Events (user actions) bubble **up** through callback props. This one-directional flow is the core of React's mental model.

---

## Smart vs Presentational components

This project follows a deliberate split:

**Smart components** (pages) — fetch data, hold state, pass things down:
- `TopicsPage` calls `useTopics()`, holds `selectedTopic` state, passes topics to cards.

**Presentational components** (cards, chips) — receive everything via props, emit events via callbacks:
- `TopicCard` receives `topic` and `onOpen`, renders them, calls `onOpen(topic)` when clicked.
- It has no idea where `topic` came from or what `onOpen` will do.

This split makes presentational components trivially testable and reusable — they're pure functions of their props.

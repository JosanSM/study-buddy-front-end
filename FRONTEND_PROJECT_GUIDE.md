# Study Buddy — Frontend Project Guide

> **Who this is for:** A developer who knows how to code but is new to React and wants to deeply understand how this specific project works — not just what it does, but *why* it is structured this way and how every piece connects.
>
> **How to read this:** Don't skim. Follow the recommended reading order in Section 12 first, then return to whichever section answers your current question.

---

## Table of Contents

1. [High-Level Architecture Overview](#1-high-level-architecture-overview)
2. [Folder Structure Breakdown](#2-folder-structure-breakdown)
3. [File Dependency Map](#3-file-dependency-map)
4. [React Concepts Used In This Project](#4-react-concepts-used-in-this-project)
5. [Backend API Integration Deep Dive](#5-backend-api-integration-deep-dive)
6. [Authentication and Authorization](#6-authentication-and-authorization)
7. [Routing Walkthrough](#7-routing-walkthrough)
8. [State Management](#8-state-management)
9. [End-to-End Feature Walkthroughs](#9-end-to-end-feature-walkthroughs)
10. [How To Add a New Backend Endpoint](#10-how-to-add-a-new-backend-endpoint)
11. [Common Development Patterns](#11-common-development-patterns)
12. [New Developer Survival Guide](#12-new-developer-survival-guide)

---

## 1. High-Level Architecture Overview

### What Kind of Application Is This?

This is a **Single Page Application (SPA)**. Unlike a traditional website where the browser loads a new HTML page every time you click a link, an SPA loads one HTML file (`index.html`) once and then JavaScript takes over — swapping UI sections in and out without full page reloads. React is the library that manages this.

The frontend is completely separated from the backend. They communicate exclusively through HTTP API calls (REST). The backend is a Spring Boot application; the frontend doesn't know or care about its internal workings — it just sends HTTP requests and reads the JSON responses.

### The Three Major Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                               │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  REACT APPLICATION                     │  │
│  │                                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │   Providers   │  │    Router    │  │   Theme    │  │  │
│  │  │  (Auth, Query)│  │  (Pages)     │  │  (MUI)     │  │  │
│  │  └──────┬───────┘  └──────┬───────┘  └────────────┘  │  │
│  │         │                 │                           │  │
│  │  ┌──────▼─────────────────▼─────────────────────┐    │  │
│  │  │                  COMPONENTS                    │    │  │
│  │  │  Pages → Feature Components → Shared UI       │    │  │
│  │  └──────────────────┬────────────────────────────┘    │  │
│  │                     │                                 │  │
│  │  ┌──────────────────▼────────────────────────────┐    │  │
│  │  │               HOOKS LAYER                      │    │  │
│  │  │  useTopics / useSubjects / useTopicMutations   │    │  │
│  │  └──────────────────┬────────────────────────────┘    │  │
│  │                     │                                 │  │
│  │  ┌──────────────────▼────────────────────────────┐    │  │
│  │  │               API SERVICE LAYER                │    │  │
│  │  │  topicService / subjectService / authService   │    │  │
│  │  └──────────────────┬────────────────────────────┘    │  │
│  │                     │                                 │  │
│  │  ┌──────────────────▼────────────────────────────┐    │  │
│  │  │              AXIOS HTTP CLIENT                 │    │  │
│  │  │  src/api/client.js — adds auth headers,        │    │  │
│  │  │  handles 401 globally                          │    │  │
│  │  └──────────────────┬────────────────────────────┘    │  │
│  └─────────────────────┼──────────────────────────────── ┘  │
│                        │ HTTP                               │
└────────────────────────┼─────────────────────────────────── ┘
                         │
             ┌───────────▼────────────┐
             │   SPRING BOOT BACKEND  │
             │   localhost:8080       │
             └────────────────────────┘
```

### Data Flow: Complete Picture

Here is the full journey of data from a user action to a screen update. Each step is explained in the sections below.

```
USER ACTION (e.g., clicks "Save" on a topic)
  │
  ▼
COMPONENT EVENT HANDLER
  handleSave() in TopicDetailPanel.jsx
  │
  ▼
REACT QUERY MUTATION
  update.mutateAsync(payload) from useTopicMutations.js
  │
  ▼
API SERVICE FUNCTION
  updateTopic(data) in src/api/topicService.js
  │
  ▼
AXIOS CLIENT (src/api/client.js)
  Automatically attaches: Authorization: Bearer <token>
  │
  ▼
HTTP REQUEST
  PUT http://localhost:8080/topic/
  Body: { id, title, notes, topicStatus, userId, subjectId }
  │
  ▼
SPRING BOOT BACKEND
  Processes, returns updated topic as JSON
  │
  ▼
AXIOS RESPONSE INTERCEPTOR
  Passes response through (or handles 401 by redirecting to /login)
  │
  ▼
REACT QUERY onSuccess HANDLER
  queryClient.invalidateQueries({ queryKey: ['topics'] })
  This marks the topics list as stale and triggers a background re-fetch
  │
  ▼
REACT QUERY RE-FETCH
  useTopics() re-calls getTopics() automatically
  │
  ▼
STATE UPDATE
  React Query updates its internal cache with fresh data
  │
  ▼
UI RE-RENDER
  All components using useTopics() automatically re-render with new data
  TopicsPage shows the updated topic card
```

### Architectural Patterns

**Feature-based organization:** Code is grouped by domain (topics, auth) rather than by technical role. This is the same as Spring's package-by-feature. When you work on the topics feature, everything you need is in `src/features/topics/`.

**Layered architecture:** There is a strict dependency direction: Components → Hooks → Services → HTTP Client. A component should never talk to Axios directly; an API service should never know about React state.

**Separation of reading and writing:** Data fetching (queries) and data modification (mutations) are handled differently. `useTopics.js` is for reading; `useTopicMutations.js` is for writing. They both use React Query but serve different purposes.

---

## 2. Folder Structure Breakdown

```
studdy-buddy-ui/
├── public/                     ← Static assets served as-is
├── src/
│   ├── api/                    ← HTTP service layer
│   ├── components/             ← Shared, reusable UI
│   │   ├── feedback/           ← Generic feedback UI (empty states, errors)
│   │   ├── layout/             ← Page wrappers / structural shells
│   │   └── navigation/         ← Nav components
│   ├── context/                ← React Context providers
│   ├── features/               ← Domain code, organized by feature
│   │   ├── auth/               ← Login, registration
│   │   ├── subjects/           ← Subject data hooks
│   │   └── topics/             ← Topics UI, hooks, and components
│   ├── hooks/                  ← Cross-feature custom hooks
│   ├── router/                 ← Route definitions and auth guard
│   ├── theme/                  ← MUI design tokens
│   ├── utils/                  ← Pure utility functions
│   ├── App.jsx                 ← Root component: wires providers + router
│   ├── main.jsx                ← Entry point: mounts React to the DOM
│   └── index.css               ← Body/reset styles only
├── index.html                  ← Single HTML file (the "S" in SPA)
├── vite.config.js              ← Build tool configuration
├── package.json                ← Dependencies and scripts
└── .env                        ← Environment variables (not committed)
```

---

### `src/api/` — The HTTP Service Layer

**What is it?**
This folder is the only place in the entire codebase that is allowed to make HTTP calls. Every function here takes plain JavaScript data, sends an HTTP request to the backend, and returns the response data.

**Why does it exist?**
Without this layer, API calls would be scattered across components, impossible to find, impossible to test, and hard to update when the backend changes an endpoint. By centralizing all HTTP calls here, you have one place to go when something about the backend changes.

Think of this as your DAO (Data Access Object) layer if you're coming from Spring. Just as a Spring `@Repository` class abstracts database queries, these service files abstract HTTP calls.

**What goes inside it?**
- `client.js` — The configured Axios instance. This is the only file that imports from `axios` directly.
- `authService.js` — Functions for `/auth/login` and `/auth/register`.
- `topicService.js` — Functions for all `/topic/` endpoints.
- `subjectService.js` — Functions for all `/subject/` endpoints.

**What should NOT go inside it?**
- React hooks (no `useState`, `useEffect`, etc.)
- Component code
- State management logic

**Who depends on it?**
- `src/features/*/hooks/` — React Query hooks call these service functions.
- `src/features/auth/components/LoginForm.jsx` — Calls `authService.login()` directly (since auth is a special case that doesn't use React Query for mutations).

---

### `src/components/` — Shared UI Components

**What is it?**
Generic, reusable UI building blocks that are not tied to any specific feature. These components have no knowledge of the domain (topics, subjects, auth); they just render UI based on props.

**Why does it exist?**
If `EmptyState` were defined inside `features/topics/`, it couldn't be used by `features/subjects/` without copying the code. Any component used by two or more features graduates to this folder.

**What goes inside it?**
- `layout/` — Structural wrappers that define page-level layouts.
- `feedback/` — UI for non-happy-path states: empty results, errors.
- `navigation/` — The side navigation bar.

**What should NOT go inside it?**
- Domain-specific components. `TopicCard` belongs in `features/topics/`, not here, because it only makes sense in the context of topics.
- Components that are only used by one feature.

**Who depends on it?**
- `src/router/index.jsx` — Imports `AppLayout` and `AuthLayout`.
- `src/features/topics/pages/TopicsPage.jsx` — Imports `EmptyState` and `NAV_WIDTH` from `SideNav`.

---

### `src/context/` — Global State Providers

**What is it?**
React Context is a way to share data across many components without passing it down as props through every intermediate component. Think of it as a global variable, but one that React manages safely and that causes components to re-render when it changes.

**Why does it exist?**
Authentication state (`token`, `isAuthenticated`, `login`, `logout`) needs to be accessible by:
- `ProtectedRoute` (to check if you're logged in)
- `LoginForm` (to call `login()` after a successful API call)
- `client.js` (to read the token for every request)

If this state lived in a component, passing it down to all of these places would require threading props through many unrelated components (called "prop drilling"). Context solves this cleanly.

**What goes inside it?**
Only global state that is needed by fundamentally different, unrelated parts of the application. Right now: auth only.

**What should NOT go inside it?**
- Server data (topics list, subjects list) — React Query owns that.
- UI state (modal open/closed, filter selection) — `useState` in the component owns that.

---

### `src/features/` — Domain-Specific Code

**What is it?**
Each subfolder here represents one domain area of the application. A "feature" is self-contained: it owns its pages, components, and hooks. Features do not import from each other.

**Why does it exist?**
This is the core architectural decision of the project. It mirrors Spring's package-by-feature pattern. When you work on topics, you stay inside `features/topics/`. You never need to hunt through a flat `components/` folder of hundreds of mixed files.

**What goes inside a feature folder?**
```
features/topics/
├── components/    ← UI specific to topics (TopicCard, TopicDetailPanel, etc.)
├── hooks/         ← React Query hooks for topics data (useTopics, useTopicMutations)
└── pages/         ← Route target components (TopicsPage)
```

**What should NOT go inside a feature?**
- Imports from another feature (`features/topics/` must not import from `features/auth/`)
- Generic UI that other features could use — that goes in `src/components/`

---

### `src/hooks/` — Cross-Feature Hooks

**What is it?**
Custom React hooks that are needed by multiple features or by infrastructure code (like the router).

**Why does it exist?**
`useAuth.js` is a simple wrapper around `useContext(AuthContext)`. It needs to be importable by both `LoginForm` (a feature component) and `ProtectedRoute` (a router component). Since it's not specific to any feature, it lives here.

**Rule:** Feature-specific hooks (like `useTopics`) live inside their feature folder. Only hooks needed in two or more unrelated places live here.

---

### `src/router/` — Route Definitions

**What is it?**
The central place where URL paths are mapped to page components. It also contains the authentication guard (`ProtectedRoute`) that blocks access to protected pages.

**Why does it exist?**
Keeping all route definitions in one place makes it easy to answer "what pages does this app have?" at a glance.

---

### `src/theme/` — Visual Design Tokens

**What is it?**
The MUI (Material UI) theme configuration. This is where the color palette, typography, and spacing scale are defined for the entire application.

**Why does it exist?**
Rather than hardcoding `color: '#1976d2'` in dozens of components, you define it once here and MUI applies it automatically. Changing the primary color means changing one line in `theme.js`.

---

### `src/utils/` — Pure Utility Functions

**What is it?**
Small, pure functions that have no React dependencies and solve a specific problem across the codebase.

**Why does it exist?**
`getErrorMessage()` is used by `LoginForm`, `TopicDetailPanel`, and any future component that handles API errors. Defining it once here prevents code duplication.

---

## 3. File Dependency Map

This section answers, for every important file: "Who calls it? What does it call? What does it do?"

---

### `src/main.jsx`

**File Purpose**
The entry point of the entire application. This is the first JavaScript file the browser executes. It mounts the React application onto the `<div id="root">` in `index.html`, and wraps it in global providers.

**Who Calls It**
Nobody — this is the root. Vite's build system knows to start here because `index.html` has `<script type="module" src="/src/main.jsx">`.

**What It Calls**
- `App.jsx` — The root React component
- `src/theme/theme.js` — The MUI theme object
- `@tanstack/react-query` — Creates the `QueryClient` with default options

**Annotation of actual code:**
```jsx
// src/main.jsx

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,  // Data stays "fresh" for 60 seconds before React Query
                           // considers re-fetching it. 60_000 = 60,000 milliseconds.
      retry: 1,           // If a request fails, try once more before giving up.
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>                              // Activates extra warnings in development
    <QueryClientProvider client={queryClient}>  // Makes React Query available to all children
      <ThemeProvider theme={theme}>         // Makes MUI theme available to all children
        <CssBaseline />                     // Resets default browser CSS for consistency
        <App />                             // The root component of your app
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
```

**Why is the wrapping order important?**
The `QueryClientProvider` must wrap everything because React Query hooks are used deep inside component trees. The `ThemeProvider` must wrap everything because MUI components read the theme via React Context internally. Both providers use the Context pattern — they inject values that their child components can access.

---

### `src/App.jsx`

**File Purpose**
Sets up the two remaining global providers — routing and authentication — and renders the router.

**Who Calls It**
`src/main.jsx`

**What It Calls**
- `react-router-dom` — `BrowserRouter` enables URL-based navigation
- `src/context/AuthContext.jsx` — `AuthProvider` makes auth state available globally
- `src/router/index.jsx` — `AppRouter` defines which component renders at each URL

```jsx
export default function App() {
  return (
    <BrowserRouter>        // Must wrap AuthProvider and AppRouter since they use
                           // useNavigate/useLocation which require router context
      <AuthProvider>       // Makes { token, isAuthenticated, login, logout } available
                           // to any component in the tree
        <AppRouter />      // Renders the correct page component for the current URL
      </AuthProvider>
    </BrowserRouter>
  );
}
```

**Why is `BrowserRouter` here and not in `main.jsx`?**
Both `AuthProvider` and `AppRouter` use React Router hooks internally. Those hooks only work inside a `BrowserRouter`. Putting `BrowserRouter` in `App.jsx` keeps it close to the code that needs it.

---

### `src/context/AuthContext.jsx`

**File Purpose**
Defines and exports the global authentication state. It stores the JWT token, derives `isAuthenticated` from it, and exposes `login()` and `logout()` functions.

**Who Calls It**
- `src/App.jsx` — Imports `AuthProvider` to wrap the whole app
- `src/hooks/useAuth.js` — Imports `AuthContext` to expose it via a hook
- `src/api/client.js` — Reads the token from `localStorage` directly (doesn't import from here)

**What It Calls**
- React's `createContext`, `useState`, `useCallback`
- `localStorage` — for persisting the token across browser refreshes

**Detailed walkthrough:**
```jsx
// The initial token is read from localStorage so the user stays
// logged in across browser refreshes. If localStorage has 'accessToken',
// the user is immediately considered authenticated.
const [token, setToken] = useState(() => localStorage.getItem('accessToken'));

// login() is called by LoginForm after a successful API response.
// It both updates localStorage (for persistence) and the React state
// (so components immediately re-render with the new auth status).
const login = useCallback((accessToken) => {
  localStorage.setItem('accessToken', accessToken);
  setToken(accessToken);
}, []);

// !!token converts the token string to a boolean.
// If token is null → !!null → false (not authenticated)
// If token is "eyJ..." → !!"eyJ..." → true (authenticated)
<AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
```

---

### `src/hooks/useAuth.js`

**File Purpose**
A thin wrapper that makes consuming `AuthContext` cleaner. Instead of importing both `useContext` and `AuthContext` in every component, you just import `useAuth`.

**Who Calls It**
- `src/router/ProtectedRoute.jsx`
- `src/features/auth/components/LoginForm.jsx`

**What It Calls**
- React's `useContext`
- `src/context/AuthContext.jsx`

```js
// Without this hook, every consumer would need to write:
//   import { useContext } from 'react';
//   import { AuthContext } from '../../../context/AuthContext';
//   const auth = useContext(AuthContext);

// With this hook, they just write:
//   import { useAuth } from '../../../hooks/useAuth';
//   const { isAuthenticated, login, logout } = useAuth();

export function useAuth() {
  return useContext(AuthContext);
}
```

---

### `src/api/client.js`

**File Purpose**
Creates and exports the configured Axios HTTP client. This is the single HTTP client used by the entire application. It has two interceptors that automatically handle cross-cutting concerns.

**Who Calls It**
- `src/api/authService.js`
- `src/api/topicService.js`
- `src/api/subjectService.js`

**What It Calls**
- `axios` library
- `localStorage` — to read the auth token
- `window.location` — to perform hard navigation on 401

**Detailed walkthrough of the two interceptors:**
```js
// INTERCEPTOR 1: Request Interceptor
// Runs before EVERY outgoing request.
// Purpose: Attach the auth token so the backend knows who you are.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;   // Must return config or the request won't proceed
});

// INTERCEPTOR 2: Response Interceptor
// Runs after EVERY incoming response.
// Purpose: Handle session expiry globally — you don't want every
// component to check for 401 individually.
apiClient.interceptors.response.use(
  (response) => response,   // Happy path: just pass the response through
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    // Special case: /auth/login returns 401 for wrong credentials.
    // That's expected — we DON'T want to redirect to login from the login page.
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';  // Hard redirect — clears all React state
    }
    return Promise.reject(error);  // Let the calling code handle other errors
  }
);
```

---

### `src/api/topicService.js`

**File Purpose**
Defines all HTTP operations for the `/topic/` resource. Every function here is a thin wrapper over the Axios client that returns plain JavaScript data (not Axios response objects).

**Who Calls It**
- `src/features/topics/hooks/useTopics.js` — calls `getTopics`
- `src/features/topics/hooks/useTopicMutations.js` — calls `updateTopic`, `deleteTopic`

**What It Calls**
- `src/api/client.js`

```js
// The .then((res) => res.data) pattern is important:
// Axios wraps responses in an object: { data: ..., status: ..., headers: ... }
// By calling .then((res) => res.data), we strip the Axios wrapper and
// return just the JSON payload from the backend.
export const getTopics = () =>
  apiClient.get('/topic/').then((res) => res.data);
//            ^ trailing slash is intentional to match backend routing

// Returns topics whose nextReviewAt is today or in the past (overdue/due today).
export const getDueTopics = () =>
  apiClient.get('/topic/due').then((res) => res.data);

// Marks a topic as reviewed. Increments reviewCount and recalculates nextReviewAt.
// No request body. Returns the full updated topic object.
export const reviewTopic = (id) =>
  apiClient.post(`/topic/${id}/review`).then((res) => res.data);
```

Every topic object returned by the API now includes three spaced-repetition fields:
- `reviewCount` — integer; starts at 0
- `lastReviewedAt` — ISO date string `YYYY-MM-DD`, or `null` if never reviewed
- `nextReviewAt` — ISO date string `YYYY-MM-DD`, or `null` if never reviewed; used for calendar placement

---

### `src/features/topics/hooks/useTopics.js`

**File Purpose**
A React Query hook that fetches all topics and manages the loading/error/data states. Any component that needs the topics list calls this hook instead of fetching data itself.

**Who Calls It**
- `src/features/topics/pages/TopicsPage.jsx`

**What It Calls**
- `@tanstack/react-query` — `useQuery`
- `src/api/topicService.js` — `getTopics`

```js
export function useTopics() {
  return useQuery({
    queryKey: ['topics'],   // This is the cache key. React Query stores the result
                            // under this key. Any other component that calls
                            // useQuery with key ['topics'] gets the SAME cached data.
    queryFn: getTopics,     // The function to call to fetch fresh data.
  });
}
// The hook returns: { data, isLoading, isError, error, refetch, ... }
// The component destructures what it needs.
```

**What does React Query do with `queryKey: ['topics']`?**
Think of it as a cache key in Spring's `@Cacheable("topics")`. When you call `queryClient.invalidateQueries({ queryKey: ['topics'] })` after a mutation, React Query marks this cache entry as stale and immediately re-fetches, ensuring all components see the updated data.

---

### `src/features/topics/hooks/useTopicMutations.js`

**File Purpose**
A React Query hook that provides functions for modifying topics (update and delete). After each successful mutation, it invalidates the topics cache so the UI refreshes automatically.

**Who Calls It**
- `src/features/topics/components/TopicDetailPanel.jsx`

**What It Calls**
- `@tanstack/react-query` — `useMutation`, `useQueryClient`
- `src/api/topicService.js` — `updateTopic`, `deleteTopic`

```js
export function useTopicMutations() {
  const queryClient = useQueryClient();
  // useQueryClient() gives access to the QueryClient instance
  // so we can invalidate caches after mutations.

  const update = useMutation({
    mutationFn: updateTopic,   // The async function that does the actual work
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics'] }),
    // After a successful update, tell React Query the ['topics'] cache is stale.
    // React Query will immediately re-fetch in the background.
  });

  // update.mutateAsync(payload) — returns a Promise, can be awaited
  // update.isPending — true while the mutation is in flight
  // update.isError — true if it failed

  return { update, remove };
}
```

---

### `src/features/topics/pages/TopicsPage.jsx`

**File Purpose**
The page component for `/topics`. This is a "smart component" — it fetches data, manages local UI state (which topic is selected, which subject filter is active), and composes feature components into a complete page.

**Who Calls It**
- `src/router/index.jsx` — Loaded lazily when the user navigates to `/topics`

**What It Calls**
- `src/features/topics/hooks/useTopics.js`
- `src/features/subjects/hooks/useSubjects.js`
- `src/features/topics/components/TopicCard.jsx`
- `src/features/topics/components/TopicDetailPanel.jsx`
- `src/components/feedback/EmptyState.jsx`
- `src/components/navigation/SideNav.jsx` — imports the `NAV_WIDTH` constant

**Data flow inside this component:**
```
TopicsPage renders
  │
  ├── useTopics() ──→ React Query ──→ GET /topic/ ──→ returns topics array
  ├── useSubjects() ─→ React Query ──→ GET /subject/ ──→ returns subjects array
  │
  ├── Local state:
  │   selectedSubjectId (controls the subject filter dropdown)
  │   selectedTopic (controls which topic opens in the detail panel)
  │
  ├── Derived value:
  │   filteredTopics = topics filtered by selectedSubjectId
  │
  ├── Renders: subject filter dropdown, topic cards grid
  └── When user clicks a card: sets selectedTopic → opens Dialog containing TopicDetailPanel
```

**Why is `NAV_WIDTH` imported from `SideNav.jsx`?**
The detail panel dialog needs to be positioned just to the right of the sidebar. Rather than hardcoding `180px` in both files (which would cause a mismatch if the width changes), `SideNav.jsx` exports its width as a named constant. This is the project's approach to avoiding hardcoded layout values.

---

### `src/features/topics/components/TopicCard.jsx`

**File Purpose**
A "dumb" (presentational) component that renders a single topic card. It has no state and no data fetching — it receives everything it needs via props and emits events via callbacks.

**Who Calls It**
- `src/features/topics/pages/TopicsPage.jsx`

**What It Calls**
- `src/features/topics/components/TopicStatusChip.jsx`
- MUI components (`Card`, `Chip`, `IconButton`, etc.)

```jsx
// All data comes in via props — TopicCard has no useState or useQuery
export default function TopicCard({ topic, onOpen }) {
  return (
    <Card ...>
      <TopicStatusChip status={topic.topicStatus} />  // delegates status display
      <Typography>{topic.title}</Typography>
      <IconButton onClick={() => onOpen(topic)}>     // calls back to parent
        <ArrowForwardIcon />
      </IconButton>
    </Card>
  );
}
// When the arrow is clicked, onOpen(topic) is called.
// The PARENT (TopicsPage) decides what to do — it sets selectedTopic.
// TopicCard doesn't need to know that this opens a dialog.
```

---

### `src/features/topics/components/TopicDetailPanel.jsx`

**File Purpose**
A "smart" (container) component that renders the full topic editor panel. It manages its own local form state and calls mutations.

**Who Calls It**
- `src/features/topics/pages/TopicsPage.jsx` — renders it inside a Dialog

**What It Calls**
- `src/features/topics/hooks/useTopicMutations.js`
- `src/features/topics/components/RichTextEditor.jsx`
- `src/utils/errorUtils.js` — `getErrorMessage`
- `@tiptap/react` — `useEditor` for the rich text editor instance

**Local state it manages:**
```
title — the text in the "Topic Title" field
status — the selected value in the "Topic Status" dropdown
menuAnchor — position of the "..." options menu (null when closed)
error — error message string from a failed save/delete (null when clean)
```

---

### `src/features/topics/components/TopicStatusChip.jsx`

**File Purpose**
A pure presentational component that maps a topic status string to a colored chip. It encapsulates the mapping logic so it doesn't need to be repeated everywhere.

**Who Calls It**
- `src/features/topics/components/TopicCard.jsx`

**What It Calls**
- MUI `Chip` component only

```jsx
const STATUS_CONFIG = {
  NOT_STARTED: { label: 'Not Started', color: 'default' },
  IN_PROGRESS:  { label: 'In Progress', color: 'info'    },  // blue
  COMPLETED:    { label: 'Completed',   color: 'success'  },  // green
};

export default function TopicStatusChip({ status }) {
  // The ?? fallback handles invalid/unknown status values gracefully.
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.NOT_STARTED;
  return <Chip label={config.label} color={config.color} size="small" />;
}
```

---

### `src/features/auth/components/LoginForm.jsx`

**File Purpose**
The login form. A "smart" component that handles form state, validation, API calls, and navigation after successful login.

**Who Calls It**
- `src/features/auth/pages/LoginPage.jsx`

**What It Calls**
- `src/api/authService.js` — `authService.login()`
- `src/hooks/useAuth.js` — to call `login()` after receiving the token
- `react-hook-form` — for form state and validation
- `react-router-dom` — `useNavigate` for redirecting after login
- `src/utils/errorUtils.js` — `getErrorMessage`

---

### `src/components/navigation/SideNav.jsx`

**File Purpose**
The persistent left sidebar navigation. It renders navigation items, highlights the active route, and exports the `NAV_WIDTH` constant.

**Who Calls It**
- `src/components/layout/AppLayout.jsx`
- `src/features/topics/pages/TopicsPage.jsx` — imports `NAV_WIDTH` only

**What It Calls**
- `react-router-dom` — `useNavigate`, `useLocation`

```jsx
export const NAV_WIDTH = 180;  // Named export so other files can reference it
                                // without hardcoding the value

const NAV_ITEMS = [
  { label: 'home',       path: null      },  // null = disabled/not yet implemented
  { label: 'calendar',   path: null      },
  { label: 'topic list', path: '/topics' },
];
```

---

### `src/utils/errorUtils.js`

**File Purpose**
A single utility function that extracts a user-readable error message from any API error object.

**Who Calls It**
- `src/features/auth/components/LoginForm.jsx`
- `src/features/topics/components/TopicDetailPanel.jsx`

**What It Calls**
Nothing. It's a pure function.

```js
export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ??   // Check backend JSON error body first
    error?.message ??                   // Fall back to generic JavaScript Error message
    'An unexpected error occurred.'     // Last resort fallback
  );
}
// The ?. is "optional chaining" — like Java's Optional.
// If error is null, error?.response is undefined (not a crash).
// The ?? is "nullish coalescing" — like Java's Optional.orElse().
```

---

## 4. React Concepts Used In This Project

### Components

**What it is:** The basic building block of a React UI. A component is a JavaScript function that returns JSX (HTML-like syntax). React calls these functions to build the page.

**Why this project uses it:** Everything visible on screen is a component. `TopicCard`, `SideNav`, `LoginForm` — all components.

**Where used:** Every `.jsx` file in `src/`.

```jsx
// A component is just a function that returns JSX.
// JSX looks like HTML but is actually JavaScript.
export default function TopicStatusChip({ status }) {
  //                                     ^ Props: data passed in from the parent
  return <Chip label="In Progress" color="info" />;
  //     ^ JSX: React transforms this into DOM elements
}
```

---

### Props

**What it is:** Short for "properties." Data passed from a parent component down to a child component. In React, data flows one way: parent → child.

**Why this project uses it:** `TopicCard` receives `topic` and `onOpen` as props from `TopicsPage`. The card doesn't need to know where the topic came from or what happens when opened — it just renders what it receives.

**Where used:** Every component call in JSX.

```jsx
// In TopicsPage.jsx — PARENT passes data down:
<TopicCard key={topic.id} topic={topic} onOpen={setSelectedTopic} />
//                         ^ prop       ^ prop (a function passed as a prop)

// In TopicCard.jsx — CHILD receives it:
export default function TopicCard({ topic, onOpen }) {
  // topic and onOpen are now available as local variables
}
```

---

### State (`useState`)

**What it is:** Local data that a component "remembers" between renders. When state changes, React automatically re-renders the component.

**Why this project uses it:** For local UI state that doesn't need to be shared — which subject is selected in the filter, which topic is open in the panel, whether an error message is showing.

**Where used:**

| File | State Variable | Purpose |
|---|---|---|
| `TopicsPage.jsx` | `selectedSubjectId` | Current subject filter value |
| `TopicsPage.jsx` | `selectedTopic` | Which topic is open in the detail panel |
| `TopicDetailPanel.jsx` | `title` | Current value of the title text field |
| `TopicDetailPanel.jsx` | `status` | Current value of the status dropdown |
| `TopicDetailPanel.jsx` | `menuAnchor` | Position of the "..." options menu |
| `TopicDetailPanel.jsx` | `error` | Error message from a failed API call |
| `AuthContext.jsx` | `token` | The JWT token (global auth state) |
| `LoginForm.jsx` | `serverError` | Server error message to display |

```jsx
// useState returns [currentValue, setterFunction]
const [selectedTopic, setSelectedTopic] = useState(null);
//     ^ read this      ^ call this to update    ^ initial value

// When setSelectedTopic is called with a new value,
// React re-renders the component with the new value.
setSelectedTopic(topic);  // triggers a re-render where selectedTopic === topic
```

---

### `useCallback`

**What it is:** A hook that memoizes a function — it returns the same function instance between renders unless its dependencies change.

**Why this project uses it:** In `AuthContext.jsx`, `login` and `logout` are wrapped in `useCallback` with an empty dependency array (`[]`). This ensures these functions don't get recreated on every render, which would force all consumers of the context to re-render unnecessarily.

**Where used:** `src/context/AuthContext.jsx`

```jsx
const login = useCallback((accessToken) => {
  localStorage.setItem('accessToken', accessToken);
  setToken(accessToken);
}, []);  // Empty array: this function never needs to be recreated
```

---

### `useRef`

**What it is:** A hook that creates a mutable reference to a DOM element or a value that persists across renders but doesn't cause re-renders when changed.

**Why this project uses it:** In `TopicDetailPanel.jsx`, `useRef` creates a reference to the panel's container `div`. This reference is passed to `RichTextEditor` so the floating bubble menu can be anchored to the panel container rather than the page body. This prevents click-outside detection from misfiring.

**Where used:** `src/features/topics/components/TopicDetailPanel.jsx`

```jsx
const containerRef = useRef(null);
// ...
<Box ref={containerRef} ...>   // Attaches the ref to this DOM element
  <RichTextEditor containerRef={containerRef} />
</Box>
```

---

### `useContext`

**What it is:** A hook that lets a component read a value from a React Context without receiving it as a prop.

**Why this project uses it:** `useAuth()` is a thin wrapper over `useContext(AuthContext)`. Any component anywhere in the tree can call `useAuth()` to access the token and auth functions without props.

**Where used:** `src/hooks/useAuth.js`

---

### `useNavigate` and `useLocation`

**What they are:** React Router hooks. `useNavigate` returns a function to programmatically change the URL. `useLocation` returns the current URL location object.

**Where used:**

| File | Hook | Purpose |
|---|---|---|
| `LoginForm.jsx` | `useNavigate` | Redirect to `/topics` after login |
| `ProtectedRoute.jsx` | `useNavigate` (via `Navigate`) | Redirect to `/login` if not authenticated |
| `ProtectedRoute.jsx` | `useLocation` | Save the intended URL so user can be sent there after login |
| `SideNav.jsx` | `useNavigate` | Navigate on nav item click |
| `SideNav.jsx` | `useLocation` | Determine which item is currently selected |

---

### `lazy` and `Suspense`

**What they are:** `React.lazy` allows loading a component only when it's first needed (code splitting). `Suspense` shows a fallback UI while the lazy component is loading.

**Why this project uses it:** Without lazy loading, all page code is bundled together and downloaded on first visit even if the user never visits some pages. With lazy loading, each page's code is downloaded only when the user navigates to it. This makes the initial load faster.

**Where used:** `src/router/index.jsx`

```jsx
// These components are NOT imported at the top of the file.
// Their code is downloaded from the server only when needed.
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const TopicsPage = lazy(() => import('../features/topics/pages/TopicsPage'));

// Suspense shows PageLoader (a spinner) while the lazy component downloads.
<Suspense fallback={<PageLoader />}>
  <Routes>...</Routes>
</Suspense>
```

---

### Custom Hooks

**What they are:** Functions whose names start with `use` that call other React hooks. They let you extract and reuse stateful logic.

**Why this project uses them:** Instead of repeating `useQuery({ queryKey: ['topics'], queryFn: getTopics })` in every component that needs topics data, you define it once in `useTopics.js` and call `useTopics()` anywhere.

**Where used:**

| Hook | File | Wraps |
|---|---|---|
| `useTopics` | `features/topics/hooks/useTopics.js` | `useQuery` for topics |
| `useSubjects` | `features/subjects/hooks/useSubjects.js` | `useQuery` for subjects |
| `useTopicMutations` | `features/topics/hooks/useTopicMutations.js` | `useMutation` for update + delete |
| `useAuth` | `hooks/useAuth.js` | `useContext` for auth state |

---

### React Query (`useQuery` and `useMutation`)

**What they are:** Hooks from the TanStack Query library that handle all the complexity of server state: fetching, caching, loading states, error states, and re-fetching.

**Why this project uses it:** Without React Query, you would need to manually write `useState` for loading/error/data in every component that fetches data, and manually decide when to re-fetch. React Query handles all of this declaratively.

**`useQuery` — for reading data:**
```js
const { data: topics = [], isLoading, isError } = useTopics();
// data: the fetched result (defaults to [] while loading)
// isLoading: true while first fetch is in progress
// isError: true if the fetch failed
```

**`useMutation` — for writing data:**
```js
const update = useMutation({
  mutationFn: updateTopic,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics'] }),
});
await update.mutateAsync(payload);  // Call this to trigger the mutation
```

---

### `Outlet` (React Router)

**What it is:** A placeholder component from React Router. When a layout component renders `<Outlet />`, React Router fills that spot with the matched child route's component.

**Why this project uses it:** `AppLayout` wraps the main page area with `SideNav + <Outlet />`. When the user is at `/topics`, `<Outlet />` is replaced with `<TopicsPage />`. The layout stays visible; only the content area changes.

**Where used:** `AppLayout.jsx`, `AuthLayout.jsx`, `ProtectedRoute.jsx`

---

## 5. Backend API Integration Deep Dive

### Where API Calls Are Defined

All API calls are defined in `src/api/`:

| File | Endpoint Prefix | Functions |
|---|---|---|
| `authService.js` | `/auth/` | `login`, `register` |
| `topicService.js` | `/topic/` | `getTopics`, `getTopicById`, `getDueTopics`, `createTopic`, `updateTopic`, `reviewTopic`, `deleteTopic` |
| `subjectService.js` | `/subject/` | `getSubjects`, `getSubjectById`, `createSubject`, `updateSubject`, `deleteSubject` |

The base URL is configured in `.env`:
```
VITE_API_BASE_URL=http://localhost:8080
```
`import.meta.env.VITE_API_BASE_URL` reads this value at build time. All requests go to `http://localhost:8080/topic/`, `http://localhost:8080/auth/login`, etc.

### Where API Calls Are Triggered

| File | Calls | Trigger |
|---|---|---|
| `useTopics.js` | `getTopics` | When component mounts, when cache is stale |
| `useSubjects.js` | `getSubjects` | When component mounts, when cache is stale |
| `useTopicMutations.js` | `updateTopic`, `reviewTopic`, `deleteTopic` | When user clicks Save / Mark as Reviewed / Delete |
| `LoginForm.jsx` | `authService.login` | When user submits the login form |

### How Requests Are Made

Every HTTP request goes through this chain:

```
Service function
  │ calls
  ▼
apiClient.get/post/put/delete(...)   [src/api/client.js]
  │ which is
  ▼
axios instance with baseURL = http://localhost:8080
  │ request interceptor adds:
  │   Authorization: Bearer eyJhbG...
  ▼
HTTP request leaves the browser
```

### How Responses Are Processed

```
HTTP response arrives
  │
  ▼
Axios parses JSON body automatically
  │
  ▼
Response interceptor runs
  ├── If 200-299: passes through
  └── If 401 (and not /auth/ endpoint): clears token, redirects to /login
  │
  ▼
.then((res) => res.data)
  strips Axios wrapper, returns just the JSON payload
  │
  ▼
React Query receives the data
  stores it in the cache under the query key
  │
  ▼
Component re-renders with the new data
```

### How Errors Are Handled

There are three levels of error handling:

**Level 1 — Axios interceptor (global, automatic):**
Handles 401 for all protected routes. Clears token and redirects to login.

**Level 2 — React Query (automatic for queries):**
On query failure, sets `isError: true` and `error` on the query result. The component can check `isError` and render an error message.

**Level 3 — Component try/catch (for mutations):**
Mutations that need to show error feedback to the user wrap `mutateAsync` in try/catch:
```js
// In TopicDetailPanel.jsx
const handleSave = async () => {
  setError(null);     // Clear previous error
  try {
    await update.mutateAsync(buildPayload());
    onClose();        // Success: close the panel
  } catch (err) {
    setError(getErrorMessage(err));   // Show the error in the UI
  }
};
```

### Full Request Lifecycle: Save a Topic

```
1. User edits title, changes status, writes notes in the rich text editor
2. User clicks the "Save" button or "Save" in the "..." menu

3. handleSave() in TopicDetailPanel.jsx fires:
   - Calls setError(null) to clear any previous error
   - Calls buildPayload() to assemble the full topic object from state:
     { id, title, notes: JSON.stringify(editor.getJSON()), topicStatus, userId, subjectId }
   - Calls await update.mutateAsync(payload)

4. update is from useTopicMutations() which calls useMutation({ mutationFn: updateTopic })
   So updateTopic(payload) is called

5. In topicService.js:
   apiClient.put('/topic/', payload).then((res) => res.data)

6. In client.js request interceptor:
   Authorization: Bearer eyJhbGciOiJIUzI1... is added

7. HTTP PUT http://localhost:8080/topic/
   Body: { id: 5, title: "Arrays", notes: '{"type":"doc"...}', topicStatus: "IN_PROGRESS", ... }

8. Backend validates and persists the update
   Returns 200: { id: 5, title: "Arrays", notes: "...", topicStatus: "IN_PROGRESS", ... }

9. React Query onSuccess fires:
   queryClient.invalidateQueries({ queryKey: ['topics'] })

10. React Query sees ['topics'] is invalidated, re-calls getTopics()

11. GET http://localhost:8080/topic/ returns the updated topic list

12. React Query updates its cache

13. TopicsPage re-renders — the updated topic card appears in the grid

14. handleSave() resolves — onClose() is called — the detail panel closes
```

---

## 6. Authentication and Authorization

### What Authentication Means Here

Authentication answers: "Who are you?" The user proves their identity with email + password. The backend returns a JWT (JSON Web Token) — a signed string that proves the user is who they claim to be for the next 15 minutes.

Authorization answers: "Are you allowed here?" Every page except `/login` and `/register` requires a valid token. `ProtectedRoute` enforces this.

### Token Storage and Lifecycle

```
First login:
  POST /auth/login { email, password }
  ← 200 { accessToken: "eyJhbG..." }
  localStorage.setItem('accessToken', token)
  React state: token = "eyJhbG..."
  isAuthenticated = true

Browser refresh:
  AuthContext initializes: useState(() => localStorage.getItem('accessToken'))
  If token exists in localStorage → user is considered authenticated immediately
  No login prompt required

Every API request:
  Axios interceptor reads localStorage.getItem('accessToken')
  Adds: Authorization: Bearer eyJhbG...

Token expires (15 minutes):
  Next API call returns 401
  Axios interceptor fires: localStorage.removeItem('accessToken'), redirect to /login

Manual logout:
  logout() in AuthContext:
  localStorage.removeItem('accessToken')
  setToken(null)
  isAuthenticated becomes false
  ProtectedRoute redirects to /login
```

### Authentication File Map

```
┌─────────────────────────────────────────────────────────┐
│ User submits login form                                  │
│ src/features/auth/components/LoginForm.jsx               │
│   - manages form state with react-hook-form              │
│   - calls authService.login() on submit                  │
└─────────────────────────┬───────────────────────────────┘
                          │ POST /auth/login
                          ▼
┌─────────────────────────────────────────────────────────┐
│ src/api/authService.js                                   │
│   - sends the HTTP request                               │
│   - returns { accessToken }                              │
└─────────────────────────┬───────────────────────────────┘
                          │ { accessToken }
                          ▼
┌─────────────────────────────────────────────────────────┐
│ LoginForm calls login(accessToken) from useAuth()        │
│ src/hooks/useAuth.js → src/context/AuthContext.jsx       │
│   - stores token in localStorage                         │
│   - sets React state: token = accessToken                │
│   - isAuthenticated becomes true                         │
└─────────────────────────┬───────────────────────────────┘
                          │ navigate('/topics')
                          ▼
┌─────────────────────────────────────────────────────────┐
│ src/router/ProtectedRoute.jsx checks isAuthenticated     │
│   - if true: renders <Outlet /> (the page)               │
│   - if false: <Navigate to="/login"> (redirect)          │
└─────────────────────────────────────────────────────────┘
```

### Authentication Sequence Diagram

```
Browser          LoginForm         authService       Backend
  │                 │                  │               │
  │ fill form       │                  │               │
  │────────────────►│                  │               │
  │                 │ authService.login()               │
  │                 │─────────────────►│               │
  │                 │                  │ POST /auth/login
  │                 │                  │──────────────►│
  │                 │                  │               │ validate
  │                 │                  │  { accessToken}│
  │                 │                  │◄──────────────│
  │                 │ { accessToken }  │               │
  │                 │◄─────────────────│               │
  │                 │ login(token)     │               │
  │                 │─→ localStorage   │               │
  │                 │─→ setToken()     │               │
  │                 │ navigate('/topics')               │
  │                 │─────────────────────────────────►│(client-side only)
  │                 │                  │               │
```

### Protected Route Implementation

```jsx
// src/router/ProtectedRoute.jsx
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();  // Current URL, e.g., /topics

  if (!isAuthenticated) {
    // Passes the current location as state so after login,
    // the user can be redirected back to where they were.
    return <Navigate to="/login" state={{ from: location }} replace />;
    //                            ^ saves /topics in history state
    //                                                       ^ replaces current history
    //                                                         entry so back button works
  }

  return <Outlet />;  // User is authenticated: render the protected page
}
```

---

## 7. Routing Walkthrough

### How React Router Works

React Router watches the browser's URL. When the URL changes, it finds the matching `<Route>` and renders the corresponding component. No page reloads; only component swaps.

### Route Table

| URL | Public / Protected | Layout | Component Rendered |
|---|---|---|---|
| `/login` | Public | `AuthLayout` (centered card) | `LoginPage` |
| `/register` | Public | `AuthLayout` | `RegisterPage` |
| `/topics` | Protected | `AppLayout` (sidebar + content) | `TopicsPage` |
| Anything else | — | — | Redirects to `/login` |

### Route Definition

```jsx
// src/router/index.jsx
<Routes>
  {/* Group 1: Public routes inside AuthLayout */}
  <Route element={<AuthLayout />}>        // AuthLayout renders <Outlet /> inside a centered card
    <Route path="/login"    element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
  </Route>

  {/* Group 2: Protected routes */}
  <Route element={<ProtectedRoute />}>    // Checks isAuthenticated before rendering <Outlet />
    <Route element={<AppLayout />}>       // AppLayout renders SideNav + <Outlet />
      <Route path="/topics" element={<TopicsPage />} />
    </Route>
  </Route>

  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
```

### Layout Nesting Explained

React Router's nested routes create a component nesting. When the user visits `/topics`:

```
BrowserRouter
  └── Routes
        └── ProtectedRoute (checks auth, renders Outlet)
              └── AppLayout (renders SideNav + Outlet)
                    └── TopicsPage (the actual page content)
```

`AppLayout` renders:
```jsx
<Box sx={{ display: 'flex', minHeight: '100vh' }}>
  <SideNav />                    // Always visible
  <Box component="main">
    <Outlet />                   // TopicsPage goes here
  </Box>
</Box>
```

So `SideNav` is always rendered; only the `<Outlet />` area changes when you navigate.

### Route Navigation Map

```
App Starts
  │
  ├─ Has token in localStorage?
  │   ├─ Yes → ProtectedRoute passes → AppLayout → TopicsPage
  │   └─ No  → ProtectedRoute redirects → /login → AuthLayout → LoginPage
  │
From LoginPage:
  ├─ Submit valid credentials → login() → navigate('/topics')
  └─ Click "register" link   → navigate('/register')

From /topics (SideNav):
  └─ Click "topic list" → navigate('/topics') (already there, no-op)
```

### How `lazy` Loading Affects Routing

```jsx
// src/router/index.jsx
const TopicsPage = lazy(() => import('../features/topics/pages/TopicsPage'));

// When the user first visits /topics:
// 1. React Router matches the route
// 2. React sees TopicsPage is lazy
// 3. React starts downloading the topics page bundle from the server
// 4. While downloading, <Suspense> shows <PageLoader /> (a spinner)
// 5. When downloaded, TopicsPage replaces the spinner
```

---

## 8. State Management

### The Two Types of State in This Project

This project has a clear division of state responsibilities:

```
┌──────────────────────────────────────────────────────────────┐
│                     STATE IN THIS APP                         │
│                                                              │
│  ┌──────────────────────────┐  ┌───────────────────────────┐│
│  │      SERVER STATE         │  │       LOCAL UI STATE      ││
│  │  (TanStack React Query)   │  │  (React useState)         ││
│  │                          │  │                           ││
│  │  Topics list             │  │  Which subject is filtered││
│  │  Subjects list           │  │  Which topic is open      ││
│  │  (anything from the API) │  │  Title in the text field  ││
│  │                          │  │  Status in the dropdown   ││
│  │  Owned by QueryClient    │  │  Error message shown      ││
│  │  Cached, stale-aware     │  │  Menu open or closed      ││
│  └──────────────────────────┘  └───────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              GLOBAL AUTH STATE                        │   │
│  │              (React Context)                          │   │
│  │  token, isAuthenticated, login(), logout()            │   │
│  │  Shared across router, components, and API client     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### React Query Cache: How It Works

Think of the React Query cache as a key-value store:

```
Cache Key        Cached Value              Status
──────────────   ───────────────────────   ─────────
['topics']       [{ id: 1, title: ... },   FRESH (< 60s since last fetch)
                  { id: 2, title: ... }]
['subjects']     [{ id: 1, name: "Math" }]  STALE (> 60s)
```

When a component calls `useTopics()`:
- If `['topics']` is FRESH → returns cached data immediately, no network request
- If `['topics']` is STALE → returns cached data immediately AND starts a background re-fetch
- If `['topics']` is missing → shows `isLoading: true`, makes a network request

When `queryClient.invalidateQueries({ queryKey: ['topics'] })` is called:
- The `['topics']` entry is immediately marked as stale
- Any component currently using `useTopics()` triggers a background re-fetch
- When the re-fetch completes, those components re-render with fresh data

### Local State: What Lives Where

| Component | State | Why Here |
|---|---|---|
| `TopicsPage` | `selectedSubjectId` | Only TopicsPage needs the filter value |
| `TopicsPage` | `selectedTopic` | Controls whether the dialog is open; only TopicsPage knows |
| `TopicDetailPanel` | `title`, `status` | Form fields — local editable copies of the topic data |
| `TopicDetailPanel` | `menuAnchor` | The "..." menu position — purely UI, no one else cares |
| `TopicDetailPanel` | `error` | API error to display — lives and dies within the panel |
| `LoginForm` | `serverError` | API error for the login form |
| `AuthContext` | `token` | Must be global because ProtectedRoute, client.js, and LoginForm all need it |

---

## 9. End-to-End Feature Walkthroughs

### Walkthrough 1: User Logs In

```
User types email + password, clicks "Log In"
  │
  ▼
LoginForm.jsx — handleSubmit(onSubmit) fires
  The form is validated by react-hook-form before onSubmit runs.
  If email is missing or invalid, react-hook-form blocks submission
  and shows field-level errors. onSubmit never fires.
  │
  ▼
onSubmit(data) executes
  setServerError(null)  ← clear any previous error
  const { accessToken } = await authService.login(data)
  │
  ▼
authService.login({ email, password })
  apiClient.post('/auth/login', { email, password }).then((res) => res.data)
  │
  ▼
POST http://localhost:8080/auth/login
  Note: No Authorization header here — the request interceptor checks
  localStorage, which is empty since user isn't logged in yet.
  │
  ▼
Backend returns 200 { accessToken: "eyJhbG..." }
  (or 401 if credentials are wrong)
  │
  ▼ (success path)
login(accessToken) is called from useAuth()
  localStorage.setItem('accessToken', accessToken)
  setToken(accessToken) in AuthContext
  isAuthenticated becomes true
  │
  ▼
navigate('/topics')
  React Router changes the URL to /topics
  ProtectedRoute checks isAuthenticated → true → renders AppLayout → TopicsPage
  │
  ▼
TopicsPage mounts
  useTopics() fires → GET /topic/
  useSubjects() fires → GET /subject/
  Topics grid renders

  ▼ (failure path: 401 from backend)
catch(error) catches the axios error
  error.response.status === 401 → setServerError('Invalid email or password.')
  Note: The axios interceptor does NOT redirect here because the URL contains '/auth/'
  The form shows the error message in a red Alert above the fields
```

---

### Walkthrough 2: Topics List Loads

```
User lands on /topics

TopicsPage mounts
  │
  ├── const { data: topics = [], isLoading, isError } = useTopics();
  │     │
  │     └── useQuery({ queryKey: ['topics'], queryFn: getTopics })
  │           │
  │           ├── Is ['topics'] in cache and FRESH?
  │           │   YES → return cached data immediately, isLoading = false
  │           │   NO  → isLoading = true, start network request
  │           │
  │           └── (if fetching) GET http://localhost:8080/topic/
  │                 ← 200 [ { id:1, title:"Arrays", topicStatus:"IN_PROGRESS", ... }, ... ]
  │                 React Query stores result under key ['topics']
  │                 Component re-renders with data
  │
  ├── const { data: subjects = [] } = useSubjects();
  │     (same pattern with key ['subjects'])
  │
  ├── While isLoading is true:
  │     Renders <CircularProgress /> centered on page
  │
  ├── If isError is true:
  │     Renders <Alert severity="error">Failed to load topics...</Alert>
  │
  └── Once data arrives:
        filteredTopics = topics (no filter active yet)
        Renders a CSS Grid of <TopicCard /> components
        Each TopicCard receives topic={topic} onOpen={setSelectedTopic}
```

---

### Walkthrough 3: User Edits and Saves a Topic

```
User clicks the arrow (→) on a topic card

TopicCard.jsx — onClick={() => onOpen(topic)}
  onOpen is setSelectedTopic from TopicsPage
  │
  ▼
TopicsPage — setSelectedTopic(topic)
  selectedTopic is now the clicked topic object
  React re-renders TopicsPage
  │
  ▼
<Dialog open={Boolean(selectedTopic)} ...>
  Boolean(selectedTopic) is now true → Dialog is visible
  <TopicDetailPanel key={selectedTopic.id} topic={selectedTopic} subjects={subjects} onClose={...} />
  │
  ▼
TopicDetailPanel mounts with the topic's current data
  Local state initializes:
    title = topic.title
    status = topic.topicStatus
  TipTap editor initializes with:
    content = parseNotes(topic.notes)  ← parses the JSON stored in the notes field

User edits the title, changes status to "IN_PROGRESS",
writes notes in the rich text editor

User clicks "Save"
  │
  ▼
handleSave() fires
  setError(null)
  payload = buildPayload():
    { id: topic.id, title: "New Title", notes: JSON.stringify(editor.getJSON()),
      topicStatus: "IN_PROGRESS", userId: topic.userId, subjectId: topic.subjectId }
  await update.mutateAsync(payload)
  │
  ▼
useTopicMutations — update mutation
  updateTopic(payload) → PUT http://localhost:8080/topic/
  Body: { id, title, notes, topicStatus, userId, subjectId }
  │
  ▼
Backend validates, saves, returns updated topic
  ← 200 { id, title: "New Title", ... }
  │
  ▼
onSuccess fires:
  queryClient.invalidateQueries({ queryKey: ['topics'] })
  React Query marks ['topics'] as stale, re-fetches in background
  │
  ▼
handleSave() resolves → onClose() fires
  setSelectedTopic(null) in TopicsPage
  Dialog closes
  │
  ▼
Re-fetch completes
  Topics list updates
  TopicCard for the edited topic now shows the new title
```

---

### Walkthrough 4: User Deletes a Topic

```
User clicks "..." in TopicDetailPanel → clicks "Delete"

closeMenu() fires → setMenuAnchor(null) → menu closes
handleDelete() fires
  │
  ▼
setError(null)
await remove.mutateAsync(topic.id)
  │
  ▼
useTopicMutations — remove mutation
  deleteTopic(topic.id) → DELETE http://localhost:8080/topic/5
  (no body for DELETE requests)
  │
  ▼
Backend deletes the topic, returns 204 No Content
  │
  ▼
onSuccess fires:
  queryClient.invalidateQueries({ queryKey: ['topics'] })
  React Query re-fetches topic list
  │
  ▼
remove.mutateAsync resolves → onClose() fires → Dialog closes
  │
  ▼
Re-fetch completes → topics list now excludes the deleted topic
  TopicsPage grid updates — the deleted card disappears
```

---

## 10. How To Add a New Backend Endpoint

Let's say the backend exposes a new endpoint:

```
GET /courses                        ← Returns all courses for the user
  Response: [{ id, name, level }]

POST /courses                       ← Creates a new course
  Body: { name, level, userId }
  Response: { id, name, level }
```

Follow these steps exactly — they match the project's patterns:

---

### Step 1 — Create the API Service File

Create `src/api/courseService.js`:

```js
// src/api/courseService.js
import apiClient from './client';  // always use the configured client

export const getCourses = () =>
  apiClient.get('/courses').then((res) => res.data);

export const createCourse = (data) =>
  apiClient.post('/courses', data).then((res) => res.data);
```

**Why here?** The service layer is the only place HTTP calls live. No component or hook should import `axios` directly.

---

### Step 2 — Create the Query Hook

Create `src/features/courses/hooks/useCourses.js`:

```js
// src/features/courses/hooks/useCourses.js
import { useQuery } from '@tanstack/react-query';
import { getCourses } from '../../../api/courseService';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],   // unique cache key for this resource
    queryFn: getCourses,
  });
}
```

**Why here?** Feature-specific hooks live in their feature's `hooks/` folder.

---

### Step 3 — Create the Mutations Hook (if needed)

Create `src/features/courses/hooks/useCourseMutations.js`:

```js
// src/features/courses/hooks/useCourseMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCourse } from '../../../api/courseService';

export function useCourseMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createCourse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
    // After creating a course, the cached course list is stale → re-fetch
  });

  return { create };
}
```

---

### Step 4 — Create the Page Component

Create `src/features/courses/pages/CoursesPage.jsx`:

```jsx
// src/features/courses/pages/CoursesPage.jsx
import { Box, CircularProgress, Alert } from '@mui/material';
import { useCourses } from '../hooks/useCourses';
import EmptyState from '../../../components/feedback/EmptyState';

export default function CoursesPage() {
  const { data: courses = [], isLoading, isError } = useCourses();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load courses. Please try again.</Alert>
      </Box>
    );
  }

  if (courses.length === 0) {
    return <EmptyState message="No courses yet." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {courses.map((course) => (
        <Box key={course.id}>{course.name}</Box>  // Replace with a CourseCard later
      ))}
    </Box>
  );
}
```

---

### Step 5 — Add the Route

In `src/router/index.jsx`, add:

```jsx
// At the top with other lazy imports:
const CoursesPage = lazy(() => import('../features/courses/pages/CoursesPage'));

// Inside the <Route element={<ProtectedRoute />}> group:
<Route element={<AppLayout />}>
  <Route path="/topics"  element={<TopicsPage />} />
  <Route path="/courses" element={<CoursesPage />} />  {/* ← add this */}
</Route>
```

---

### Step 6 — Add the Nav Item (Optional)

In `src/components/navigation/SideNav.jsx`, update `NAV_ITEMS`:

```js
const NAV_ITEMS = [
  { label: 'home',       path: null        },
  { label: 'calendar',   path: null        },
  { label: 'topic list', path: '/topics'   },
  { label: 'courses',    path: '/courses'  },  // ← add this
];
```

---

### Complete File Creation Summary

```
1. src/api/courseService.js              ← HTTP calls
2. src/features/courses/hooks/
   useCourses.js                         ← read query
   useCourseMutations.js                 ← write mutations
3. src/features/courses/pages/
   CoursesPage.jsx                       ← route target
4. src/router/index.jsx                  ← add the route
5. src/components/navigation/SideNav.jsx ← add nav item
```

---

## 11. Common Development Patterns

### Pattern 1: Smart vs. Presentational Components

**What it is:** Components are divided into two roles. "Smart" (container) components fetch data and manage state. "Presentational" (dumb) components only render what they receive.

**Why it was chosen:** Presentational components are easy to read and test because they have no side effects — the same props always produce the same output. Smart components are the only ones that need to change when data requirements change.

**In this project:**

| Smart (data-aware) | Presentational (pure UI) |
|---|---|
| `TopicsPage` | `TopicCard` |
| `TopicDetailPanel` | `TopicStatusChip` |
| `LoginForm` | `EmptyState` |

```jsx
// Presentational — receives everything via props, calls back via callbacks
function TopicCard({ topic, onOpen }) {
  return <Card><TopicStatusChip status={topic.topicStatus} /></Card>;
}

// Smart — fetches its own data, manages its own state
function TopicsPage() {
  const { data: topics } = useTopics();
  const [selectedTopic, setSelectedTopic] = useState(null);
  return topics.map(t => <TopicCard topic={t} onOpen={setSelectedTopic} />);
}
```

---

### Pattern 2: Service Layer (API Abstraction)

**What it is:** All HTTP calls are wrapped in named functions in `src/api/`. Components and hooks never call `axios` directly.

**Why it was chosen:** If the backend changes `/topic/` to `/api/v2/topics`, you update one file (`topicService.js`), not every component that fetches topics.

```js
// The rule: this is the ONLY place axios is mentioned.
// src/api/topicService.js
export const getTopics = () =>
  apiClient.get('/topic/').then((res) => res.data);

// Hooks call the service function — not axios.
// src/features/topics/hooks/useTopics.js
queryFn: getTopics   // ← references the service function
```

---

### Pattern 3: Custom Hook Extraction

**What it is:** When a component has data-fetching logic, that logic is extracted into a custom hook in a `hooks/` subfolder.

**Why it was chosen:** It keeps page components clean (they just call `useTopics()` and get back `{ data, isLoading, isError }`). The fetching mechanism is hidden and reusable.

```
Without custom hook (bad):          With custom hook (good):
  TopicsPage                          useTopics.js
    useQuery({                          useQuery({ queryKey, queryFn })
      queryKey: ['topics'],
      queryFn: getTopics                TopicsPage
    })                                    const { data } = useTopics()
    // 6 more lines of query config
```

---

### Pattern 4: Provider Pattern (React Context)

**What it is:** A component wraps its children in a "Provider" that makes data available to any descendant without prop drilling.

**Why it was chosen:** Auth state is needed by components at completely different levels of the tree — the route guard, the login form, and the HTTP client. Threading these as props would require adding them to every intermediate component.

```jsx
// In App.jsx — AuthProvider wraps EVERYTHING
<AuthProvider>
  <AppRouter />  // AuthProvider's children can call useAuth() anywhere
</AuthProvider>

// In ProtectedRoute.jsx — three levels deep, no prop threading needed
const { isAuthenticated } = useAuth();
```

---

### Pattern 5: Exported Constants for Shared Values

**What it is:** When a value needs to be referenced in two different parts of the codebase, it's exported as a named constant.

**Why it was chosen:** This prevents values from drifting out of sync. If the sidebar width changes, you update `NAV_WIDTH` in `SideNav.jsx` once and every file that imports it automatically gets the new value.

```js
// src/components/navigation/SideNav.jsx
export const NAV_WIDTH = 180;   // single source of truth

// src/features/topics/pages/TopicsPage.jsx
import { NAV_WIDTH } from '../../../components/navigation/SideNav';
ml: `${NAV_WIDTH + 10}px`  // referenced, not hardcoded
```

---

### Pattern 6: Cache Invalidation on Mutation

**What it is:** After every write operation (create, update, delete), the corresponding React Query cache key is invalidated, triggering a re-fetch.

**Why it was chosen:** This keeps the UI consistent with the server without manually managing the cache. After deleting a topic, the topics list automatically re-fetches and the deleted card disappears.

```js
// After any topic mutation:
onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics'] })
// This pattern appears in both update and remove mutations in useTopicMutations.js
```

---

### Pattern 7: Graceful Error Display

**What it is:** Errors are handled at multiple levels, with user-friendly messages shown inline.

**Why it was chosen:** Raw error objects should never reach the UI. The `getErrorMessage` utility extracts the most useful message from whatever the API returned.

```
API error object (complex, internal)
  ↓ getErrorMessage()
User-facing string (simple, readable)
  ↓
<Alert severity="error">{error}</Alert>
```

---

## 12. New Developer Survival Guide

### If You Joined Today: What To Read First

Read files in this order to build a mental model from the outside in:

**Round 1 — Understand the outer shell (15 minutes)**
1. `package.json` — what libraries are installed
2. `src/main.jsx` — how the app boots
3. `src/App.jsx` — what global wrappers exist
4. `src/router/index.jsx` — what pages exist

**Round 2 — Understand authentication (15 minutes)**
5. `src/context/AuthContext.jsx` — how auth state is managed
6. `src/api/client.js` — how the token is attached to requests
7. `src/router/ProtectedRoute.jsx` — how pages are protected
8. `src/features/auth/components/LoginForm.jsx` — how login works end-to-end

**Round 3 — Understand the topics feature (20 minutes)**
9. `src/api/topicService.js` — what HTTP calls are available
10. `src/features/topics/hooks/useTopics.js` — how data is fetched
11. `src/features/topics/hooks/useTopicMutations.js` — how data is modified
12. `src/features/topics/pages/TopicsPage.jsx` — how it all comes together
13. `src/features/topics/components/TopicCard.jsx` — a simple presentational component
14. `src/features/topics/components/TopicDetailPanel.jsx` — a complex smart component

**Round 4 — Understand the shared infrastructure (10 minutes)**
15. `src/components/layout/AppLayout.jsx` — the page shell
16. `src/components/navigation/SideNav.jsx` — the sidebar
17. `src/utils/errorUtils.js` — error handling pattern

---

### Which Folders Matter Most

| Folder | Importance | Why |
|---|---|---|
| `src/features/topics/` | High | Core feature with all patterns demonstrated |
| `src/api/` | High | All backend communication |
| `src/context/` | High | Global auth state |
| `src/router/` | Medium | All URL routing |
| `src/components/` | Medium | Shared UI |
| `src/hooks/` | Low | Just `useAuth.js` currently |
| `src/theme/` | Low | Rarely needs touching |
| `src/utils/` | Low | Utility functions |

---

### File Risk Assessment

**Risky to modify — touch carefully:**

| File | Risk | Why |
|---|---|---|
| `src/api/client.js` | High | A bug here breaks ALL API calls for ALL features |
| `src/context/AuthContext.jsx` | High | A bug breaks login/logout/session persistence |
| `src/router/index.jsx` | Medium | Affects which pages are accessible |
| `src/router/ProtectedRoute.jsx` | Medium | Could accidentally expose or lock protected pages |
| `src/main.jsx` | Medium | Provider order matters; wrong nesting breaks the app |

**Safe to modify — low blast radius:**

| File | Why Safe |
|---|---|
| `src/features/topics/components/TopicCard.jsx` | Only affects topic card rendering |
| `src/features/topics/components/TopicStatusChip.jsx` | Only affects status display |
| `src/components/feedback/EmptyState.jsx` | Only affects empty state messages |
| `src/theme/theme.js` | Only affects colors and fonts |
| `src/utils/errorUtils.js` | Pure function, easy to test |
| Any new feature file | New files don't break existing code |

---

### Quick Reference: Where Does X Go?

| What you're adding | Where it goes |
|---|---|
| A new API endpoint call | `src/api/<resource>Service.js` |
| A query hook for a new resource | `src/features/<name>/hooks/use<Name>.js` |
| A mutation hook for a new resource | `src/features/<name>/hooks/use<Name>Mutations.js` |
| A new page | `src/features/<name>/pages/<Name>Page.jsx` |
| A new UI component for one feature | `src/features/<name>/components/<Name>.jsx` |
| A component used by 2+ features | `src/components/<category>/<Name>.jsx` |
| A new URL route | `src/router/index.jsx` |
| A nav item | `src/components/navigation/SideNav.jsx` |
| A global style change | `src/theme/theme.js` |
| A reusable utility function | `src/utils/<name>.js` |
| Global state needed across features | `src/context/<Name>Context.jsx` |

---

### Common Mistakes to Avoid

**1. Don't call `axios` directly in a component.**
```jsx
// Wrong
const res = await axios.get('/topic/');

// Right
// Create a function in topicService.js and call that from a hook
```

**2. Don't fetch data with `useEffect`.**
```jsx
// Wrong
useEffect(() => {
  axios.get('/topic/').then(data => setTopics(data));
}, []);

// Right — use React Query
const { data: topics } = useTopics();
```

**3. Don't read `localStorage` in a component.**
```jsx
// Wrong
const token = localStorage.getItem('accessToken');

// Right
const { token } = useAuth();
```

**4. Don't import between features.**
```jsx
// Wrong — topics importing from auth
import { LoginForm } from '../../auth/components/LoginForm';

// If two features share something, move it to src/components/
```

**5. Don't forget to invalidate the cache after mutations.**
```js
// Wrong — list won't update after save
const update = useMutation({ mutationFn: updateTopic });

// Right
const update = useMutation({
  mutationFn: updateTopic,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics'] }),
});
```

**6. Don't hardcode layout widths.**
```jsx
// Wrong
ml: '190px'

// Right — import the constant
import { NAV_WIDTH } from '../../../components/navigation/SideNav';
ml: `${NAV_WIDTH + 10}px`
```

**7. Don't commit broken dependency order.**

If component A imports from component B or hook C, those must exist in a prior commit or in the same commit — never after. The same applies to npm packages: install them in a commit that comes before the first file that imports them.

**8. Don't put AI agent names in the commit history.**

All commits must be authored under the project owner's Git identity. Do not add `Co-Authored-By` trailers for AI agents. Run `git config user.name` and `git config user.email` to confirm the author before committing.

---

*Last updated: 2026-06-17 | Generated from codebase at commit dafd246*

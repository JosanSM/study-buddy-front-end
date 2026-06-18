# Study Buddy — Frontend Architecture Guide

> This document is the authoritative reference for the Study Buddy frontend (`studdy-buddy-ui`).
> It is consumed by both developers and AI coding agents.
> All architectural decisions made here must be respected unless explicitly revised and recorded in this file.

---

## 1. Project Overview

### Purpose
`studdy-buddy-ui` is the React frontend for Study Buddy — a tool that lets students organize their study topics into subjects and track their progress using simple, effective learning strategies.

### High-Level Responsibilities
- Provide a clean, intuitive UI for managing Subjects and Topics
- Authenticate users via JWT against the Spring Boot backend
- Display and mutate data through the REST API exclusively
- Track topic study status (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`)

### Goals
- Clean, feature-based architecture that scales as features are added
- Reusable component system built on Material UI
- Secure JWT authentication with minimal surface area
- Developer experience: fast iteration, clear conventions, low cognitive overhead

### Non-Goals
- No server-side rendering (Vite SPA only)
- No offline support or service workers at this stage
- No TypeScript — JavaScript/JSX throughout (TS only if a specific dependency strictly requires it)
- No feature gating by `user_tier` at this stage — the architecture is aware of the field, but the UI is uniform for all users

---

## 2. Technology Stack

| Concern | Library | Rationale |
|---|---|---|
| Framework | React 18 | Component model, hooks ecosystem |
| Build tool | Vite | Fast HMR, lean config |
| UI components | Material UI (MUI) v5 | Full design system, built-in accessibility, theming |
| Routing | React Router v6 | Declarative nested routing |
| Server state | TanStack Query (React Query) v5 | Caching, loading/error states, refetch strategies |
| HTTP client | Axios | Interceptors for auth headers and 401 handling |
| Forms | React Hook Form | Minimal re-renders, clean validation, integrates well with MUI |
| Global state | React Context API | Auth state only; no Zustand/Redux needed at this scale |
| Icons | MUI Icons | Consistent with MUI design language |

### Why This Stack?

**MUI over Tailwind:** MUI provides a complete design system (spacing, typography, color tokens, components) out of the box. For a single-developer project, this reduces decision fatigue and keeps UI consistent without writing custom CSS. The `ThemeProvider` pattern maps well to a centralized configuration mindset familiar from Spring's `@Configuration` classes.

**React Query over manual `useEffect` fetching:** Fetching data in `useEffect` with local `useState` is error-prone — you have to manually manage loading, error, stale data, and cache invalidation. React Query handles all of this declaratively. Think of it as a repository/service abstraction over HTTP: you declare *what* data you need, not *how* to fetch it.

**Context API over Zustand:** The only global state needed right now is auth (current user + token). Context is sufficient. Zustand would be appropriate if global state grows complex or causes measurable performance issues.

**React Hook Form over Formik:** Lighter weight, fewer re-renders, simpler integration with MUI's controlled/uncontrolled input model.

---

## 3. Frontend Architecture

### Principle: Feature-Based Organization

Code is organized by **feature** (auth, subjects, topics), not by technical role. Each feature owns its components, hooks, and pages. Only truly shared code lives outside a feature folder.

This mirrors Spring's package-by-feature pattern (`com.app.auth`, `com.app.subject`) rather than package-by-layer (`com.app.controller`, `com.app.service`).

### Separation of Concerns

| Layer | Responsibility | Location |
|---|---|---|
| API services | HTTP calls, DTO mapping | `src/api/` |
| React Query hooks | Caching, server state | `src/features/<feature>/hooks/` |
| Context providers | Global auth state | `src/context/` |
| Page components | Route targets, layout composition | `src/features/<feature>/pages/` |
| Feature components | Business-specific UI | `src/features/<feature>/components/` |
| Shared components | Generic, reusable UI | `src/components/` |
| Theme | MUI design tokens | `src/theme/` |
| Router | Route definitions | `src/router/` |

### Scalability
- New features are self-contained folders under `src/features/`
- Shared components only graduate to `src/components/` when they are used by 2 or more features
- The API layer (`src/api/`) maps directly to backend resource endpoints

### Maintainability
- No component file should exceed ~200 lines; split if it does
- Smart components (with data fetching) and presentational components (pure UI) are kept separate
- One component per file

---

## 4. Recommended Folder Structure

```
studdy-buddy-ui/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── api/                            # HTTP service layer
│   │   ├── client.js                   # Axios instance + interceptors
│   │   ├── authService.js              # /auth endpoints
│   │   ├── userService.js              # /user endpoints
│   │   ├── subjectService.js           # /subject endpoints
│   │   └── topicService.js             # /topic endpoints
│   ├── components/                     # Shared, feature-agnostic UI
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx           # Persistent nav + page wrapper for authenticated pages
│   │   │   └── AuthLayout.jsx          # Centered card wrapper for login/register
│   │   ├── feedback/
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── ErrorMessage.jsx
│   │   │   └── EmptyState.jsx
│   │   └── navigation/
│   │       └── Navbar.jsx
│   ├── context/
│   │   └── AuthContext.jsx             # Auth state + token management
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   └── RegisterForm.jsx
│   │   │   └── pages/
│   │   │       ├── LoginPage.jsx
│   │   │       └── RegisterPage.jsx
│   │   ├── subjects/
│   │   │   ├── components/
│   │   │   │   ├── SubjectCard.jsx
│   │   │   │   ├── SubjectList.jsx
│   │   │   │   ├── SubjectForm.jsx
│   │   │   │   └── DeleteSubjectDialog.jsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSubjects.js      # React Query hooks for subjects
│   │   │   │   └── useSubjectMutations.js
│   │   │   └── pages/
│   │   │       └── SubjectsPage.jsx
│   │   ├── topics/
│   │   │   ├── components/
│   │   │   │   ├── TopicCard.jsx
│   │   │   │   ├── TopicList.jsx
│   │   │   │   ├── TopicForm.jsx
│   │   │   │   ├── TopicStatusChip.jsx
│   │   │   │   └── DeleteTopicDialog.jsx
│   │   │   ├── hooks/
│   │   │   │   ├── useTopics.js
│   │   │   │   └── useTopicMutations.js
│   │   │   └── pages/
│   │   │       └── TopicsPage.jsx
│   │   └── dashboard/
│   │       └── pages/
│   │           └── DashboardPage.jsx
│   ├── hooks/                          # Cross-feature custom hooks
│   │   └── useAuth.js                  # Consumes AuthContext
│   ├── router/
│   │   ├── index.jsx                   # Route definitions
│   │   └── ProtectedRoute.jsx          # Auth guard component
│   ├── theme/
│   │   └── theme.js                    # MUI ThemeProvider configuration
│   ├── utils/
│   │   └── errorUtils.js               # API error message extraction
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
├── eslint.config.js
└── CLAUDE.md
```

### Folder Rules

| Rule | Reason |
|---|---|
| New features go in `src/features/<name>/` | Keeps domain code self-contained |
| A component only moves to `src/components/` when used by 2+ features | Prevents premature abstraction |
| Never create a `src/pages/` folder | Pages live inside their feature folder |
| Never create a `src/services/` folder | API calls belong in `src/api/` |
| Do not create `src/store/` unless global state complexity justifies Zustand | Context API is sufficient for now |
| Do not create `src/models/` or `src/types/` | No TypeScript in this project |

---

## 5. Routing Strategy

### Route Table

| Path | Component | Protection | Notes |
|---|---|---|---|
| `/login` | `LoginPage` | Public | Redirect to `/dashboard` if already authenticated |
| `/register` | `RegisterPage` | Public | Redirect to `/dashboard` if already authenticated |
| `/dashboard` | `DashboardPage` | Protected | Default landing after login |
| `/subjects` | `SubjectsPage` | Protected | Lists all subjects for the current user |
| `/subjects/:subjectId/topics` | `TopicsPage` | Protected | Lists topics for a specific subject |

### Route Organization

```jsx
// src/router/index.jsx
<Routes>
  {/* Public routes */}
  <Route element={<AuthLayout />}>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
  </Route>

  {/* Protected routes */}
  <Route element={<ProtectedRoute />}>
    <Route element={<AppLayout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/subjects" element={<SubjectsPage />} />
      <Route path="/subjects/:subjectId/topics" element={<TopicsPage />} />
    </Route>
  </Route>

  <Route path="*" element={<Navigate to="/dashboard" replace />} />
</Routes>
```

### ProtectedRoute

Reads auth state from `AuthContext`. If no token is present, redirects to `/login` and preserves the intended destination in location state for a post-login redirect.

---

## 6. State Management Strategy

### Decision Matrix

| State Type | Tool | Example |
|---|---|---|
| Local UI state | `useState` | Modal open/closed, field focus |
| Server / remote state | TanStack Query | Subject list, topic list, user profile |
| Global auth state | Context API | Current user, access token, login/logout |
| Form state | React Hook Form | Login form, subject form, topic form |

### Rules
- Do **not** put server data into Context. React Query owns it.
- Do **not** use `useEffect` to fetch data. Use a React Query `useQuery` hook.
- Do **not** create global state for UI that is only needed in one component. Keep it local with `useState`.
- Auth state lives in `AuthContext` because it is needed by the Axios interceptor, `ProtectedRoute`, and `Navbar` — three separate parts of the component tree.

### React Query Configuration
- `staleTime` for list queries (subjects, topics): `60_000` (1 minute)
- `retry`: `1` (retry once on failure, except on 4xx responses)
- Invalidate the relevant query key after every mutation (create, update, delete)

---

## 7. API Integration Standards

### API Client (`src/api/client.js`)

```js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

> **Note on token refresh:** The backend currently issues only an access token (15-minute TTL) with no refresh endpoint. On 401, the interceptor clears the token and redirects to login. When the backend adds a `/auth/refresh` endpoint, the 401 handler should attempt a silent refresh before redirecting. This change is isolated to `client.js` and `AuthContext.jsx`.

### Environment Variables

```
# .env
VITE_API_BASE_URL=http://localhost:8080
```

### Service Layer Pattern

Each service file wraps API calls. No component or hook ever calls `axios` directly.

```js
// src/api/subjectService.js
import apiClient from './client';

export const getSubjects = () =>
  apiClient.get('/subject/').then((res) => res.data);

export const createSubject = (data) =>
  apiClient.post('/subject/', data).then((res) => res.data);

export const updateSubject = (data) =>
  apiClient.put('/subject/', data).then((res) => res.data);

export const deleteSubject = (id) =>
  apiClient.delete(`/subject/${id}`);
```

### DTO Naming Note

The API uses `snake_case` in some responses (e.g., `user_tier`, `last_updated`) and `camelCase` in others. Do not normalize in the service layer. Handle field access where it is used and document the inconsistency with a short comment.

### API Endpoints Reference

#### Auth (`/auth` — no token required)
| Method | Path | Request Body | Response | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` | `{ accessToken }` | 201; 409 if email taken |
| POST | `/auth/login` | `{ email, password }` | `{ accessToken }` | 200; 401 on bad credentials |

#### Users (`/user` — token required)
| Method | Path | Request Body | Response |
|---|---|---|---|
| GET | `/user/` | — | `[{ id, name, email, user_tier }]` |
| GET | `/user/{id}` | — | `{ id, name, email, user_tier }` |
| POST | `/user/` | `{ name, email, userTier }` | `{ id, name, email, userTier, lastUpdated }` — 201 |
| PUT | `/user/` | `{ id, name, email, userTier }` | `{ id, name, email, user_tier }` |
| DELETE | `/user/{id}` | — | 204 No Content |

#### Subjects (`/subject` — token required)
| Method | Path | Request Body | Response | Notes |
|---|---|---|---|---|
| GET | `/subject/` | — | `[{ id, name }]` | — |
| GET | `/subject/{id}` | — | `{ id, name }` | — |
| POST | `/subject/` | `{ name, userId }` | `{ id, name }` | 201 |
| PUT | `/subject/` | `{ subjectId, name }` | `{ id, name }` | — |
| DELETE | `/subject/{id}` | — | 204 | 409 if subject has topics |

#### Topics (`/topic` — token required)
`topicStatus` values: `NOT_STARTED` | `IN_PROGRESS` | `COMPLETED`

Every topic response object includes three spaced-repetition fields:
```json
{ "reviewCount": 3, "lastReviewedAt": "2026-06-10", "nextReviewAt": "2026-06-17" }
```
- `reviewCount` — integer, starts at 0; increments on each `POST /topic/{id}/review` call
- `lastReviewedAt` — ISO date string (`YYYY-MM-DD`), or `null` if never reviewed
- `nextReviewAt` — ISO date string (`YYYY-MM-DD`), or `null` if never reviewed; use this for calendar placement

**Calendar logic:** render each topic on the date given by `nextReviewAt`. Topics where `nextReviewAt` is `null` have never been reviewed and should not appear on the calendar. Topics where `nextReviewAt <= today` are overdue and can be highlighted.

| Method | Path | Request Body | Response | Notes |
|---|---|---|---|---|
| GET | `/topic/` | — | `[{ id, title, notes, topicStatus, subjectId, userId, reviewCount, lastReviewedAt, nextReviewAt }]` | — |
| GET | `/topic/{id}` | — | `{ id, title, notes, topicStatus, subjectId, userId, reviewCount, lastReviewedAt, nextReviewAt }` | — |
| GET | `/topic/due` | — | same shape, filtered to topics due today or overdue | Authenticated; use for "due today" view or badge count |
| POST | `/topic/` | `{ title, notes, topicStatus, userId, subjectId }` | same shape — 201 | — |
| PUT | `/topic/` | `{ id, title, notes, topicStatus, userId, subjectId }` | same shape | — |
| POST | `/topic/{id}/review` | — (no body) | updated topic object | Increments `reviewCount` and recalculates `nextReviewAt`; call when user clicks "Mark as Reviewed" |
| DELETE | `/topic/{id}` | — | 204 | — |

#### Domain Relationships
```
User → (1:many) → Subject → (1:many) → Topic
User → (1:many) → Topic  (Topic has a direct FK to User as well)
```

### Error Response Shape

All errors from the API follow this shape:
```json
{ "status": 409, "message": "Subject name already exists" }
```

| Status | Meaning |
|---|---|
| 400 | Validation failed, bad enum value |
| 401 | Missing/invalid/expired token, wrong credentials |
| 404 | Resource not found |
| 409 | Duplicate name/email, or deleting a non-empty subject |
| 500 | Unexpected server error |

---

## 8. Component Design Standards

### Component Categories

| Category | Description | Location |
|---|---|---|
| Page | Route target; composes feature components; owns no UI details | `features/<name>/pages/` |
| Feature component | Business-specific UI (SubjectCard, TopicForm) | `features/<name>/components/` |
| Shared component | Generic, reusable across features (LoadingSpinner, EmptyState) | `components/` |
| Layout | Structural wrappers (AppLayout, AuthLayout) | `components/layout/` |

### Smart vs Presentational

**Smart (container) components:**
- Call React Query hooks or consume Context
- Handle mutations and callbacks
- Examples: `SubjectsPage`, `TopicsPage`

**Presentational components:**
- Receive all data via props and emit events via callbacks
- No direct API or Context access
- Examples: `SubjectCard`, `TopicStatusChip`

### Rules
- One component per file; filename matches the export name (`SubjectCard.jsx` exports `SubjectCard`)
- No component file over ~200 lines — split into sub-components if it grows
- Prefer composition over large conditional renders
- Never import from a sibling feature (features must not depend on each other)
- A component that only passes props 3+ levels deep is a signal to restructure or use Context

---

## 9. Form Handling Standards

All forms use **React Hook Form** integrated with **MUI** inputs via the `Controller` component.

```jsx
import { useForm, Controller } from 'react-hook-form';
import { TextField, Button } from '@mui/material';

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
            {...field}
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

### Validation Rules
- Validate client-side with React Hook Form for immediate feedback
- Always surface server-side 400 errors back into the form's error state (do not swallow them)
- Required fields, length limits, and enum values should be validated before submission

### Error Display
- Field-level errors: `helperText` on the MUI input
- Form-level or server errors: MUI `Alert` component placed above the form

---

## 10. Authentication Architecture

### Token Storage
- Access token stored in `localStorage` under key `accessToken`
- Token is attached to requests by the Axios interceptor — components never read `localStorage` directly

### Auth Flow

```
Register / Login
  → POST /auth/register or /auth/login
  → Receive { accessToken }
  → Store in localStorage
  → Set user in AuthContext
  → Navigate to /dashboard

Every API request
  → Axios interceptor reads token
  → Adds Authorization: Bearer <token> header

On 401 response
  → Axios interceptor
  → Clear localStorage
  → Redirect to /login

Logout
  → Clear localStorage
  → Clear AuthContext
  → Navigate to /login
```

### AuthContext Shape

```js
// src/context/AuthContext.jsx
const AuthContext = createContext({
  user: null,           // { id, name, email, user_tier }
  token: null,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false,
});
```

### Future Refresh Token Plan
When the backend adds `/auth/refresh`:
1. Store the refresh token as an `httpOnly` cookie (backend sets it) or in `localStorage`
2. In the 401 interceptor: attempt `POST /auth/refresh`, update `accessToken`, retry the original request
3. If refresh also fails: clear state and redirect to `/login`

This is a localized change in `src/api/client.js` and `AuthContext.jsx` only.

### Security Considerations
- Do not store sensitive data beyond `{ id, name, email, user_tier }` in Context
- Never log tokens to the console
- Never include the token in URL parameters
- The 15-minute expiry limits the damage window of an intercepted token

---

## 11. Error Handling Standards

### Error Utility

```js
// src/utils/errorUtils.js
export function getErrorMessage(error) {
  return error?.response?.data?.message
    ?? error?.message
    ?? 'An unexpected error occurred.';
}
```

### Handling Errors in Mutations

```js
const mutation = useMutation({
  mutationFn: createSubject,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['subjects'] });
  },
  onError: (error) => {
    const message = getErrorMessage(error);
    // display via MUI Alert or Snackbar
  }
});
```

### User-Facing Error Messages

| Scenario | Strategy |
|---|---|
| 401 on a protected page | Redirect to login silently — no error message needed |
| 404 on a resource | Show `EmptyState` component with a contextual message |
| 409 duplicate name | Show the server `message` field directly — it is user-readable |
| 500 server error | Generic: "Something went wrong. Please try again." |
| Network error | "Unable to reach the server. Check your connection." |

### Loading States
- Use `isLoading` from React Query to drive skeleton states
- Use MUI `Skeleton` for list loading placeholders (not a spinner inside a card)
- Use MUI `CircularProgress` centered on the page for full-page loads

### Retry Behavior
- Default React Query retry: `1`
- Do not retry on 401, 403, 404, 409 — these are deterministic failures
- Recommended per-query config: `retry: (count, error) => error?.response?.status >= 500 && count < 2`

---

## 12. Styling Strategy

### Material UI as the Design System

MUI is the single source of truth for visual design. Do not mix in a separate CSS framework.

All theme customization lives in `src/theme/theme.js`:

```js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export default theme;
```

Wrap the app in `ThemeProvider` in `main.jsx`.

### Styling Rules

- Use MUI components as the baseline — do not substitute plain HTML elements where a MUI equivalent exists
- Use the `sx` prop for localized, one-off overrides
- Use `styled()` for reusable custom variants of MUI components
- Use the spacing system (`theme.spacing(1)` = 8px) — no hardcoded pixel values
- Use MUI `Box`, `Stack`, and `Grid2` for layout — no custom flexbox CSS
- `src/index.css` is for body/reset-level styles only — no component styling in global CSS files

### Styling Hierarchy
1. MUI default — use as-is whenever possible
2. `sx` prop — for small, localized overrides
3. `styled()` — for reusable styled variants
4. Global theme — for palette, typography, and component-level defaults

### Accessibility
- MUI handles ARIA roles and keyboard navigation by default — do not override without a reason
- All form fields must have visible labels (`InputLabel` or `label` prop — not just placeholder text)
- Status indicators must never use color alone — pair color with an icon or label (e.g., `TopicStatusChip`)

---

## 13. Testing Strategy

> Testing infrastructure is not yet set up. When added, use this as the standard.

### Recommended Tools

| Tool | Purpose |
|---|---|
| Vitest | Unit and component tests (native Vite integration) |
| React Testing Library | Component tests — assert behavior, not implementation |
| MSW (Mock Service Worker) | Mock API responses in tests without touching `client.js` |

### Test Priorities (highest to lowest)
1. Custom hooks (`useSubjects`, `useTopicMutations`) — these own the business logic
2. Form components — validation rules and error display
3. Utility functions (`errorUtils.js`)
4. Page-level smoke tests (renders without crashing, correct heading visible)

### Rules
- Test behavior, not implementation — assert what the user sees, not which function was called
- Do not mock `localStorage` — use MSW to mock the API instead
- No snapshot tests — they break on every style change and provide no meaningful coverage

---

## 14. Performance Considerations

### Code Splitting

Use `React.lazy` + `Suspense` for page-level route components so each route loads its own bundle on demand:

```jsx
const SubjectsPage = lazy(() => import('../features/subjects/pages/SubjectsPage'));
```

### React Query Caching
- List queries stale after 1 minute
- Single-item queries stale after 30 seconds
- After any mutation: call `queryClient.invalidateQueries` with the relevant key — do not manually update cache state

### Memoization
- Use `useMemo` and `useCallback` only when a profiler shows an actual performance problem
- Do not add them preemptively — they add code complexity with no measurable benefit at small scale
- Avoid wrapping MUI components in extra `memo()` calls

---

## 15. AI Contributor Guidelines

> This section is written specifically for AI coding agents (Claude Code and similar). Follow these rules on every task, without exception.

### Before Writing Any Code

1. **Check for existing components** using the `component-librarian` agent before creating a new one. A component that does 80% of what you need is better than a new one from scratch.
2. **Check the folder structure** rules in Section 4. New files go exactly where the conventions say.
3. **Check the API contract** in Section 7. Do not invent field names or endpoints. If a required endpoint does not exist, stop and ask the developer.
4. **Confirm the feature scope.** A bug fix means fixing only the bug. A feature means implementing only what was requested. No unsolicited refactors.

### Avoiding Architectural Drift

- API calls belong in `src/api/` — never inside a component or a React Query hook directly
- React Query hooks belong in `features/<name>/hooks/` — never inlined in a page component
- Use MUI `sx` prop for styles — never create a new `.css` file for a component
- Use `useAuth` (which consumes `AuthContext`) to access auth state — never read `localStorage` directly in a component
- If you are about to create a `src/pages/`, `src/services/`, `src/models/`, or `src/store/` folder: stop and re-read Section 4

### Preventing Duplicate Components

Before creating any component, answer these questions in order:
1. Does a MUI component already do this? → Use MUI.
2. Does `src/components/` have something similar? → Extend it.
3. Does another feature have a similar component? → Should it move to `src/components/`?
4. Only create a net-new component if all three answers are no.

### Evaluating Architecture Changes

Any proposed change that affects folder structure, state management strategy, API client behavior, or routing must include:
1. The reason the current approach is insufficient
2. The specific tradeoff being accepted
3. An update to this document

Do not introduce Zustand, Redux, or additional state management libraries without explicit developer approval and a documented rationale in Section 2.

### Code Style Rules
- No TypeScript (`.ts`, `.tsx`) unless a dependency strictly requires it
- Comments explain *why*, not *what* — only for non-obvious constraints or workarounds
- One component per file; filename matches the default export
- No `console.log` left in committed code

### Agent Workflow

When starting a new UI feature, follow this agent sequence:
1. `wireframe-ux-translator` — convert wireframe/mockup into a component plan
2. `frontend-architect` — confirm the approach fits the architecture
3. `component-librarian` — identify reuse opportunities
4. `react-implementation-engineer` — build the feature
5. `frontend-security-reviewer` — security review
6. `frontend-code-reviewer` — final code review

### Git Commit Hygiene

These rules apply to every commit, whether made by a developer or an AI agent.

**Dependency ordering — the most important rule:**
- If file A imports from file B, file B must exist in the same commit or an earlier one. Never commit a file that references something that doesn't exist yet.
- Install dependency packages (`package.json` + `package-lock.json`) in a commit that precedes any component that imports those packages.
- When extracting a constant or helper that multiple files reference, commit the exporting file first (or in the same commit as the first consumer).

**Commit scope:**
- One logical change per commit. A commit that touches the API service, the hook, the component, and the page is four logical changes — split it.
- Exception: if a refactor requires simultaneous changes across multiple files to stay non-broken (e.g., renaming a prop in a component and all its callers), those files belong in the same commit.

**Commit message format:**
- Subject line: imperative mood, present tense — `add`, `fix`, `refactor`, not `added`, `fixing`
- Prefix with a type: `feat:` / `fix:` / `refactor:` / `deps:` / `docs:` / `chore:`
- Subject line must be 72 characters or fewer
- No trailing period on the subject line

**Commit authorship:**
- All commits must be authored under the project owner's Git identity — never under an AI agent's name or email.
- Do not add `Co-Authored-By` trailers for AI agents. The commit history belongs to the developer.
- Verify with `git config user.name` and `git config user.email` before committing if there is any doubt.

**What must never be in a commit:**
- `console.log` or debugging statements
- Commented-out code
- Broken imports (a file importing a module that does not yet exist)
- Files that cause a build or lint error

---

## 16. Future Growth Considerations

### User Tier Feature Gating
The `user_tier` field exists on the User entity. When feature gating is introduced:
- Create a `usePermissions` hook that reads `user.user_tier` from `AuthContext`
- Gate UI elements through that hook — never via inline `user.user_tier === 'PREMIUM'` checks scattered through components
- This should be a single, localized change

### Scaling Features
- Keep features decoupled — no feature folder should import from another feature folder
- Shared logic between features goes into `src/hooks/` or `src/utils/`
- As the Topic entity grows (e.g., flashcards, study sessions), create sub-features inside `features/topics/`

### Scaling Teams
- Each feature in `src/features/` is independently ownable by a developer or pair
- `src/api/` is the single source of truth for backend contract changes — update the matching service file when the backend changes

### Managing Technical Debt
- `App.jsx` and `main.jsx` should remain minimal: providers and routing only, no business logic
- Any component over 200 lines is a refactor candidate
- Do not add a library dependency without documenting the rationale in Section 2

---

*Last updated: 2026-06-08*
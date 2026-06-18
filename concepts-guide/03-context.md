# 03 — Context

## The Problem Context Solves

Props flow down the tree. That works fine for one or two levels, but consider auth state: the Axios interceptor needs the token, `ProtectedRoute` needs `isAuthenticated`, and `SideNav` might need the user's name. These components are spread across completely different branches of the tree. Passing auth props through every intermediate component just to reach the deep ones is called **prop drilling**, and it's painful to maintain.

Context is React's solution: put data in a shared store that any component in the tree can read directly, without involving intermediate components.

**Spring analogy:** Think of Context like Spring's `ApplicationContext` — a container that holds a singleton bean (`AuthContext`) which any class can inject without the calling chain having to pass it manually. `createContext` defines the bean shape. `AuthProvider` instantiates and provides it. `useContext(AuthContext)` is the `@Autowired`.

---

## How Context works — three parts

### 1. Create the context (define the shape)

```jsx
// src/context/AuthContext.jsx
export const AuthContext = createContext({
  token: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});
```

`createContext` creates the context object. The argument is the **default value** — only used if a component reads the context without a Provider above it in the tree (almost never the intended use; it's there as a fallback).

### 2. Provide it (publish the value)

```jsx
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));

  const login = useCallback((accessToken) => {
    localStorage.setItem('accessToken', accessToken);
    setToken(accessToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

`AuthProvider` is a component that wraps its children in `AuthContext.Provider`. The `value` prop is the actual data any consumer will receive. Because `token` is state (`useState`), any change to it (via `login` or `logout`) triggers a re-render of every component that reads this context.

`!!token` converts the token string to a boolean (`null` → `false`, a string → `true`).

### 3. Consume it (read the value)

```jsx
// src/hooks/useAuth.js
export function useAuth() {
  return useContext(AuthContext);
}
```

`useContext(AuthContext)` reads the nearest `AuthContext.Provider` above it in the tree and returns its `value`. Wrapped in a custom hook so components import `useAuth` instead of knowing about the context directly.

```jsx
// Usage in ProtectedRoute:
const { isAuthenticated } = useAuth();

if (!isAuthenticated) {
  return <Navigate to="/login" state={{ from: location }} replace />;
}
```

---

## Where Provider lives in the tree

```jsx
// App.jsx
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>       ← provides auth to everything below
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
```

`AuthProvider` wraps the entire router, so every page and component in the app can call `useAuth()` and get the current auth state.

---

## Provider nesting in main.jsx

```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>   ← React Query context
      <ThemeProvider theme={theme}>              ← MUI theme context
        <CssBaseline />
        <App />                                  ← AuthProvider is inside App
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
```

Every Provider here is the same pattern: a component that holds some shared value and makes it available to everything it wraps. `QueryClientProvider` provides the React Query cache. `ThemeProvider` provides the MUI color/spacing tokens. `AuthProvider` provides auth state. Each is independent.

---

## When NOT to use Context

Context is not a general-purpose state store. The rule in this project:

- **Auth state** → Context (needed by interceptor, router guard, nav — three separate tree branches).
- **Server data** (topics list, subjects list) → React Query (not Context).
- **Local UI state** (is this modal open, what's typed in this field) → `useState` inside the component.

If you put server data in Context, you own the caching, loading states, and refetch logic manually. React Query does all of that for you. Keep them separate.

---

## Re-render behavior

When the `value` passed to a Provider changes, **every component that consumes that context re-renders**. This is why `login` and `logout` are wrapped in `useCallback` — if they were plain arrow functions, a new function reference would be created on every render of `AuthProvider`, which would make the context value "change" on every render and cause unnecessary re-renders in every consumer.

With `useCallback(fn, [])`, the function references are stable. The context value only changes when `token` changes (i.e., on actual login/logout), which is exactly when re-renders should happen.

# 04 — React Query (Server State)

## Why React Query exists

Fetching data with plain `useEffect` + `useState` leaves you responsible for:
- Tracking loading and error states manually.
- Preventing duplicate requests for the same data.
- Deciding when cached data is stale and refetching.
- Invalidating cached data after a mutation.
- Handling race conditions when components unmount mid-fetch.

React Query is a library that handles all of this. You declare *what* data you need; it manages *how and when* to fetch it.

**Spring analogy:** React Query is like a Spring `@Service` layer backed by an in-memory `@Cacheable` store. You call `useTopics()` the same way you'd inject a `TopicService` bean. The library figures out whether to hit the repository (API) or return cached data.

---

## Setup

```jsx
// main.jsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,  // cached data stays fresh for 1 minute
      retry: 1,           // retry failed requests once
    },
  },
});

<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

`QueryClient` is the cache. `QueryClientProvider` makes it available to every component below via context (same pattern as `AuthProvider`). There is one shared cache for the entire app.

---

## useQuery — reading data

```jsx
// src/features/topics/hooks/useTopics.js
export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: getTopics,
  });
}
```

```jsx
// Usage in TopicsPage:
const { data: topics = [], isLoading, isError } = useTopics();
```

### queryKey

The key is an array that uniquely identifies this query in the cache. `['topics']` means "the full topic list." If you wanted a single topic by ID, you'd use `['topics', id]`.

React Query uses the key to:
- Deduplicate concurrent requests (if two components call `useTopics()` at the same time, only one HTTP request is made).
- Know which cached entry to invalidate after a mutation.
- Decide if data is stale and needs refetching.

### queryFn

The function that actually fetches data. Must return a Promise. In this project it's always a service function from `src/api/`:

```jsx
// src/api/topicService.js
export const getTopics = () =>
  apiClient.get('/topic/').then((res) => res.data);
```

The service function calls Axios, which returns a Promise. React Query calls this function, waits for the Promise, and stores the result in the cache under `['topics']`.

### What useQuery returns

```jsx
const {
  data,       // the resolved value (undefined until the first fetch completes)
  isLoading,  // true on the very first fetch (no cached data yet)
  isError,    // true if queryFn threw or rejected
  error,      // the error object
  isFetching, // true whenever a fetch is in-flight (including refetches)
} = useQuery({ ... });
```

In `TopicsPage`:

```jsx
const { data: topics = [], isLoading, isError } = useTopics();
// data: topics = []  ← rename `data` to `topics`, default to [] if undefined
```

The `= []` default prevents `topics.map(...)` from throwing while the first fetch is in-flight.

---

## useMutation — writing data

Mutations are for create, update, and delete operations. They don't run automatically — you call `.mutate()` or `.mutateAsync()` explicitly.

```jsx
// src/features/topics/hooks/useTopicMutations.js
export function useTopicMutations() {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: updateTopic,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics'] }),
  });

  const remove = useMutation({
    mutationFn: (id) => deleteTopic(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics'] }),
  });

  return { update, remove };
}
```

### mutationFn

Same idea as `queryFn` — a function that returns a Promise. React Query calls it when you trigger the mutation.

### onSuccess and cache invalidation

After a successful update or delete, `queryClient.invalidateQueries({ queryKey: ['topics'] })` tells React Query that any cached data with the key `['topics']` is now stale. React Query immediately refetches it in the background. This is how the topic list stays in sync without you manually updating it.

**Analogy:** Like calling `@CacheEvict` on a Spring service method — after writing, the cache entry is cleared so the next read fetches fresh data.

### Calling a mutation

```jsx
// In TopicDetailPanel:
const { update, remove } = useTopicMutations();

const handleSave = async () => {
  setError(null);
  try {
    await update.mutateAsync(buildPayload());
    onClose();
  } catch (err) {
    setError(getErrorMessage(err));
  }
};
```

- `update.mutateAsync(payload)` — triggers the mutation, returns a Promise. Throws on failure (use with `try/catch`).
- `update.mutate(payload)` — triggers the mutation but doesn't return a Promise (use `onError` callback instead).
- `update.isPending` — `true` while the request is in-flight. Used to disable the Save button.

---

## The full data flow

```
User opens TopicsPage
  → useTopics() called
  → React Query checks cache for ['topics']
  → Cache miss (first load) → calls getTopics()
  → getTopics() → Axios GET /topic/ → Spring Boot → JSON response
  → React Query stores result in cache under ['topics']
  → TopicsPage re-renders with topic data

User edits a topic and clicks Save
  → update.mutateAsync(payload) called
  → calls updateTopic(payload) → Axios PUT /topic/ → Spring Boot
  → onSuccess: invalidateQueries(['topics'])
  → React Query marks ['topics'] as stale, refetches getTopics()
  → TopicsPage re-renders with updated data
```

---

## staleTime and caching

```js
staleTime: 60_000  // 1 minute
```

For 60 seconds after a fetch, the cached data is considered "fresh." If another component mounts and calls `useTopics()` during that window, React Query returns the cached data immediately without a network request.

After 60 seconds, the data is "stale." React Query still returns the cached data immediately (no loading spinner) but triggers a background refetch. The component re-renders once the fresh data arrives. This is why most of the time the UI feels instant — you see cached data while the update happens silently in the background.

import { createContext, useState, useCallback } from 'react';

export const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

// Decodes the JWT payload (base64url) without verifying the signature.
// The payload is already readable in DevTools — this just makes it usable in React.
// Maps common Spring Boot JWT claim names to a stable user shape.
function parseUser(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.userId ?? payload.id ?? payload.sub,
      name: payload.name ?? null,
      email: payload.email ?? payload.sub ?? null,
      user_tier: payload.user_tier ?? payload.userTier ?? null,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));
  const [user, setUser] = useState(() => parseUser(localStorage.getItem('accessToken')));

  const login = useCallback((accessToken) => {
    localStorage.setItem('accessToken', accessToken);
    setToken(accessToken);
    setUser(parseUser(accessToken));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

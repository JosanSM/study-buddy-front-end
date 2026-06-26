import { createContext, useState, useCallback } from 'react';

export const AuthContext = createContext({
  token: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));


  //TODO: add an event listener to local storage so that if anyone changes the token, it gets reflected in other places/tabs
  const login = useCallback((accessToken) => {
    //TODO: we risk XSS by storing token in local storage
    localStorage.setItem('accessToken', accessToken);
    setToken(accessToken);
  }, []);

  const logout = useCallback(() => {
    //TODO: The only way to revoke credentials is by clicking "log out", so a stolen token will be exposed until it expires
    localStorage.removeItem('accessToken');
    setToken(null);
  }, []);


  //TODO: isAuthenticated will be true if a badActor puts a random token in localStorage since it just checks if its non empty.
  // at a minimum, check the token's expiry to see if its valid or not and then let your apis handle the checks if the token is real or not.
  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
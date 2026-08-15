import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../api/resources";
import { getErrorMessage } from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("paynest_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("paynest_token"));
  const [loading, setLoading] = useState(true);

  const persist = (nextToken, nextUser) => {
    if (nextToken) localStorage.setItem("paynest_token", nextToken);
    if (nextUser) localStorage.setItem("paynest_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data.user);
      localStorage.setItem("paynest_user", JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      return null;
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      if (localStorage.getItem("paynest_token")) {
        await refreshUser();
      }
      setLoading(false);
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async ({ identifier, password }) => {
    try {
      const { data } = await authApi.login({ identifier, password });
      persist(data.token, data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    }
  };

  const register = async (payload) => {
    try {
      const { data } = await authApi.register(payload);
      persist(data.token, data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    }
  };

  const logout = () => {
    localStorage.removeItem("paynest_token");
    localStorage.removeItem("paynest_user");
    setToken(null);
    setUser(null);
  };

  const updateLocalUser = (patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem("paynest_user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        refreshUser,
        updateLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

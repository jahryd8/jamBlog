import React, { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import API from '../api/axios';

interface User {
  id: string | number;
  username: string;
  email: string;
  display_name?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await API.get('/auth/me');
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } catch (err: any) {
        console.error('Session restoration failed:', err);

        // Only kick user out if token is invalid or expired (401/403)
        // Keep state intact on server errors (500)
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  const login = async (emailOrUsername: string, password: string) => {
    const { data } = await API.post('/auth/login', { emailOrUsername, password });
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }
    
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    }

    return data;
  };

  const register = async (userData: any) => {
    const { data } = await API.post('/auth/register', userData);
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }
    
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    }

    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
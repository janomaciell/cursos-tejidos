import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authAPI } from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp > currentTime) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } else {
          logout();
        }
      } catch (error) {
        console.error('Error al verificar token:', error);
        logout();
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const data = await authAPI.login({ email, password });
      
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
      setIsAuthenticated(true);
      
      return { success: true, user: data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      return { success: false, error: message };
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      const data = await authAPI.google(credential);

      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));

      setUser(data.user);
      setIsAuthenticated(true);

      return { success: true, user: data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión con Google';
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authAPI.register(userData);

      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));

      setUser(data.user);
      setIsAuthenticated(true);

      return { success: true, user: data.user };
    } catch (error) {
      // La API devuelve serializer.errors: { campo: ["mensaje"] } o string
      const data = error.response?.data;
      let message = data?.message || 'Error al registrarse';
      if (data && typeof data === 'object' && !data.message) {
        const parts = [];
        for (const [field, msgs] of Object.entries(data)) {
          const text = Array.isArray(msgs) ? msgs.join(' ') : msgs;
          if (text) parts.push(text);
        }
        if (parts.length) message = parts.join('. ');
      }
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
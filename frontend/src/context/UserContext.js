import React, { createContext, useState, useContext, useCallback } from 'react';
import api from '../services/api';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const register = async ({ username, email, password, display_name }) => {
    const response = await api.register({ username, email, password, display_name });
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const login = async ({ identifier, password }) => {
    const response = await api.login({ identifier, password });
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clean up legacy keys
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setUser(null);
  }, []);

  const updateProfile = async (data) => {
    const response = await api.updateProfile(data);
    const updatedUser = response.data.user;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  };

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Check legacy localStorage
      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username');
      if (userId && username) {
        setUser({ id: parseInt(userId), username });
      }
      setLoading(false);
      return;
    }
    try {
      const response = await api.getMe();
      const userData = response.data.user;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const isAuthenticated = !!user && !!localStorage.getItem('token');

  return (
    <UserContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      register,
      login,
      logout,
      updateProfile,
      refreshUser,
    }}>
      {children}
    </UserContext.Provider>
  );
};

import React, { createContext, useState, useContext } from 'react';
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
  const [loading, setLoading] = useState(false);

  const createUser = async (username) => {
    setLoading(true);
    try {
      const response = await api.createUser(username);
      setUser(response.data);
      localStorage.setItem('userId', response.data.id);
      localStorage.setItem('username', response.data.username);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadUser = () => {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    if (userId && username) {
      setUser({ id: parseInt(userId), username });
    }
  };

  React.useEffect(() => {
    loadUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, createUser, loading, loadUser }}>
      {children}
    </UserContext.Provider>
  );
};






import React, { createContext, useState, useEffect, useContext } from 'react';
import { getStoredToken, setStoredToken, removeStoredToken } from '../services/api';

const AuthContext = createContext({
  user: null,
  userToken: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  signUp: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await getStoredToken();
        if (token) {
          setUserToken(token);
          setUser({ email: 'student@examsphere.io', role: 'student', name: 'Exam Candidate' });
        }
      } catch (e) {
        console.warn('Failed to restore token', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const signIn = async (token = 'demo_jwt_token_examsphere', userData = null) => {
    await setStoredToken(token);
    setUserToken(token);
    setUser(userData || { email: 'student@examsphere.io', role: 'student', name: 'Exam Candidate' });
  };

  const signOut = async () => {
    await removeStoredToken();
    setUserToken(null);
    setUser(null);
  };

  const signUp = async (token = 'demo_jwt_token_examsphere', userData = null) => {
    await signIn(token, userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userToken,
        isLoading,
        signIn,
        signOut,
        signUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;

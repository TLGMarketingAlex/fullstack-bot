// src/contexts/AuthContext.jsx
import  { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';

// Create context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  const navigate = useNavigate();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // Set token in axios header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get current user
          const response = await api.get('/auth/me');
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Authentication check failed:', error);
          // Clear invalid token
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [token]);

  // Login function
  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Save token
      const { accessToken } = response.data;
      localStorage.setItem('token', accessToken);
      setToken(accessToken);
      
      // Set user data
      setUser(response.data.user);
      setIsAuthenticated(true);
      
      // Return success
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      
      // Format error message
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
      
      // Return error
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      toast.success('Registration successful! Please check your email to verify your account.');
      
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      
      // Format error message
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Logout function
  const logout = () => {
    // Clear token
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Remove token from axios header
    delete api.defaults.headers.common['Authorization'];
    
    // Redirect to login
    navigate('/login');
  };

  // Request password reset
  const requestPasswordReset = async (email) => {
    try {
      await api.post('/auth/request-password-reset', { email });
      
      return { success: true };
    } catch (error) {
      console.error('Password reset request failed:', error);
      
      // Even if the email doesn't exist, we don't want to reveal that
      return { success: true };
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      
      return { success: true };
    } catch (error) {
      console.error('Password reset failed:', error);
      
      // Format error message
      const errorMessage = error.response?.data?.error || 'Password reset failed. Please try again.';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      // Update user in state
      setUser(response.data.user);
      
      return { success: true };
    } catch (error) {
      console.error('Profile update failed:', error);
      
      // Format error message
      const errorMessage = error.response?.data?.error || 'Profile update failed. Please try again.';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      await api.put('/auth/change-password', passwordData);
      
      return { success: true };
    } catch (error) {
      console.error('Password change failed:', error);
      
      // Format error message
      const errorMessage = error.response?.data?.error || 'Password change failed. Please try again.';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Check if user is editor or admin
  const isEditor = user?.role === 'editor' || user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isAdmin,
        isEditor,
        login,
        register,
        logout,
        requestPasswordReset,
        resetPassword,
        updateProfile,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

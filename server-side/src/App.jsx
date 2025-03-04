// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Authentication context provider
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import {Dashboard} from './pages/Dashboard';
import ContentList from './pages/ContentList';
/* import ContentEditor from './pages/ContentEditor'; */
import TemplateList from './pages/TemplateList';
import TemplateEditor from './pages/TemplateEditor';
import GenerationHistory from './pages/GenerationHistory';
import IntegrationList from './pages/IntegrationList';
import IntegrationSettings from './pages/IntegrationSettings';
import CreditPurchase from './pages/CreditPurchase';
import UserSettings from './pages/UserSettings';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import NotFound from './pages/NotFound';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Admin route component
const AdminRoute = ({ children }) => {
  const { isAdmin, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Redirect to dashboard if not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth routes */}
            <Route path="/" element={<AuthLayout />}>
              <Route index element={<Navigate to="/login" />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password/:token" element={<ResetPassword />} />
              <Route path="verify-email/:token" element={<VerifyEmail />} />
            </Route>

            {/* Main app routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Content routes */}
              <Route path="content" element={<ContentList />} />
        {/*       <Route path="content/new" element={<ContentEditor />} />
              <Route path="content/:id" element={<ContentEditor />} /> */}
              
              {/* Template routes */}
              <Route path="templates" element={<TemplateList />} />
              <Route path="templates/new" element={<TemplateEditor />} />
              <Route path="templates/:id" element={<TemplateEditor />} />
              
              {/* Generation history */}
              <Route path="generations" element={<GenerationHistory />} />
              
              {/* Integrations */}
              <Route path="integrations" element={<IntegrationList />} />
              <Route path="integrations/:type/settings" element={<IntegrationSettings />} />
              <Route path="integrations/:type/settings/:id" element={<IntegrationSettings />} />
              
              {/* Credits */}
              <Route path="credits/buy" element={<CreditPurchase />} />
              
              {/* User settings */}
              <Route path="settings" element={<UserSettings />} />
              
              {/* Admin routes */}
              <Route
                path="admin/*"
                element={
                  <AdminRoute>
                    <Routes>
                      <Route path="users" element={<div>Admin Users</div>} />
                      <Route path="analytics" element={<div>Admin Analytics</div>} />
                      <Route path="system-settings" element={<div>System Settings</div>} />
                    </Routes>
                  </AdminRoute>
                }
              />
            </Route>

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              borderRadius: '8px',
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
// src/layouts/AuthLayout.jsx
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const AuthLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - Auth form */}
      <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="w-full max-w-sm mx-auto lg:w-96">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              AI Content Platform
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Generate and manage AI-powered content with ease
            </p>
          </div>

          <div className="mt-8">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Right side - Image or promotional content */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 flex flex-col justify-center items-center bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="max-w-2xl px-8 text-center text-white">
            <h1 className="text-4xl font-bold">Create AI-powered content at scale</h1>
            <p className="mt-4 text-xl">
              Automate your content creation with our powerful AI platform. Generate articles, product descriptions, and social media posts in seconds.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-white bg-opacity-10 rounded-lg">
                <h3 className="text-3xl font-bold">10x</h3>
                <p className="mt-2">Faster content creation</p>
              </div>
              <div className="p-4 bg-white bg-opacity-10 rounded-lg">
                <h3 className="text-3xl font-bold">50%</h3>
                <p className="mt-2">Cost reduction</p>
              </div>
              <div className="p-4 bg-white bg-opacity-10 rounded-lg">
                <h3 className="text-3xl font-bold">100+</h3>
                <p className="mt-2">Content templates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

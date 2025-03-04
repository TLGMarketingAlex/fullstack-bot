// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import  Button  from '../components/common/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <h2 className="text-6xl font-extrabold text-gray-900">404</h2>
          <p className="mt-4 text-xl text-gray-600">Page not found</p>
          <p className="mt-2 text-gray-500">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <div className="mt-6">
            <Link to="/">
              <Button variant="primary" fullWidth icon={<FiArrowLeft />}>
                Go back home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

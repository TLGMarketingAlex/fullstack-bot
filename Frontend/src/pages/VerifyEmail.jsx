// src/pages/VerifyEmail.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiCheck, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';
import  Button  from '../components/common/Button';
import  LoadingSpinner  from '../components/common/LoadingSpinner';

const VerifyEmail = () => {
  const { token } = useParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerifying(false);
        setError('Invalid verification token');
        return;
      }

      try {
        await api.get(`/auth/verify-email/${token}`);
        setVerified(true);
        toast.success('Email verified successfully!');
      } catch (error) {
        console.error('Email verification error:', error);
        setError(error.response?.data?.error || 'Email verification failed. The token may be invalid or expired.');
        toast.error('Email verification failed');
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [token]);

  // Loading state
  if (verifying) {
    return (
      <div className="text-center p-6">
        <LoadingSpinner size="lg" message="Verifying your email..." />
      </div>
    );
  }

  // Success state
  if (verified) {
    return (
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <FiCheck className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="mt-3 text-lg font-medium text-gray-900">Email verified</h3>
        <p className="mt-2 text-sm text-gray-500">
          Your email has been verified successfully. You can now log in to your account.
        </p>
        <div className="mt-6">
          <Link to="/login">
            <Button variant="primary" fullWidth>
              Log in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
        <FiAlertCircle className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="mt-3 text-lg font-medium text-gray-900">Verification failed</h3>
      <p className="mt-2 text-sm text-gray-500">
        {error}
      </p>
      <div className="mt-6">
        <Link to="/login">
          <Button variant="primary" fullWidth>
            Back to login
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;

// src/pages/ResetPassword.jsx
import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import { FiKey, FiCheck } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import  Button  from '../components/common/Button';

// Validation schema
const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const { token } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  // Handle form submission
  const handleSubmit = async (values) => {
    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await resetPassword(token, values.password);
      
      if (result.success) {
        setResetComplete(true);
        toast.success('Password reset successfully!');
      } else {
        toast.error(result.error || 'Password reset failed');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display success message after reset
  if (resetComplete) {
    return (
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <FiCheck className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="mt-3 text-lg font-medium text-gray-900">Password reset complete</h3>
        <p className="mt-2 text-sm text-gray-500">
          Your password has been reset successfully. You can now login with your new password.
        </p>
        <div className="mt-6">
          <Link to="/login">
            <Button variant="primary" fullWidth>
              Go to login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Reset your password</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your new password below
        </p>
      </div>

      <Formik
        initialValues={{ password: '', confirmPassword: '' }}
        validationSchema={ResetPasswordSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New password
              </label>
              <div className="mt-1">
                <Field
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.password && touched.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-600" />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <div className="mt-1">
                <Field
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.confirmPassword && touched.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                <ErrorMessage name="confirmPassword" component="div" className="mt-1 text-sm text-red-600" />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                fullWidth
                isLoading={isSubmitting}
                disabled={isSubmitting}
                icon={<FiKey />}
              >
                Reset password
              </Button>
            </div>
          </Form>
        )}
      </Formik>

      <div className="mt-6 text-center">
        <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;

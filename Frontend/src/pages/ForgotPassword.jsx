// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import  Button  from '../components/common/Button';

// Validation schema
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const ForgotPassword = () => {
  const { requestPasswordReset } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Handle form submission
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    
    try {
      await requestPasswordReset(values.email);
      setSubmitted(true);
      toast.success('If your email exists in our system, you will receive a password reset link');
    } catch (error) {
      console.error('Password reset request error:', error);
      // Don't reveal whether the email exists or not
      setSubmitted(true);
      toast.success('If your email exists in our system, you will receive a password reset link');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display success message after submission
  if (submitted) {
    return (
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <FiMail className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="mt-3 text-lg font-medium text-gray-900">Check your email</h3>
        <p className="mt-2 text-sm text-gray-500">
          We've sent a link to reset your password. Please check your email and follow the instructions.
        </p>
        <div className="mt-6">
          <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Return to login
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
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <Formik
        initialValues={{ email: '' }}
        validationSchema={ForgotPasswordSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <Field
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.email && touched.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                fullWidth
                isLoading={isSubmitting}
                disabled={isSubmitting}
                icon={<FiMail />}
              >
                Send reset link
              </Button>
            </div>
          </Form>
        )}
      </Formik>

      <div className="mt-6 text-center">
        <Link to="/login" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
          <FiArrowLeft className="mr-1" /> Back to login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;

// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { User, CreditAccount } = require('../db/models');
const logger = require('../utils/logger');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const config = require('../config/auth');

// Generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    }, 
    config.jwtSecret, 
    { expiresIn: config.jwtExpiresIn }
  );
};

// Generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id }, 
    config.refreshTokenSecret, 
    { expiresIn: config.refreshTokenExpiresIn }
  );
};

// Register new user
exports.register = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists with this email' 
      });
    }

    // Generate verification token
    const verificationToken = uuidv4();

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      verificationToken
    });

    // Create credit account for the user
    await CreditAccount.create({
      userId: user.id,
      planType: 'basic',
      creditsRemaining: 1000, // Default credits for new users
      monthlyAllowance: 1000,
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    // Remove sensitive data before sending response
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: 'User registered successfully. Please verify your email.',
      user: userResponse
    });
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

// Verify email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Find user with this verification token
    const user = await User.findOne({ where: { verificationToken: token } });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Update user
    user.emailVerified = true;
    user.verificationToken = null;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    logger.error('Email verification error:', error);
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({ 
        error: 'Email not verified. Please check your inbox and verify your email.'
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(401).json({ 
        error: 'Your account is not active. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user info and access token
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      accessToken
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

// Refresh token
exports.refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token not found' });
    }

    // Verify refresh token
    jwt.verify(refreshToken, config.refreshTokenSecret, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      // Find user
      const user = await User.findByPk(decoded.id);
      
      if (!user || user.status !== 'active') {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      // Generate new access token
      const accessToken = generateAccessToken(user);

      res.status(200).json({
        accessToken
      });
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    next(error);
  }
};

// Logout user
exports.logout = (req, res) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out successfully' });
};

// Request password reset
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    
    // Don't reveal if user exists or not for security
    if (!user) {
      return res.status(200).json({ 
        message: 'If your email is registered, you will receive a password reset link' 
      });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Send password reset email
    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({ 
      message: 'If your email is registered, you will receive a password reset link' 
    });
  } catch (error) {
    logger.error('Password reset request error:', error);
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Find user with this reset token
    const user = await User.findOne({ 
      where: { 
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      } 
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update user password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    logger.error('Password reset error:', error);
    next(error);
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find user with credit account
    const user = await User.findByPk(userId, {
      include: [
        { model: CreditAccount, as: 'creditAccount' }
      ],
      attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      user
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName } = req.body;

    // Find user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Find user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await user.checkPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    next(error);
  }
};

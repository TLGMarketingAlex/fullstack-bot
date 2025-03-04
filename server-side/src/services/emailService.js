// src/services/emailService.js
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.init();
  }

  /**
   * Initialize the email service
   */
  init() {
    try {
      // Check if SMTP settings are provided
      if (
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      ) {
        // Create transporter
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        this.initialized = true;
        logger.info('Email service initialized');
      } else {
        logger.warn('Email service not configured. Missing SMTP settings.');
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  /**
   * Send an email
   * @param {object} options - Email options
   * @returns {Promise<boolean>} Success status
   */
  async sendEmail(options) {
    try {
      // Check if service is initialized
      if (!this.initialized) {
        logger.warn('Attempted to send email, but email service is not initialized');
        return false;
      }

      // Set from address
      const from = process.env.SMTP_FROM || 'no-reply@example.com';

      // Send email
      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      });

      logger.info('Email sent successfully', { messageId: info.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send verification email
   * @param {string} email - Recipient email
   * @param {string} token - Verification token
   * @returns {Promise<boolean>} Success status
   */
  async sendVerificationEmail(email, token) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/verify-email/${token}`;

    const options = {
      to: email,
      subject: 'Verify your email address',
      text: `Welcome to AI Content Platform! Please verify your email address by clicking on the following link: ${verificationLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to AI Content Platform!</h2>
          <p>Thank you for signing up. Please verify your email address by clicking on the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
          </div>
          <p>If the button doesn't work, you can also click on the link below or copy and paste it into your browser:</p>
          <p><a href="${verificationLink}">${verificationLink}</a></p>
          <p>If you didn't sign up for an account, you can safely ignore this email.</p>
        </div>
      `
    };

    return this.sendEmail(options);
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} token - Reset token
   * @returns {Promise<boolean>} Success status
   */
  async sendPasswordResetEmail(email, token) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password/${token}`;

    const options = {
      to: email,
      subject: 'Reset your password',
      text: `You requested a password reset. Please click on the following link to reset your password: ${resetLink}. This link will expire in 1 hour.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Please click on the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If the button doesn't work, you can also click on the link below or copy and paste it into your browser:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `
    };

    return this.sendEmail(options);
  }

  /**
   * Send generation completion notification
   * @param {string} email - Recipient email
   * @param {object} data - Generation data
   * @returns {Promise<boolean>} Success status
   */
  async sendGenerationCompleteEmail(email, data) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const contentLink = `${frontendUrl}/content/${data.contentItemId}`;

    const options = {
      to: email,
      subject: 'Your content has been generated',
      text: `Your content "${data.title}" has been successfully generated. You can view it here: ${contentLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Content Generation Complete</h2>
          <p>Your content has been successfully generated!</p>
          <div style="background-color: #f5f5f5; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Title:</strong> ${data.title}</p>
            <p style="margin: 5px 0 0;"><strong>Word Count:</strong> ${data.wordCount}</p>
            <p style="margin: 5px 0 0;"><strong>Credits Used:</strong> ${data.creditsUsed}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${contentLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Content</a>
          </div>
        </div>
      `
    };

    return this.sendEmail(options);
  }
}

// Export a singleton instance
module.exports = new EmailService();

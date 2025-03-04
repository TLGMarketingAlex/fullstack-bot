// backend/tests/unit/services/creditService.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const { creditService, estimateGenerationCost } = require('../../../src/services/creditService');
const { CreditAccount, User } = require('../../../src/db/models');

describe('Credit Service', () => {
  let sandbox;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
  describe('estimateGenerationCost', () => {
    it('should calculate cost based on word count', () => {
      const promptData = { wordCount: 1000 };
      const contentType = 'blog';
      
      const cost = estimateGenerationCost(promptData, contentType);
      
      expect(cost).to.equal(1000);
    });
    
    it('should apply content type multiplier', () => {
      const promptData = { wordCount: 1000 };
      
      const blogCost = estimateGenerationCost(promptData, 'blog'); // Multiplier: 1
      const socialCost = estimateGenerationCost(promptData, 'social'); // Multiplier: 0.5
      
      expect(socialCost).to.be.lessThan(blogCost);
    });
    
    it('should apply SEO optimization multiplier', () => {
      const promptData = { wordCount: 1000, seoOptimize: true };
      const contentType = 'blog';
      
      const cost = estimateGenerationCost(promptData, contentType);
      
      expect(cost).to.be.greaterThan(1000);
    });
    
    it('should ensure minimum cost', () => {
      const promptData = { wordCount: 10 };
      const contentType = 'social';
      
      const cost = estimateGenerationCost(promptData, contentType);
      
      expect(cost).to.be.at.least(100); // Minimum cost
    });
  });
  
  describe('getCreditAccount', () => {
    it('should return credit account for user', async () => {
      // Mock data
      const userId = 'test-user-id';
      const mockCreditAccount = { id: 'test-account-id', userId, creditsRemaining: 1000 };
      
      // Stub CreditAccount.findOne
      sandbox.stub(CreditAccount, 'findOne').resolves(mockCreditAccount);
      
      // Call the method
      const result = await creditService.getCreditAccount(userId);
      
      // Assertions
      expect(result).to.deep.equal(mockCreditAccount);
      expect(CreditAccount.findOne.calledWith({ where: { userId } })).to.be.true;
    });
    
    it('should throw error if credit account not found', async () => {
      // Mock data
      const userId = 'test-user-id';
      
      // Stub CreditAccount.findOne to return null
      sandbox.stub(CreditAccount, 'findOne').resolves(null);
      
      // Call the method and expect it to throw
      try {
        await creditService.getCreditAccount(userId);
        expect.fail('Expected method to throw');
      } catch (error) {
        expect(error.message).to.include('Credit account not found');
      }
    });
  });
  
  describe('hasEnoughCredits', () => {
    it('should return true if user has enough credits', async () => {
      // Mock data
      const userId = 'test-user-id';
      const mockCreditAccount = { creditsRemaining: 1000 };
      
      // Stub getCreditAccount
      sandbox.stub(creditService, 'getCreditAccount').resolves(mockCreditAccount);
      
      // Call the method
      const result = await creditService.hasEnoughCredits(userId, 500);
      
      // Assertions
      expect(result).to.be.true;
    });
    
    it('should return false if user does not have enough credits', async () => {
      // Mock data
      const userId = 'test-user-id';
      const mockCreditAccount = { creditsRemaining: 100 };
      
      // Stub getCreditAccount
      sandbox.stub(creditService, 'getCreditAccount').resolves(mockCreditAccount);
      
      // Call the method
      const result = await creditService.hasEnoughCredits(userId, 500);
      
      // Assertions
      expect(result).to.be.false;
    });
  });
  
  describe('deductCredits', () => {
    it('should deduct credits from user account', async () => {
      // Mock data
      const userId = 'test-user-id';
      const credits = 500;
      const reason = 'test-reason';
      const mockCreditAccount = { 
        creditsRemaining: 1000, 
        creditsUsed: 2000,
        save: sandbox.stub().resolves()
      };
      
      // Stub getCreditAccount
      sandbox.stub(creditService, 'getCreditAccount').resolves(mockCreditAccount);
      
      // Call the method
      const result = await creditService.deductCredits(userId, credits, reason);
      
      // Assertions
      expect(result.success).to.be.true;
      expect(result.remainingCredits).to.equal(500);
      expect(mockCreditAccount.creditsRemaining).to.equal(500);
      expect(mockCreditAccount.creditsUsed).to.equal(2500);
      expect(mockCreditAccount.save.calledOnce).to.be.true;
    });
    
    it('should throw error if not enough credits', async () => {
      // Mock data
      const userId = 'test-user-id';
      const credits = 1500;
      const reason = 'test-reason';
      const mockCreditAccount = { 
        creditsRemaining: 1000, 
        creditsUsed: 2000
      };
      
      // Stub getCreditAccount
      sandbox.stub(creditService, 'getCreditAccount').resolves(mockCreditAccount);
      
      // Call the method and expect it to throw
      try {
        await creditService.deductCredits(userId, credits, reason);
        expect.fail('Expected method to throw');
      } catch (error) {
        expect(error.message).to.equal('Insufficient credits');
      }
    });
  });
});

// backend/tests/integration/api/auth.test.js
const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const app = require('../../../src/app');
const { User, CreditAccount } = require('../../../src/db/models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

describe('Auth API', () => {
  let sandbox;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      // Mock data
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };
      
      // Mock User.findOne to return null (user doesn't exist)
      sandbox.stub(User, 'findOne').resolves(null);
      
      // Mock User.create and CreditAccount.create
      const userId = uuidv4();
      sandbox.stub(User, 'create').resolves({
        id: userId,
        ...userData,
        password: 'hashed_password',
        role: 'user',
        createdAt: new Date()
      });
      
      sandbox.stub(CreditAccount, 'create').resolves({
        userId,
        planType: 'basic',
        creditsRemaining: 1000,
        monthlyAllowance: 1000,
        renewalDate: new Date()
      });
      
      // Mock email service
      sandbox.stub(require('../../../src/services/emailService'), 'sendVerificationEmail').resolves();
      
      // Make the request
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      // Assertions
      expect(response.status).to.equal(201);
      expect(response.body.message).to.include('User registered successfully');
      expect(response.body.user).to.have.property('email', userData.email);
      expect(response.body.user).to.have.property('firstName', userData.firstName);
      expect(response.body.user).to.have.property('lastName', userData.lastName);
      expect(response.body.user).to.not.have.property('password');
    });
    
    it('should return 409 if user already exists', async () => {
      // Mock data
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User'
      };
      
      // Mock User.findOne to return an existing user
      sandbox.stub(User, 'findOne').resolves({
        id: uuidv4(),
        email: userData.email
      });
      
      // Make the request
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      // Assertions
      expect(response.status).to.equal(409);
      expect(response.body.error).to.include('User already exists');
    });
    
    it('should return 400 if validation fails', async () => {
      // Invalid data (missing password)
      const userData = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };
      
      // Make the request
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      // Assertions
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('errors');
    });
  });
  
  describe('POST /api/auth/login', () => {
    it('should login a user with valid credentials', async () => {
      // Mock data
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      // Mock User.findOne to return a user
      const mockUser = {
        id: uuidv4(),
        email: loginData.email,
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        status: 'active',
        emailVerified: true,
        checkPassword: sandbox.stub().resolves(true),
        save: sandbox.stub().resolves()
      };
      
      sandbox.stub(User, 'findOne').resolves(mockUser);
      
      // Mock JWT
      const mockToken = 'mock_jwt_token';
      sandbox.stub(jwt, 'sign').returns(mockToken);
      
      // Make the request
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      // Assertions
      expect(response.status).to.equal(200);
      expect(response.body.message).to.include('Login successful');
      expect(response.body.accessToken).to.equal(mockToken);
      expect(response.body.user).to.have.property('email', loginData.email);
      expect(response.body.user).to.not.have.property('password');
      expect(mockUser.save.calledOnce).to.be.true; // Should update last login
    });
    
    it('should return 401 with invalid credentials', async () => {
      // Mock data
      const loginData = {
        email: 'test@example.com',
        password: 'wrong_password'
      };
      
      // Mock User.findOne to return a user
      const mockUser = {
        id: uuidv4(),
        email: loginData.email,
        status: 'active',
        emailVerified: true,
        checkPassword: sandbox.stub().resolves(false)
      };
      
      sandbox.stub(User, 'findOne').resolves(mockUser);
      
      // Make the request
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      // Assertions
      expect(response.status).to.equal(401);
      expect(response.body.error).to.include('Invalid email or password');
    });
    
    it('should return 401 if email is not verified', async () => {
      // Mock data
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      // Mock User.findOne to return a user
      const mockUser = {
        id: uuidv4(),
        email: loginData.email,
        status: 'active',
        emailVerified: false,
        checkPassword: sandbox.stub().resolves(true)
      };
      
      sandbox.stub(User, 'findOne').resolves(mockUser);
      
      // Make the request
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      // Assertions
      expect(response.status).to.equal(401);
      expect(response.body.error).to.include('Email not verified');
    });
    
    it('should return 401 if account is not active', async () => {
      // Mock data
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      // Mock User.findOne to return a user
      const mockUser = {
        id: uuidv4(),
        email: loginData.email,
        status: 'suspended',
        emailVerified: true,
        checkPassword: sandbox.stub().resolves(true)
      };
      
      sandbox.stub(User, 'findOne').resolves(mockUser);
      
      // Make the request
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      // Assertions
      expect(response.status).to.equal(401);
      expect(response.body.error).to.include('account is not active');
    });
  });
});

// frontend/src/tests/components/Button.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/common/Button';

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click Me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-blue-600'); // Primary button
  });
  
  it('renders different variants', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>);
    
    let button = screen.getByRole('button', { name: /secondary/i });
    expect(button).toHaveClass('bg-gray-200');
    
    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole('button', { name: /outline/i });
    expect(button).toHaveClass('border-gray-300');
    
    rerender(<Button variant="danger">Danger</Button>);
    button = screen.getByRole('button', { name: /danger/i });
    expect(button).toHaveClass('bg-red-600');
  });
  
  it('handles different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    
    let button = screen.getByRole('button', { name: /small/i });
    expect(button).toHaveClass('px-2');
    
    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button', { name: /large/i });
    expect(button).toHaveClass('px-6');
  });
  
  it('handles clicks', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('respects disabled state', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  it('can be full width', () => {
    render(<Button fullWidth>Full Width</Button>);
    
    const button = screen.getByRole('button', { name: /full width/i });
    expect(button).toHaveClass('w-full');
  });
  
  it('can render an icon', () => {
    render(<Button icon={<span data-testid="test-icon" />}>With Icon</Button>);
    
    const button = screen.getByRole('button', { name: /with icon/i });
    const icon = screen.getByTestId('test-icon');
    
    expect(button).toContainElement(icon);
  });
});

// frontend/src/tests/hooks/useAuth.test.jsx
import { renderHook, act } from '@testing-library/react-hooks';
import { BrowserRouter } from 'react-router-dom';
import { useAuth, AuthProvider } from '../../contexts/AuthContext';
import api from '../../services/api';
import { ReactNode } from 'react';

// Mock api
jest.mock('../../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  defaults: {
    headers: {
      common: {}
    }
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value?.toString(); }),
    removeItem: jest.fn(key => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

const wrapper = ({ children }: {children: ReactNode}) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });
  
  it('should start with isAuthenticated as false', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
  
  it('should check authentication on mount if token exists', async () => {
    // Set token in localStorage
    localStorageMock.setItem('token', 'test-token');
    
    // Mock API response
    api.get.mockResolvedValueOnce({
      data: {
        user: {
          id: 'test-id',
          email: 'test@example.com',
          role: 'user'
        }
      }
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    
    // Wait for useEffect to run
    await waitForNextUpdate();
    
    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({
      id: 'test-id',
      email: 'test@example.com',
      role: 'user'
    });
  });
  
  it('should login a user successfully', async () => {
    // Mock API response
    api.post.mockResolvedValueOnce({
      data: {
        accessToken: 'test-token',
        user: {
          id: 'test-id',
          email: 'test@example.com',
          role: 'user'
        }
      }
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Call login
    let loginResult;
    await act(async () => {
      loginResult = await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      });
    });
    
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(loginResult).toEqual({ success: true });
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({
      id: 'test-id',
      email: 'test@example.com',
      role: 'user'
    });
  });
  
  it('should handle login failure', async () => {
    // Mock API error
    api.post.mockRejectedValueOnce({
      response: {
        data: {
          error: 'Invalid credentials'
        }
      }
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Call login
    let loginResult;
    await act(async () => {
      loginResult = await result.current.login({
        email: 'test@example.com',
        password: 'wrong-password'
      });
    });
    
    expect(loginResult).toEqual({
      success: false,
      error: 'Invalid credentials'
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
  
  it('should logout a user', async () => {
    // Set initial authenticated state
    localStorageMock.setItem('token', 'test-token');
    api.defaults.headers.common['Authorization'] = 'Bearer test-token';
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Manually set authenticated state for testing
    act(() => {
      // @ts-ignore - Accessing private method for testing
      result.current.setIsAuthenticated(true);
      // @ts-ignore - Accessing private method for testing
      result.current.setUser({ id: 'test-id', email: 'test@example.com' });
    });
    
    // Call logout
    act(() => {
      result.current.logout();
    });
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
  });
});

// src/layouts/MainLayout.jsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiHome, 
  FiFileText, 
  FiCopy, 
  FiRefreshCw, 
  FiLink, 
  FiCreditCard, 
  FiSettings, 
  FiLogOut,
  FiMenu,
  FiX,
  FiUser,
  FiChevronDown
} from 'react-icons/fi';

const MainLayout = () => {
  const { user, isAdmin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  // Navigation items
  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: <FiHome /> },
    { name: 'Content', path: '/content', icon: <FiFileText /> },
    { name: 'Templates', path: '/templates', icon: <FiCopy /> },
    { name: 'Generation History', path: '/generations', icon: <FiRefreshCw /> },
    { name: 'Integrations', path: '/integrations', icon: <FiLink /> },
    { name: 'Buy Credits', path: '/credits/buy', icon: <FiCreditCard /> },
    { name: 'Settings', path: '/settings', icon: <FiSettings /> },
  ];

  // Admin navigation items
  const adminNavigation = [
    { name: 'Users', path: '/admin/users', icon: <FiUser /> },
    { name: 'Analytics', path: '/admin/analytics', icon: <FiRefreshCw /> },
    { name: 'System Settings', path: '/admin/system-settings', icon: <FiSettings /> },
  ];

  // Check if a path is active
  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Toggle user menu
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:w-64 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <Link to="/dashboard" className="flex items-center">
            <span className="text-xl font-semibold">AI Content Platform</span>
          </Link>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={toggleSidebar}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Sidebar navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}

          {/* Admin section */}
          {isAdmin && (
            <div className="pt-4 mt-4 border-t">
              <h6 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin
              </h6>
              <div className="mt-2 space-y-1">
                {adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive(item.path)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Mobile menu button */}
            <button
              className="lg:hidden text-gray-500 hover:text-gray-700"
              onClick={toggleSidebar}
            >
              <FiMenu size={24} />
            </button>

            {/* User menu */}
            <div className="flex items-center ml-auto">
              <div className="relative">
                <button
                  className="flex items-center text-sm font-medium text-gray-700 focus:outline-none"
                  onClick={toggleUserMenu}
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.firstName || ''
                    )}+${encodeURIComponent(
                      user?.lastName || ''
                    )}&background=random`}
                    alt="User avatar"
                    className="h-8 w-8 rounded-full mr-2"
                  />
                  <span className="hidden md:block">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <FiChevronDown className="ml-1" />
                </button>

                {/* User dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      {user?.email}
                    </div>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleLogout}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationCenter from '../NotificationCenter';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: 'fas fa-home' },
    { name: 'Projects', href: '/projects', icon: 'fas fa-folder' },
    { name: 'Tasks', href: '/tasks', icon: 'fas fa-tasks' },
    { name: 'Reports', href: '/reports', icon: 'fas fa-chart-bar' },
    { name: 'Risk Tracker', href: '/risks', icon: 'fas fa-exclamation-triangle' },
  ];

  return (
    <nav className="bg-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 no-underline">
              <span className="text-white text-xl font-bold">Project Manager</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'text-white hover:bg-blue-500'
                    } px-3 py-2 rounded-md text-sm font-medium flex items-center no-underline hover:no-underline`}
                  >
                    <i className={`${item.icon} mr-2`}></i>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <NotificationCenter />
              <div className="ml-3 relative flex items-center">
                <span className="text-white mr-4">{user?.name || 'User'}</span>
                <button
                  onClick={handleLogout}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded no-underline"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={toggleNavbar}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-500 focus:outline-none"
            >
              <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'text-white hover:bg-blue-500'
                } block px-3 py-2 rounded-md text-base font-medium flex items-center no-underline hover:no-underline`}
                onClick={() => setIsOpen(false)}
              >
                <i className={`${item.icon} mr-2`}></i>
                {item.name}
              </Link>
            );
          })}
        </div>
        <div className="pt-4 pb-3 border-t border-blue-700">
          <div className="flex items-center px-5">
            <div className="flex-shrink-0">
              <span className="text-white">{user?.name || 'User'}</span>
            </div>
            <div className="ml-3">
              <button
                onClick={handleLogout}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded no-underline"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

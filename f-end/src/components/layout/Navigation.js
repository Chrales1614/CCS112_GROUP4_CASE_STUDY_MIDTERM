import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationCenter from '../NotificationCenter';
import {
  HomeIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Projects', href: '/projects', icon: FolderIcon },
    { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon },
    { name: 'Risk Tracker', href: '/risks', icon: ExclamationTriangleIcon },
  ];

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <span className="text-xl font-bold">Project Manager</span>
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li className="nav-item" key={item.name}>
                  <Link
                    to={item.href}
                    className={`nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}
                  >
                    <item.icon className="h-5 w-5 me-2" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="d-flex align-items-center">
            <NotificationCenter />
            <div className="ms-3 d-flex align-items-center">
              <span className="text-light me-3">{user?.name}</span>
              <button 
                onClick={handleLogout} 
                className="btn btn-outline-danger btn-sm"
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

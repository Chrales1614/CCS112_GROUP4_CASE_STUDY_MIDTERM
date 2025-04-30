import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Navigation = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };
        const userResponse = await axios.get('http://localhost:8000/api/user', { headers });
        setUser(userResponse.data);
      } catch (err) {
        setError('Failed to fetch user data');
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.removeItem('token');
      if (onLogout) {
        onLogout();
      }
      navigate('/login');
    } catch (err) {
      setError('Logout failed');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
      <div className="container">
        <Link className="navbar-brand" to="/">
          Project Management System
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
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} 
                to="/"
              >
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname.includes('/projects') ? 'active' : ''}`} 
                to="/projects"
              >
                Projects
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname.includes('/tasks') && !location.pathname.includes('/projects') ? 'active' : ''}`} 
                to="/tasks"
              >
                Tasks
              </Link>
            </li>
            <li className="nav-item d-flex align-items-center ms-3">
              <span className="navbar-text me-3">Welcome, {user?.name}</span>
              <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
      {error && <div className="text-danger mt-2 ms-3">{error}</div>}
    </nav>
  );
};

export default Navigation;

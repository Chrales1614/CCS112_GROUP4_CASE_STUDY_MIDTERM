import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch user profile to get role
        const userResponse = await axios.get('http://localhost:8000/api/user', { headers });
        setUserRole(userResponse.data.role);

        // Fetch projects (will be filtered on backend based on role)
        const projectsResponse = await axios.get('http://localhost:8000/api/projects', { headers });
        setProjects(projectsResponse.data.projects);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch projects');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) return <div className="text-center my-5">Loading projects...</div>;
  if (error) return <div className="alert alert-danger text-center">{error}</div>;
  
  return (
    <div className="project-list container mt-5">
      <h2 className="text-center mb-4 p-4 bg-light rounded">Projects</h2>
      
      {/* Only show Create Project button for admin and project manager */}
      {(userRole === 'admin' || userRole === 'project_manager') && (
        <div className="d-flex justify-content-end mb-3">
          <Link to="/projects/create" className="btn btn-primary shadow-sm">Create New Project</Link>
        </div>
      )}
      
      <div className="row">
        {projects.length === 0 ? (
          <div className="col-12 text-center">
            {userRole === 'team_member' ? (
              <p className="text-muted">You are not assigned to any projects. Projects will appear here when you are assigned to tasks within them.</p>
            ) : (
              <p className="text-muted">No projects found. {userRole === 'admin' || userRole === 'project_manager' ? 'Create a new project to get started.' : ''}</p>
            )}
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} className="col-md-4 mb-4">
              <div className="card shadow-sm h-100">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title text-primary">{project.name}</h5>
                  <p className="card-text text-muted">{project.description || 'No description available'}</p>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className={`badge bg-${getStatusBadge(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                    <small className="text-muted">
                      {project.end_date ? `Due: ${new Date(project.end_date).toLocaleDateString()}` : 'No end date'}
                    </small>
                  </div>
                  <div className="mt-auto">
                    <Link to={`/projects/${project.id}`} className="btn btn-info btn-sm me-2 shadow-sm">
                      View
                    </Link>
                    {(userRole === 'admin' || userRole === 'project_manager') && (
                      <Link to={`/projects/${project.id}/edit`} className="btn btn-warning btn-sm shadow-sm">
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'planning': return 'secondary';
    case 'active': return 'primary';
    case 'completed': return 'success';
    case 'on_hold': return 'warning';
    default: return 'info';
  }
};

export default ProjectList;

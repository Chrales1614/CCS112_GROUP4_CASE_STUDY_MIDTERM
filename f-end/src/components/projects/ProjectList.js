import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/api/projects', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProjects(response.data.projects);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch projects');
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  if (loading) return <div className="text-center my-5">Loading projects...</div>;
  if (error) return <div className="alert alert-danger text-center">{error}</div>;
  
  return (
    <div className="project-list container mt-5">
      <h2 className="text-center mb-4 p-4 bg-light rounded">Projects</h2>
      <div className="d-flex justify-content-end mb-3">
        <Link to="/projects/create" className="btn btn-primary shadow-sm">Create New Project</Link>
      </div>
      
      <div className="row">
        {projects.length === 0 ? (
          <p className="text-muted text-center">No projects found. Create a new project to get started.</p>
        ) : (
          projects.map(project => (
            <div key={project.id} className="col-md-4 mb-4">
              <div className="card shadow-sm h-100">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title text-primary">{project.name}</h5>
                  <p className="card-text text-muted">{project.description}</p>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className={`badge bg-${getStatusBadge(project.status)}`}>
                      {project.status}
                    </span>
                    <small className="text-muted">Due: {new Date(project.end_date).toLocaleDateString()}</small>
                  </div>
                  <div className="mt-auto">
                    <Link to={`/projects/${project.id}`} className="btn btn-info btn-sm me-2 shadow-sm">
                      View
                    </Link>
                    <Link to={`/projects/${project.id}/edit`} className="btn btn-warning btn-sm shadow-sm">
                      Edit
                    </Link>
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

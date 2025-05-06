import React, { useState, useEffect } from 'react';
import ProjectGanttChart from './ProjectGanttChart';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBudgetBreakdown, setShowBudgetBreakdown] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch project details
        const projectResponse = await axios.get(
          `http://localhost:8000/api/projects/${id}`,
          { headers }
        );

        // Fetch tasks for this project
        const tasksResponse = await axios.get(
          `http://localhost:8000/api/projects/${id}/tasks`,
          { headers }
        );

        setProject(projectResponse.data.project);
        setTasks(tasksResponse.data.tasks);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch project details');
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id]);

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project and all associated tasks?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate('/projects');
    } catch (err) {
      setError('Failed to delete project');
    }
  };

  if (loading) return <div>Loading project details...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!project) return <div>Project not found</div>;

  // Calculate project stats
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(task => task.status === 'completed').length,
    inProgress: tasks.filter(task => task.status === 'in_progress').length,
    todo: tasks.filter(task => task.status === 'todo').length,
    review: tasks.filter(task => task.status === 'review').length,
  };

  // Calculate weighted completion percentage considering task statuses
  const completionPercentage = taskStats.total > 0
    ? Math.round(
        (
          (taskStats.completed * 1.0) +
          (taskStats.review * 0.75) +
          (taskStats.inProgress * 0.5) +
          (taskStats.todo * 0)
        ) / taskStats.total * 100
      )
    : 0;

  // Calculate total budget from breakdown
  const totalBudget = Array.isArray(project.budget)
    ? project.budget.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0)
    : 0;

  return (
    <div className="project-detail">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{project.name}</h2>
        <div>
          <Link to="/projects" className="btn btn-secondary me-2">
            Back to Projects
          </Link>
          <Link to={`/projects/${id}/edit`} className="btn btn-warning me-2">
            Edit Project
          </Link>
          <button onClick={handleDeleteProject} className="btn btn-danger">
            Delete Project
          </button>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card mb-3">
            <div className="card-header">Project Details</div>
            <div className="card-body">
              <p><strong>Description:</strong> {project.description || 'No description provided'}</p>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Status:</strong> <span className={`badge bg-${getStatusBadge(project.status)}`}>{project.status}</span></p>
                  <p><strong>Project Manager:</strong> {project.user?.name || 'Not assigned'}</p>
                  <p><strong>Total Budget:</strong> ₱{totalBudget.toFixed(2)}</p>
                  <p><strong>Actual Expenditure:</strong> {project.actual_expenditure !== null && !isNaN(project.actual_expenditure) ? `₱${Number(project.actual_expenditure).toFixed(2)}` : 'Not set'}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Start Date:</strong> {new Date(project.start_date).toLocaleDateString()}</p>
                  <p><strong>End Date:</strong> {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">Project Progress</div>
            <div className="card-body">
              <div className="progress mb-3">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${completionPercentage}%`, transition: 'width 0.5s ease-in-out' }}
                  aria-valuenow={completionPercentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  {completionPercentage}%
                </div>
              </div>

              <div className="task-stats">
                <div className="row text-center">
                  <div className="col-3">
                    <div className="stat-item">
                      <div className="stat-value">{taskStats.todo}</div>
                      <div className="stat-label">Todo</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="stat-item">
                      <div className="stat-value">{taskStats.inProgress}</div>
                      <div className="stat-label">In Progress</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="stat-item">
                      <div className="stat-value">{taskStats.review}</div>
                      <div className="stat-label">Review</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="stat-item">
                      <div className="stat-value">{taskStats.completed}</div>
                      <div className="stat-label">Done</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
                <div className="card">
<div className="card-header d-flex justify-content-between align-items-center">
  <h5 className="mb-0">Budget Breakdown</h5>
  <button
    className="btn btn-sm btn-outline-primary"
    onClick={() => setShowBudgetBreakdown(!showBudgetBreakdown)}
  >
    {showBudgetBreakdown ? 'Hide' : 'Show'}
  </button>
</div>
{showBudgetBreakdown && (
  <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true" style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1050 }}>
    <div className="modal-dialog" role="document" style={{ marginTop: '10vh' }}>
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Budget Breakdown</h5>
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowBudgetBreakdown(false)}></button>
        </div>
        <div className="modal-body">
          {Array.isArray(project.budget) && project.budget.length > 0 ? (
            <ul>
              {project.budget.map((b, index) => (
                <li key={index}>{b.item}: ₱{parseFloat(b.amount).toFixed(2)}</li>
              ))}
            </ul>
          ) : (
            <p>No budget breakdown available.</p>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setShowBudgetBreakdown(false)}>Close</button>
        </div>
      </div>
    </div>
  </div>
)}
                </div>
              </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">Gantt Chart Visualization</div>
        <div className="card-body">
          <ProjectGanttChart tasks={tasks} />
        </div>
      </div><br></br>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Tasks</h5>
          <Link to={`/projects/${id}/tasks`} className="btn btn-primary btn-sm">
            Manage Tasks
          </Link>
        </div>
        <div className="card-body">
          {tasks.length === 0 ? (
            <p>No tasks found for this project.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assigned To</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.slice(0, 5).map(task => (
                    <tr key={task.id}>
                      <td>{task.title}</td>
                      <td>
                        <span className={`badge bg-${getStatusBadge(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td>{task.assignedUser?.name || 'Unassigned'}</td>
                      <td>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tasks.length > 5 && (
                <div className="text-center mt-2">
                  <Link to={`/projects/${id}/tasks`} className="btn btn-link">
                    View all {tasks.length} tasks
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
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
    case 'todo': return 'secondary';
    case 'in_progress': return 'primary';
    case 'review': return 'info';
    default: return 'light';
  }
};

const getPriorityBadge = (priority) => {
  switch (priority) {
    case 'low': return 'success';
    case 'medium': return 'info';
    case 'high': return 'warning';
    case 'urgent': return 'danger';
    default: return 'secondary';
  }
};

export default ProjectDetail;

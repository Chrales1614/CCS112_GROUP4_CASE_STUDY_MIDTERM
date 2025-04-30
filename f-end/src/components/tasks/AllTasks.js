import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AllTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          Authorization: `Bearer ${token}`,
        };
        const response = await axios.get('http://localhost:8000/api/tasks', { headers, timeout: 10000 });
        // Ensure assignedUser is defined for each task to avoid showing "Unassigned" incorrectly
        const tasksWithAssignedUser = response.data.tasks.map(task => ({
          ...task,
          assignedUser: task.assignedUser || null,
        }));
        setTasks(tasksWithAssignedUser);
        setLoading(false);
      } catch (err) {
        if (err.code === 'ECONNABORTED') {
          setError('Request timed out. Please try again.');
        } else if (err.response) {
          setError(`Failed to fetch tasks: ${err.response.status} ${err.response.statusText}`);
        } else {
          setError('Failed to fetch tasks. Please check your network connection.');
        }
        setLoading(false);
      }
    };
    
    fetchAllTasks();
  }, []);
  
  if (loading) return <div>Loading all tasks...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  
  return (
    
    <div className="all-tasks">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">All Tasks</h2>
        <Link to="/tasks/create" className="btn btn-primary">
          Add New Task
        </Link>
      </div>
      {tasks.length === 0 ? (
        <p>No tasks found.</p>
      ) : (
        <div className="table-responsive"><br></br>
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Title</th>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>
                    {task.project ? (
                      <Link to={`/projects/${task.project.id}`}>{task.project.name}</Link>
                    ) : 'N/A'}
                  </td>
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
                  <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}</td>
                  <td>{task.assignedUser?.name || 'Unassigned'}</td>
                  <td>
                    <Link to={`/tasks/${task.id}`} className="btn btn-info btn-sm me-1">View</Link>
                    <Link to={`/tasks/${task.id}/edit`} className="btn btn-warning btn-sm me-1">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'todo': return 'secondary';
    case 'in_progress': return 'primary';
    case 'review': return 'info';
    case 'completed': return 'success';
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

export default AllTasks;

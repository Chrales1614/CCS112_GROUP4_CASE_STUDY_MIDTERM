import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

const TaskList = () => {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [project, setProject] = useState(null);
  
  useEffect(() => {
    console.log('TaskList useEffect triggered with projectId:', projectId);
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Token:', token);
        const headers = {
          Authorization: `Bearer ${token}`,
        };
        
        // Fetch tasks for the specific project with timeout
        const tasksResponse = await axios.get(
          `http://localhost:8000/api/projects/${projectId}/tasks`,
          { headers, timeout: 10000 }
        );
        console.log('Tasks response:', tasksResponse.data);
        
        // Fetch project details with timeout
        const projectResponse = await axios.get(
          `http://localhost:8000/api/projects/${projectId}`,
          { headers, timeout: 10000 }
        );
        console.log('Project response:', projectResponse.data);
        
        setTasks(tasksResponse.data.tasks);
        setProject(projectResponse.data.project);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tasks or project:', err);
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
    
    if (projectId) {
      fetchData();
    } else {
      console.warn('No projectId provided');
      setLoading(false);
      setError('No project ID provided');
    }
  }, [projectId]);
  
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });
      
      // Update the task list after deletion
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Delete request timed out. Please try again.');
      } else if (err.response) {
        setError(`Failed to delete task: ${err.response.status} ${err.response.statusText}`);
      } else {
        setError('Failed to delete task. Please check your network connection.');
      }
    }
  };
  
  console.log('Rendering TaskList with loading:', loading, 'error:', error);
  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  
  return (
    <div className="task-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Tasks for {project?.name}</h2>
        <div>
          <Link to={`/projects/${projectId}`} className="btn btn-secondary me-2">
            Back to Project
          </Link>
          <Link to={`/projects/${projectId}/tasks/create`} className="btn btn-primary">
            Add New Task
          </Link>
        </div>
      </div>
      
      {tasks.length === 0 ? (
        <p>No tasks found for this project.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Title</th>
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
                    <span className={`badge bg-${getStatusBadge(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge bg-${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}
                  </td>
                  <td>{task.assignedUser?.name || 'Unassigned'}</td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <Link 
                        to={`/tasks/${task.id}`} 
                        className="btn btn-info"
                      >
                        View
                      </Link>
                      <Link 
                        to={`/tasks/${task.id}/edit`}
                        className="btn btn-warning"
                      >
                        Edit
                      </Link>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        Delete
                      </button>
                    </div>
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

export default TaskList;

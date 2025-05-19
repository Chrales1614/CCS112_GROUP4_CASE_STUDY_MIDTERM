import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axiosConfig';
import CommentSection from '../comments/CommentSection';
import FileUpload from '../files/FileUpload';
import './TaskDetail.css';

const API_BASE_URL = 'http://localhost:8000/api';

//this is for task details
const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTask(response.data.task);
    } catch (error) {
      console.error('Error fetching task:', error);
      setError('Failed to load task details');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const fetchFiles = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/files?task_id=${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  }, [taskId]);
  
  useEffect(() => {
    fetchTask();
  }, [fetchTask]);
  
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);
  
  const handleStatusChange = async (newStatus) => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User not authenticated');
        return;
      }
      // Send full task data for update
      const response = await axios.put(
        `${API_BASE_URL}/tasks/${taskId}`,
        {
          title: task.title,
          description: task.description,
          project_id: task.project_id,
          assigned_to: task.assigned_to,
          status: newStatus,
          priority: task.priority,
          due_date: task.due_date,
          start_date: task.start_date,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setTask(response.data.task);
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status');
    }
  };
  
  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      navigate(`/projects/${task.project_id}/tasks`);
    } catch (err) {
      setError('Failed to delete task');
    }
  };
  
  const handleFileUpload = (newFile) => {
    setFiles([...files, newFile]);
  };
  
  const handleFileDelete = async (fileId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(files.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };
  
  if (loading) return <div className="loading">Loading task details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!task) return <div className="error">Task not found</div>;
  
  return (
    <div className="task-detail">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{task.title}</h2>
        <div>
          <Link to={`/projects/${task.project_id}/tasks`} className="btn btn-secondary me-2">
            Back to Tasks
          </Link>
          <Link to={`/tasks/${taskId}/edit`} className="btn btn-warning me-2">
            Edit Task
          </Link>
          <button onClick={handleDeleteTask} className="btn btn-danger">
            Delete Task
          </button>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header">Task Details</div>
            <div className="card-body">
              <p><strong>Description:</strong></p>
              <p>{task.description || 'No description provided'}</p>
              
              <div className="row mt-4">
                <div className="col-md-6">
                  <p>
                    <strong>Project:</strong> {' '}
                    <Link to={`/projects/${task.project_id}`}>
                      {task.project?.name || `Project #${task.project_id}`}
                    </Link>
                  </p>
                  <p>
                    <strong>Status:</strong> {' '}
                    <span className={`badge bg-${getStatusBadge(task.status)}`}>
{task.status ? task.status.replace('_', ' ') : ''}
                    </span>
                  </p>
                  <p>
                    <strong>Priority:</strong> {' '}
                    <span className={`badge bg-${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>
                  </p>
                </div>
                <div className="col-md-6">
                  <p>
                    <strong>Assigned To:</strong> {' '}
                    {task.assignedUser?.name || 'Unassigned'}
                  </p>
                  <p>
                    <strong>Due Date:</strong> {' '}
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}
                  </p>
                  <p>
                    <strong>Created:</strong> {' '}
                    {new Date(task.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">Update Status</div>
            <div className="card-body">
              <div className="d-flex gap-2">
                <button
                  className={`btn ${task.status === 'todo' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                  onClick={() => handleStatusChange('todo')}
                >
                  To Do
                </button>
                <button
                  className={`btn ${task.status === 'in_progress' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleStatusChange('in_progress')}
                >
                  In Progress
                </button>
                <button
                  className={`btn ${task.status === 'review' ? 'btn-info' : 'btn-outline-info'}`}
                  onClick={() => handleStatusChange('review')}
                >
                  Review
                </button>
                <button
                  className={`btn ${task.status === 'completed' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => handleStatusChange('completed')}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">Files</div>
            <div className="card-body">
              <FileUpload
                taskId={task.id}
                onUploadComplete={handleFileUpload}
              />
              <div className="files-list">
                {files.map(file => (
                  <div key={file.id} className="file-item">
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{file.formatted_size}</span>
                    </div>
                    <div className="file-actions">
                      <a
                        href={`http://localhost:8000/api/files/${file.id}/download`}
                        className="download-button"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => handleFileDelete(file.id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="task-comments">
        <CommentSection taskId={task.id} />
      </div>
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

export default TaskDetail;

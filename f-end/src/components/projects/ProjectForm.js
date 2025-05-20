import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const ProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'planning',
    budget: [{ item: '', amount: '' }],
    actual_expenditure: '',
  });

  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState(null);
  const [budgetStatus, setBudgetStatus] = useState({ remaining: 0, percentage: 0, isValid: true });

  useEffect(() => {
    if (isEditing) {
      const fetchProject = async () => {
        try {
          setError(null);
          const token = localStorage.getItem('token');
          if (!token) {
            setError('No authentication token found. Please log in again.');
            setLoading(false);
            return;
          }

          console.log('Fetching project details for ID:', id);
          const response = await axios.get(`http://localhost:8000/api/projects/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          });

          console.log('Project details response:', response.data);

          if (!response.data.project) {
            console.error('Invalid response format:', response.data);
            throw new Error('Invalid response format: missing project data');
          }

          const project = response.data.project;
          console.log('Project data:', project);

          // Validate required fields
          if (!project.name || !project.status || !project.start_date) {
            console.error('Missing required project fields:', {
              hasName: !!project.name,
              hasStatus: !!project.status,
              hasStartDate: !!project.start_date
            });
            throw new Error('Project data is incomplete');
          }

          setFormData({
            name: project.name || '',
            description: project.description || '',
            start_date: project.start_date ? project.start_date.split('T')[0] : '',
            end_date: project.end_date ? project.end_date.split('T')[0] : '',
            status: project.status || 'planning',
            budget: Array.isArray(project.budget) && project.budget.length > 0 
              ? project.budget 
              : [{ item: '', amount: '' }],
            actual_expenditure: project.actual_expenditure !== null 
              ? project.actual_expenditure.toString() 
              : '',
          });
          setLoading(false);
        } catch (err) {
          console.error('Error fetching project details:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
            stack: err.stack
          });

          if (!navigator.onLine) {
            setError('No internet connection. Please check your network and try again.');
          } else if (err.code === 'ECONNABORTED') {
            setError('Request timed out. Please try again.');
          } else if (err.response?.status === 401) {
            setError('Authentication failed. Please log in again.');
            localStorage.removeItem('token');
            window.location.href = '/login';
          } else if (err.response?.status === 403) {
            setError('You do not have permission to edit this project.');
          } else if (err.response?.status === 404) {
            setError('Project not found.');
            navigate('/projects');
          } else if (err.response?.data?.message) {
            setError(`Failed to fetch project details: ${err.response.data.message}`);
          } else {
            setError('Failed to fetch project details. Please try again.');
          }
          setLoading(false);
        }
      };

      fetchProject();
    }
  }, [id, isEditing, navigate]);

  useEffect(() => {
    // Calculate initial budget status
    const totalBudget = formData.budget.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
    const actualExpenditureValue = formData.actual_expenditure === '' ? 0 : parseFloat(formData.actual_expenditure);
    const remaining = totalBudget - actualExpenditureValue;
    const percentage = totalBudget > 0 ? (actualExpenditureValue / totalBudget) * 100 : 0;
    
    setBudgetStatus({
      remaining,
      percentage,
      isValid: actualExpenditureValue <= totalBudget
    });
  }, [formData.budget, formData.actual_expenditure]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBudgetChange = (index, field, value) => {
    const newBudget = [...formData.budget];
    newBudget[index][field] = value;
    setFormData(prev => ({ ...prev, budget: newBudget }));
  };

  const addBudgetItem = () => {
    setFormData(prev => ({ ...prev, budget: [...prev.budget, { item: '', amount: '' }] }));
  };

  const removeBudgetItem = (index) => {
    const newBudget = formData.budget.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, budget: newBudget.length > 0 ? newBudget : [{ item: '', amount: '' }] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation: actual_expenditure should not exceed total budget
    const totalBudget = formData.budget.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
    const actualExpenditureValue = formData.actual_expenditure === '' ? null : parseFloat(formData.actual_expenditure);

    if (actualExpenditureValue !== null && actualExpenditureValue > totalBudget) {
      setError('Actual Expenditure cannot exceed the total Budget.');
      return;
    }

    // Client-side validation: total budget should not be less than actual expenditure
    if (actualExpenditureValue !== null && totalBudget < actualExpenditureValue) {
      setError('Total Budget cannot be less than Actual Expenditure.');
      return;
    }

    // Validate budget items: all items must have non-empty name and valid amount
    for (const b of formData.budget) {
      if (!b.item.trim()) {
        setError('All budget items must have a name.');
        return;
      }
      if (b.amount === '' || isNaN(parseFloat(b.amount)) || parseFloat(b.amount) < 0) {
        setError('All budget items must have a valid non-negative amount.');
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const method = isEditing ? 'put' : 'post';
      const url = isEditing
        ? `http://localhost:8000/api/projects/${id}`
        : 'http://localhost:8000/api/projects';

      await axios({
        method,
        url,
        data: {
          ...formData,
          actual_expenditure: actualExpenditureValue,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate('/projects');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(`Failed to save project: ${err.response.data.message}`);
      } else {
        setError('Failed to save project');
      }
      console.error('Project save error:', err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="project-form">
      <h2>{isEditing ? 'Edit Project' : 'Create New Project'}</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Project Name</label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            className="form-control"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <div className="row mb-3">
          <div className="col">
            <label htmlFor="start_date" className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col">
            <label htmlFor="end_date" className="form-label">End Date</label>
            <input
              type="date"
              className="form-control"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="status" className="form-label">Status</label>
          <select
            className="form-control"
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="planning">Planning</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Budget Breakdown</label>
          {formData.budget.map((b, index) => (
            <div key={index} className="d-flex mb-2 gap-2">
              <input
                type="text"
                className="form-control"
                placeholder="Item"
                value={b.item}
                onChange={(e) => handleBudgetChange(index, 'item', e.target.value)}
                required
              />
              <input
                type="number"
                className="form-control"
                placeholder="Amount"
                value={b.amount}
                onChange={(e) => handleBudgetChange(index, 'amount', e.target.value)}
                step="0.01"
                min="0"
                required
              />
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeBudgetItem(index)}
                disabled={formData.budget.length === 1}
              >
                &times;
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addBudgetItem}>
            Add Budget Item
          </button>
        </div>

        <div className="mb-3">
          <label htmlFor="actual_expenditure" className="form-label">Actual Expenditure</label>
          <input
            type="number"
            className="form-control"
            id="actual_expenditure"
            name="actual_expenditure"
            value={formData.actual_expenditure}
            onChange={handleChange}
            step="0.01"
            min="0"
          />
          <div className="form-text">
            <div className="d-flex justify-content-between">
              <span>Remaining Budget: ₱{budgetStatus.remaining?.toFixed(2)}</span>
              <span>Budget Usage: {budgetStatus.percentage?.toFixed(1)}%</span>
            </div>
            <div className="progress mt-2" style={{ height: '5px' }}>
              <div 
                className={`progress-bar ${budgetStatus.percentage > 100 ? 'bg-danger' : 'bg-success'}`}
                role="progressbar"
                style={{ width: `${Math.min(budgetStatus.percentage, 100)}%` }}
                aria-valuenow={budgetStatus.percentage}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
          </div>
          {!budgetStatus.isValid && (
            <div className="invalid-feedback d-block">
              Actual Expenditure cannot exceed the total Budget
            </div>
          )}
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary">
            {isEditing ? 'Update Project' : 'Create Project'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate('/projects')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;

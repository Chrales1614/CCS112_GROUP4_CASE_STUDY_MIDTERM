import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { useAuth } from '../contexts/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = 'http://localhost:8000/api';

const Reports = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState({
    progress: 0,
    budget: {
      allocated: 0,
      spent: 0,
      remaining: 0
    },
    tasks: {
      total: 0,
      completed: 0,
      inProgress: 0,
      review: 0,
      todo: 0
    }
  });
  const [riskMetrics, setRiskMetrics] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
    mitigated: 0,
    active: 0
  });
  const [taskTrends, setTaskTrends] = useState([]);

  useEffect(() => {
    // Fetch available projects
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        console.log('Fetching projects with token:', token); // Debug log

        const response = await fetch(`${API_BASE_URL}/reports/projects`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        console.log('Response status:', response.status); // Debug log

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          console.error('Error response:', errorData); // Debug log
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched projects:', data); // Debug log
        setProjects(data.projects || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      const fetchAllProjectData = async () => {
        let retryCount = 0;
        const maxRetries = 3;
        
        setLoading(true);
        setError(null);
        
        const attemptFetch = async () => {
          try {
            await Promise.all([
              fetchProjectData(),
              fetchRiskMetrics(),
              fetchTaskTrends()
            ]);
          } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed:`, error);
            
            if (retryCount < maxRetries) {
              retryCount++;
              // Exponential backoff
              const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
              await new Promise(resolve => setTimeout(resolve, delay));
              return attemptFetch();
            }
            
            setError(error.message);
            throw error;
          }
        };
        
        try {
          await attemptFetch();
        } catch (error) {
          console.error('All retry attempts failed:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchAllProjectData();
    }
  }, [selectedProject]);

  const fetchProjectData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching project data for project:', selectedProject); // Debug log

      const response = await fetch(`${API_BASE_URL}/reports/project/${selectedProject}/data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Project data response status:', response.status); // Debug log

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('Project data error response:', errorData); // Debug log
        
        // If unauthorized, clear token and redirect to login
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched project data:', data); // Debug log
      
      // Validate the data structure
      if (!data || typeof data.progress === 'undefined' || !data.budget || !data.tasks) {
        throw new Error('Invalid project data structure received');
      }

      setProjectData(data);
    } catch (error) {
      console.error('Error fetching project data:', error);
      throw error; // Let the parent handle the error
    }
  };

  const fetchRiskMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/reports/project/${selectedProject}/risk-metrics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRiskMetrics(data);
    } catch (error) {
      console.error('Error fetching risk metrics:', error);
      // Don't throw error to allow other data to be displayed
    }
  };

  const fetchTaskTrends = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/reports/project/${selectedProject}/task-trends`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTaskTrends(data);
    } catch (error) {
      console.error('Error fetching task trends:', error);
      // Don't throw error to allow other data to be displayed
    }
  };

  // If user is not admin or manager, show access denied message
  if (!user) {
    return (
      <div className="reports-container p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Access Denied: You do not have permission to view reports.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="reports-container p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-container p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  const budgetChartData = {
    labels: ['Budget Overview'],
    datasets: [
      {
        label: 'Allocated',
        data: [projectData.budget.allocated],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Spent',
        data: [projectData.budget.spent],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Remaining',
        data: [projectData.budget.remaining],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };

  const taskChartData = {
    labels: ['Task Status'],
    datasets: [
      {
        label: 'Completed',
        data: [projectData.tasks.completed],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'In Progress',
        data: [projectData.tasks.inProgress],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Pending',
        data: [projectData.tasks.pending],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const riskPieData = {
    labels: ['High', 'Medium', 'Low'],
    datasets: [
      {
        data: [riskMetrics.high, riskMetrics.medium, riskMetrics.low],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare task trends data for line chart
  const taskTrendsData = {
    labels: taskTrends.map(item => item.date),
    datasets: [
      {
        label: 'Completed Tasks',
        data: taskTrends.map(item => item.count),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="reports-container p-4">
      <h2 className="text-2xl font-bold mb-6">Project Reports & Analytics</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Project
        </label>
        <select
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={selectedProject || ''}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="">Select a project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        {projects.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">No projects available</p>
        )}
      </div>

      {selectedProject ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Project Progress</h3>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="h-4 bg-blue-500 rounded-full"
                style={{ width: `${projectData.progress}%` }}
              ></div>
            </div>
            <p className="mt-2">{projectData.progress}% Complete</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Budget Overview</h3>
            <Bar data={budgetChartData} />
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Task Distribution</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="metric-card p-3 bg-gray-50 rounded">
                <p className="text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{projectData.tasks.total}</p>
              </div>
              <div className="metric-card p-3 bg-green-50 rounded">
                <p className="text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{projectData.tasks.completed}</p>
              </div>
              <div className="metric-card p-3 bg-blue-50 rounded">
                <p className="text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{projectData.tasks.inProgress}</p>
              </div>
              <div className="metric-card p-3 bg-purple-50 rounded">
                <p className="text-gray-600">In Review</p>
                <p className="text-2xl font-bold text-purple-600">{projectData.tasks.review}</p>
              </div>
              <div className="metric-card p-3 bg-gray-100 rounded">
                <p className="text-gray-600">To Do</p>
                <p className="text-2xl font-bold text-gray-600">{projectData.tasks.todo}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Risk Severity</h3>
            <Pie data={riskPieData} />
          </div>

          {taskTrends.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
              <h3 className="text-xl font-semibold mb-4">Task Completion Trend</h3>
              <Line data={taskTrendsData} />
            </div>
          )}

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Task Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="metric-card p-3 bg-gray-50 rounded">
                <p className="text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{projectData.tasks.total}</p>
              </div>
              <div className="metric-card p-3 bg-gray-50 rounded">
                <p className="text-gray-600">Completed Tasks</p>
                <p className="text-2xl font-bold">{projectData.tasks.completed}</p>
              </div>
              <div className="metric-card p-3 bg-gray-50 rounded">
                <p className="text-gray-600">Tasks In Progress</p>
                <p className="text-2xl font-bold">{projectData.tasks.inProgress}</p>
              </div>
              <div className="metric-card p-3 bg-gray-50 rounded">
                <p className="text-gray-600">Pending Tasks</p>
                <p className="text-2xl font-bold">{projectData.tasks.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Budget Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="metric-card p-3 bg-gray-50 rounded">
                <p className="text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold">₱{projectData.budget.allocated}</p>
              </div>
              <div className="metric-card p-3 bg-gray-50 rounded">
                <p className="text-gray-600">Budget Spent</p>
                <p className="text-2xl font-bold">₱{projectData.budget.spent}</p>
              </div>
              <div className="metric-card p-3 bg-gray-50 rounded">
                <p className="text-gray-600">Budget Remaining</p>
                <p className="text-2xl font-bold">₱{projectData.budget.remaining}</p>
              </div>
              <div className="metric-card p-3 bg-gray-50 rounded">
                <p className="text-gray-600">Utilization</p>
                <p className="text-2xl font-bold">
                  {projectData.budget.allocated > 0 
                    ? Math.round((projectData.budget.spent / projectData.budget.allocated) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Risk Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="metric-card p-3 bg-gray-50 rounded">
                <p className="text-gray-600">Total Risks</p>
                <p className="text-2xl font-bold">{riskMetrics.total}</p>
              </div>
              <div className="metric-card p-3 bg-gray-50 rounded">
                <p className="text-gray-600">High Severity Risks</p>
                <p className="text-2xl font-bold">{riskMetrics.high}</p>
              </div>
              <div className="metric-card p-3 bg-gray-50 rounded">
                <p className="text-gray-600">Mitigated Risks</p>
                <p className="text-2xl font-bold">{riskMetrics.mitigated}</p>
              </div>
              <div className="metric-card p-3 bg-gray-50 rounded">
                <p className="text-gray-600">Active Risks</p>
                <p className="text-2xl font-bold">{riskMetrics.active}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Please select a project to view its reports and analytics.</p>
        </div>
      )}
    </div>
  );
};

export default Reports; 
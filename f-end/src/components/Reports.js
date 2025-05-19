import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
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
      pending: 0
    }
  });

  useEffect(() => {
    // Fetch project data from backend
    const fetchProjectData = async () => {
      try {
        const response = await fetch('/api/reports/project-data');
        const data = await response.json();
        setProjectData(data);
      } catch (error) {
        console.error('Error fetching project data:', error);
      }
    };

    fetchProjectData();
  }, []);

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

  return (
    <div className="reports-container p-4">
      <h2 className="text-2xl font-bold mb-6">Project Reports & Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Project Progress</h3>
          <div className="progress-bar">
            <div 
              className="h-4 bg-blue-500 rounded"
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
          <Bar data={taskChartData} />
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Key Metrics</h3>
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
              <p className="text-gray-600">Budget Spent</p>
              <p className="text-2xl font-bold">${projectData.budget.spent}</p>
            </div>
            <div className="metric-card p-3 bg-gray-50 rounded">
              <p className="text-gray-600">Budget Remaining</p>
              <p className="text-2xl font-bold">${projectData.budget.remaining}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 
import React from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';

const ProjectGanttChart = ({ tasks }) => {
  console.log('Received tasks:', tasks);

  if (!Array.isArray(tasks)) {
    console.warn('Tasks prop is not an array');
    return <div>No valid tasks to display</div>;
  }

  // Filter and map tasks with improved date handling
  const ganttTasks = tasks.map(task => {
    if (!task) {
      console.warn('Skipping falsy task:', task);
      return null;
    }

    console.log('Task dates:', { created_at: task.created_at, due_date: task.due_date });

    let startDate = new Date();
    if (task.created_at) {
      const parsedCreatedAt = new Date(task.created_at);
      if (!isNaN(parsedCreatedAt)) {
        startDate = parsedCreatedAt;
      } else {
        console.warn('Invalid created_at for task:', task);
      }
    } else {
      console.warn('Missing created_at for task:', task);
    }

    let endDate = startDate;
    if (task.due_date) {
      const parsedDueDate = new Date(task.due_date);
      if (!isNaN(parsedDueDate)) {
        endDate = parsedDueDate;
      } else {
        console.warn('Invalid due_date for task:', task);
      }
    }

    return {
      start: startDate,
      end: endDate,
      name: task.title || 'Untitled Task',
      id: task.id ? task.id.toString() : Math.random().toString(36).substr(2, 9),
      type: 'task',
      progress: task.status === 'completed' ? 100 : 0,
      isDisabled: true,
    };
  }).filter(task => task !== null);

  console.log('Mapped ganttTasks:', ganttTasks);

  if (ganttTasks.length === 0) {
    return <div>No valid tasks to display</div>;
  }

  return (
    <div>
      <h5>Gantt Chart</h5>
      <Gantt
        tasks={ganttTasks}
        viewMode={ViewMode.Day}
        locale="en"
        listCellWidth="155px"
      />
    </div>
  );
};

export default ProjectGanttChart;

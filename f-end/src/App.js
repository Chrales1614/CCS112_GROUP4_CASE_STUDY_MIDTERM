import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navigation from './components/layout/Navigation';
import Dashboard from './components/dashboard';
import Login from './components/login';
import Register from './components/registration';
import ProjectList from './components/projects/ProjectList';
import ProjectForm from './components/projects/ProjectForm';
import ProjectDetail from './components/projects/ProjectDetail';
import TaskList from './components/tasks/TaskList';
import TaskForm from './components/tasks/TaskForm';
import TaskDetail from './components/tasks/TaskDetail';
import AllTasks from './components/tasks/AllTasks';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Reports from './components/Reports';
import RiskTracker from './components/RiskTracker';

function AppWrapper() {
  return (
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  );
}

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Define paths where Navigation should be shown
  const showNavigationPaths = ['/', '/projects', '/projects/create', '/tasks', '/tasks/create'];
  const shouldShowNavigation = user && showNavigationPaths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));

  if (loading) {
    return <div className="container mt-5">Loading...</div>;
  }

  return (
    <div className="App">
      {shouldShowNavigation && <Navigation />}
      <div className="container py-4">
        <Routes>
          <Route 
            path="/" 
            element={user ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Project routes */}
          <Route 
            path="/projects" 
            element={user ? <ProjectList /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/projects/create" 
            element={user ? <ProjectForm /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/projects/:id" 
            element={user ? <ProjectDetail /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/projects/:id/edit" 
            element={user ? <ProjectForm /> : <Navigate to="/login" />} 
          />
          
          {/* Task routes */}
          <Route 
            path="/projects/:projectId/tasks" 
            element={user ? <TaskList /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/projects/:projectId/tasks/create" 
            element={user ? <TaskForm /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/tasks/create" 
            element={user ? <TaskForm /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/tasks" 
            element={user ? <AllTasks /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/tasks/:taskId" 
            element={user ? <TaskDetail /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/tasks/:taskId/edit" 
            element={user ? <TaskForm /> : <Navigate to="/login" />} 
          />
          
          {/* Reports and Risk Tracker routes */}
          <Route 
            path="/reports" 
            element={user ? <Reports /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/risks" 
            element={user ? <RiskTracker /> : <Navigate to="/login" />} 
          />
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default AppWrapper;

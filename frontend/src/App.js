import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Units from './pages/Units';
import LeaveDashboard from './pages/LeaveDashboard';
import AddLeave from './pages/AddLeave';
import LeaveReports from './pages/LeaveReports';
import AllLeaves from './pages/AllLeaves';
import Holidays from './pages/Holidays';
import LeaveSettings from './pages/LeaveSettings';
import EmployeeFieldSettings from './pages/EmployeeFieldSettings';
import GateDutySetup from './pages/GateDutySetup';
import GateDutyRoster from './pages/GateDutyRoster';
import OutDutyManagement from './pages/OutDutyManagement';
import EmployeeReports from './pages/EmployeeReports';
import GateDutyReports from './pages/GateDutyReports';
import TFCManagement from './pages/TFCManagement';
import TFCReports from './pages/TFCReports';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Employee Routes */}
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <Employees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee-field-settings"
        element={
          <ProtectedRoute>
            <EmployeeFieldSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee-reports"
        element={
          <ProtectedRoute>
            <EmployeeReports />
          </ProtectedRoute>
        }
      />

      {/* Units */}
      <Route
        path="/units"
        element={
          <ProtectedRoute>
            <Units />
          </ProtectedRoute>
        }
      />

      {/* Leave Routes */}
      <Route
        path="/leaves"
        element={
          <ProtectedRoute>
            <LeaveDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaves/add"
        element={
          <ProtectedRoute>
            <AddLeave />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaves/reports"
        element={
          <ProtectedRoute>
            <LeaveReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaves/all"
        element={
          <ProtectedRoute>
            <AllLeaves />
          </ProtectedRoute>
        }
      />

      {/* Holidays */}
      <Route
        path="/holidays"
        element={
          <ProtectedRoute>
            <Holidays />
          </ProtectedRoute>
        }
      />

      {/* Leave Settings */}
      <Route
        path="/leave-settings"
        element={
          <ProtectedRoute>
            <LeaveSettings />
          </ProtectedRoute>
        }
      />

      {/* Gate Duty Routes */}
      <Route
        path="/gate-duty/setup"
        element={
          <ProtectedRoute>
            <GateDutySetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gate-duty/roster"
        element={
          <ProtectedRoute>
            <GateDutyRoster />
          </ProtectedRoute>
        }
      />

      {/* Out Duty Route */}
      <Route
        path="/out-duty"
        element={
          <ProtectedRoute>
            <OutDutyManagement />
          </ProtectedRoute>
        }
      />

      <Route
  path="/gate-duty/reports"
  element={
    <ProtectedRoute>
      <GateDutyReports />
    </ProtectedRoute>
  }
/>

  {/* TFC Store Routes */}
      <Route
        path="/tfc-store/manage"
        element={
          <ProtectedRoute>
            <TFCManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tfc-store/reports"
        element={
          <ProtectedRoute>
            <TFCReports />
          </ProtectedRoute>
        }
      />

      {/* Default Route */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
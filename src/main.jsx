import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/AppLayout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Loader from './components/Loader.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import './styles.css';

const Login = lazy(() => import('./pages/Login.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Project = lazy(() => import('./pages/Project.jsx'));
const Messages = lazy(() => import('./pages/Messages.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const ManageClients = lazy(() => import('./pages/admin/ManageClients.jsx'));
const ManageProjects = lazy(() => import('./pages/admin/ManageProjects.jsx'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages.jsx'));

const rootElement = document.getElementById('root');
const root = globalThis.__ZENVY_PORTAL_ROOT__ || createRoot(rootElement);
globalThis.__ZENVY_PORTAL_ROOT__ = root;

root.render(
  <StrictMode>
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Suspense fallback={<Loader fullScreen label="Preparing your portal" />}>
            <Routes>
              <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <AppLayout />
                </ProtectedRoute>
              }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects/:projectId" element={<Project />} />
                <Route path="/project/:projectId" element={<Project />} />
                <Route path="/client/project/:projectId" element={<Project />} />
                <Route path="/messages" element={<Messages />} />
              </Route>
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout admin />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="clients" element={<ManageClients />} />
                <Route path="projects" element={<ManageProjects />} />
                <Route path="projects/:projectId" element={<Project />} />
                <Route path="messages" element={<AdminMessages />} />
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'glass-toast',
              duration: 3600,
            }}
          />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  </StrictMode>,
);

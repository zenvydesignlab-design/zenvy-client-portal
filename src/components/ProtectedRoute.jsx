import { Navigate, useLocation } from 'react-router-dom';
import Loader from './Loader';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader fullScreen label="Securing session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

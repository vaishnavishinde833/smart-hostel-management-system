import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Wraps a route so only authenticated users with the right role can access it.
 * `roles` — array of allowed roles; omit to allow any authenticated user.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullScreen />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to the correct home for their role
    const home = roleHome(user.role);
    return <Navigate to={home} replace />;
  }

  return children;
}

function roleHome(role) {
  if (role === 'admin')   return '/admin/dashboard';
  if (role === 'warden')  return '/warden/dashboard';
  if (role === 'student') return '/student/dashboard';
  return '/login';
}

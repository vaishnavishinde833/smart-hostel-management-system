import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFoundPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const home = {
    admin:   '/admin/dashboard',
    warden:  '/warden/dashboard',
    student: '/student/dashboard',
  }[user?.role] || '/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-slate-200">404</p>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">Page not found</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          The page you are looking for does not exist.
        </p>
        <button
          onClick={() => navigate(home)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

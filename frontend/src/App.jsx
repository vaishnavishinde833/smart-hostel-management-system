import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents  from './pages/admin/AdminStudents';
import AdminHostels   from './pages/admin/AdminHostels';
import AdminRooms       from './pages/admin/AdminRooms';
import AdminAllocations  from './pages/admin/AdminAllocations';
import AdminComplaints    from './pages/admin/AdminComplaints';
import AdminLeaveRequests from './pages/admin/AdminLeaveRequests';
import AdminNotices       from './pages/admin/AdminNotices';
import WardenDashboard from './pages/warden/WardenDashboard';
import WardenStudents  from './pages/warden/WardenStudents';
import WardenHostel    from './pages/warden/WardenHostel';
import WardenRooms       from './pages/warden/WardenRooms';
import WardenAllocations  from './pages/warden/WardenAllocations';
import WardenComplaints    from './pages/warden/WardenComplaints';
import WardenLeaveRequests from './pages/warden/WardenLeaveRequests';
import WardenNotices       from './pages/warden/WardenNotices';
import StudentDashboard    from './pages/student/StudentDashboard';
import StudentComplaints   from './pages/student/StudentComplaints';
import StudentLeaveRequests from './pages/student/StudentLeaveRequests';
import StudentNotices      from './pages/student/StudentNotices';
import NotFoundPage from './pages/NotFoundPage';
import LoadingSpinner from './components/common/LoadingSpinner';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin')   return <Navigate to="/admin/dashboard"   replace />;
  if (user.role === 'warden')  return <Navigate to="/warden/dashboard"  replace />;
  if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root → role-based redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Admin routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute roles={['admin']}>
                <Layout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="students"  element={<AdminStudents />} />
                    <Route path="hostels"   element={<AdminHostels />} />
                    <Route path="rooms"       element={<AdminRooms />} />
                    <Route path="allocations" element={<AdminAllocations />} />
                    <Route path="complaints"     element={<AdminComplaints />} />
                    <Route path="leave-requests" element={<AdminLeaveRequests />} />
                    <Route path="notices"        element={<AdminNotices />} />
                    <Route path="*" element={<ComingSoon />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Warden routes */}
          <Route
            path="/warden/*"
            element={
              <ProtectedRoute roles={['warden']}>
                <Layout>
                  <Routes>
                    <Route path="dashboard" element={<WardenDashboard />} />
                    <Route path="students"  element={<WardenStudents />} />
                    <Route path="hostel"    element={<WardenHostel />} />
                    <Route path="rooms"       element={<WardenRooms />} />
                    <Route path="allocations" element={<WardenAllocations />} />
                    <Route path="complaints"     element={<WardenComplaints />} />
                    <Route path="leave-requests" element={<WardenLeaveRequests />} />
                    <Route path="notices"        element={<WardenNotices />} />
                    <Route path="*" element={<ComingSoon />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Student routes */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute roles={['student']}>
                <Layout>
                  <Routes>
                    <Route path="dashboard"   element={<StudentDashboard />} />
                    <Route path="complaints"     element={<StudentComplaints />} />
                    <Route path="leave-requests" element={<StudentLeaveRequests />} />
                    <Route path="notices"        element={<StudentNotices />} />
                    <Route path="*" element={<ComingSoon />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function ComingSoon() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="text-center">
        <p className="text-3xl font-bold text-slate-200 mb-2">Coming Soon</p>
        <p className="text-sm text-slate-400">This page will be implemented in the next module.</p>
      </div>
    </div>
  );
}

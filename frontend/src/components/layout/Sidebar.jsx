import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ADMIN_LINKS = [
  { to: '/admin/dashboard',   label: 'Dashboard',    icon: '▪' },
  { to: '/admin/students',    label: 'Students',     icon: '▪' },
  { to: '/admin/hostels',     label: 'Hostels',      icon: '▪' },
  { to: '/admin/rooms',       label: 'Rooms',        icon: '▪' },
  { to: '/admin/allocations', label: 'Allocations',  icon: '▪' },
  { to: '/admin/complaints',  label: 'Complaints',   icon: '▪' },
  { to: '/admin/leave',       label: 'Leave',        icon: '▪' },
  { to: '/admin/notices',     label: 'Notices',      icon: '▪' },
];

const WARDEN_LINKS = [
  { to: '/warden/dashboard',  label: 'Dashboard',    icon: '▪' },
  { to: '/warden/rooms',      label: 'Rooms',        icon: '▪' },
  { to: '/warden/allocations',label: 'Allocations',  icon: '▪' },
  { to: '/warden/complaints', label: 'Complaints',   icon: '▪' },
  { to: '/warden/leave',      label: 'Leave',        icon: '▪' },
  { to: '/warden/notices',    label: 'Notices',      icon: '▪' },
];

const STUDENT_LINKS = [
  { to: '/student/dashboard', label: 'Dashboard',    icon: '▪' },
  { to: '/student/room',      label: 'My Room',      icon: '▪' },
  { to: '/student/complaints',label: 'Complaints',   icon: '▪' },
  { to: '/student/leave',     label: 'Leave',        icon: '▪' },
  { to: '/student/notices',   label: 'Notices',      icon: '▪' },
];

const ROLE_LINKS = { admin: ADMIN_LINKS, warden: WARDEN_LINKS, student: STUDENT_LINKS };
const ROLE_LABEL = { admin: 'Admin Panel', warden: 'Warden Panel', student: 'Student Panel' };

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const links = ROLE_LINKS[user?.role] ?? [];

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-60 bg-slate-900 text-white z-30
          flex flex-col
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-700">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {ROLE_LABEL[user?.role] ?? 'Hostel'}
          </p>
          <h1 className="text-base font-bold text-white leading-tight mt-0.5">
            Smart Hostel
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-0.5">
            {links.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                     ${isActive
                       ? 'bg-blue-600 text-white font-medium'
                       : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                     }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info footer */}
        <div className="px-4 py-4 border-t border-slate-700">
          <p className="text-xs text-slate-400 truncate">{user?.name}</p>
          <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
        </div>
      </aside>
    </>
  );
}

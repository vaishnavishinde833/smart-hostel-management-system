import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const roleHome = {
    admin: '/admin/dashboard',
    warden: '/warden/dashboard',
    student: '/student/dashboard',
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 sticky top-0 z-10">
      {/* Hamburger — mobile only */}
      <button
        className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Page title placeholder — could be replaced with breadcrumbs */}
      <span className="text-sm font-medium text-slate-700 flex-1">
        Smart Hostel Management System
      </span>

      {/* User menu */}
      <div className="relative">
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-100 text-sm"
          onClick={() => setDropdownOpen((o) => !o)}
        >
          <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </span>
          <span className="hidden sm:block font-medium text-slate-700">{user?.name}</span>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

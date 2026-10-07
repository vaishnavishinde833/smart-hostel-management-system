import { useState, useEffect, useCallback } from 'react';
import {
  getLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
} from '../../api/leaveRequests';
import LeaveDetailModal, { StatusBadge } from './LeaveDetailModal';
import LeaveRequestForm from './LeaveRequestForm';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';

const STATUSES = ['all', 'pending', 'approved', 'rejected'];
const STATUS_LABEL = { all: 'All', pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function dayCount(from, to) {
  if (!from || !to) return null;
  const diff = (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24) + 1;
  return diff > 0 ? diff : null;
}

/**
 * Props:
 *   role — 'admin' | 'warden' | 'student'
 */
export default function LeaveRequestsPage({ role }) {
  const isStaff   = role === 'admin' || role === 'warden';
  const isStudent = role === 'student';

  const [leaves,  setLeaves]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // filters
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // modals
  const [selected,    setSelected]    = useState(null);
  const [showForm,    setShowForm]    = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState('');

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await getLeaveRequests();
      setLeaves(res.data?.leaves ?? res.data ?? []);
    } catch {
      setError('Failed to load leave requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ------- filtering -------
  const filtered = leaves.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const inName = l.student_name?.toLowerCase().includes(q);
      const inCode = l.student_code?.toLowerCase().includes(q);
      const inReason = l.reason?.toLowerCase().includes(q);
      if (!inName && !inCode && !inReason) return false;
    }
    return true;
  });

  // ------- counts -------
  const counts = {
    total:    leaves.length,
    pending:  leaves.filter((l) => l.status === 'pending').length,
    approved: leaves.filter((l) => l.status === 'approved').length,
    rejected: leaves.filter((l) => l.status === 'rejected').length,
  };

  // ------- student submit -------
  async function handleCreate(data) {
    setFormLoading(true); setFormError('');
    try {
      await createLeaveRequest(data);
      setShowForm(false);
      showToast('Leave request submitted successfully.');
      load();
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to submit request.';
      // 409 = overlapping leave
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  }

  // ------- staff approve / reject -------
  async function handleApprove(id, data) {
    await approveLeaveRequest(id, data);
    showToast('Leave request approved.');
    load();
  }

  async function handleReject(id, data) {
    await rejectLeaveRequest(id, data);
    showToast('Leave request rejected.', 'info');
    load();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Leave Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isStudent ? 'Manage your leave applications' : 'Review and process leave requests'}
          </p>
        </div>
        {isStudent && (
          <button
            onClick={() => { setShowForm(true); setFormError(''); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white
                       bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <span className="text-base">+</span> New Request
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'total',    label: 'Total',    cls: 'bg-slate-50 border-slate-200 text-slate-700'  },
          { key: 'pending',  label: 'Pending',  cls: 'bg-amber-50  border-amber-200  text-amber-700'  },
          { key: 'approved', label: 'Approved', cls: 'bg-green-50  border-green-200  text-green-700'  },
          { key: 'rejected', label: 'Rejected', cls: 'bg-red-50    border-red-200    text-red-700'    },
        ].map(({ key, label, cls }) => (
          <div key={key} className={`p-3 rounded-lg border ${cls}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-2xl font-bold">{counts[key]}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {isStaff && (
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, code or reason…"
            className="flex-1 min-w-[220px] px-3 py-2 border border-slate-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-slate-500 font-medium">
            {leaves.length === 0 ? 'No leave requests found.' : 'No requests match the filters.'}
          </p>
          {isStudent && leaves.length === 0 && (
            <button
              onClick={() => { setShowForm(true); setFormError(''); }}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300
                         rounded-lg hover:bg-blue-50"
            >
              Submit your first leave request
            </button>
          )}
        </div>
      ) : isStudent ? (
        /* Student card list */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((l) => (
            <StudentLeaveCard key={l.id} leave={l} onClick={() => setSelected(l)} />
          ))}
        </div>
      ) : (
        /* Staff table */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">#</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Student</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">From</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">To</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Days</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Reason</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((l) => {
                  const days = dayCount(l.from_date, l.to_date);
                  return (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{l.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{l.student_name ?? '—'}</div>
                        {l.student_code && (
                          <div className="text-xs text-slate-400 font-mono">{l.student_code}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmt(l.from_date)}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmt(l.to_date)}</td>
                      <td className="px-4 py-3 text-slate-600 text-center">
                        {days ? `${days}d` : '—'}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-slate-600 truncate">{l.reason}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(l)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {l.status === 'pending' ? 'Review' : 'View'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
            Showing {filtered.length} of {leaves.length} requests
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <LeaveDetailModal
          leave={selected}
          canManage={isStaff}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Submit Form Modal (student) */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Submit Leave Request">
        <LeaveRequestForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={formLoading}
          error={formError}
        />
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

function StudentLeaveCard({ leave: l, onClick }) {
  const days = dayCount(l.from_date, l.to_date);

  return (
    <button
      onClick={onClick}
      className="text-left w-full p-4 bg-white rounded-xl border border-slate-200
                 hover:border-blue-300 hover:shadow-md transition-all shadow-sm"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-slate-400">#{l.id}</span>
            {days && (
              <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded">
                {days} day{days !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={l.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-400">From</p>
          <p className="text-xs font-semibold text-slate-700">{fmt(l.from_date)}</p>
        </div>
        <div className="p-2 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-400">To</p>
          <p className="text-xs font-semibold text-slate-700">{fmt(l.to_date)}</p>
        </div>
      </div>

      <p className="text-sm text-slate-600 line-clamp-2 mb-2">{l.reason}</p>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Submitted {fmt(l.created_at)}</span>
        {l.approved_by_name && (
          <span className={l.status === 'approved' ? 'text-green-600' : 'text-red-600'}>
            by {l.approved_by_name}
          </span>
        )}
      </div>

      {l.remarks && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-xs font-medium text-blue-600 mb-0.5">Remarks</p>
          <p className="text-xs text-slate-500 line-clamp-2">{l.remarks}</p>
        </div>
      )}
    </button>
  );
}

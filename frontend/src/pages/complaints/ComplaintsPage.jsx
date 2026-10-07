import { useState, useEffect, useCallback } from 'react';
import { getComplaints, createComplaint, updateComplaintStatus } from '../../api/complaints';
import ComplaintDetailModal, { StatusBadge } from './ComplaintDetailModal';
import ComplaintForm from './ComplaintForm';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';

const CATEGORIES = ['maintenance', 'food', 'security', 'hygiene', 'other'];
const STATUSES   = ['all', 'pending', 'in_progress', 'resolved', 'rejected'];

const STATUS_LABEL = {
  all: 'All', pending: 'Pending', in_progress: 'In Progress',
  resolved: 'Resolved', rejected: 'Rejected',
};

const CATEGORY_ICONS = {
  maintenance: '🔧', food: '🍽️', security: '🔒', hygiene: '🧹', other: '📋',
};

/**
 * Props:
 *   role — 'admin' | 'warden' | 'student'
 */
export default function ComplaintsPage({ role }) {
  const isStaff   = role === 'admin' || role === 'warden';
  const isStudent = role === 'student';

  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // filters
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [categoryFilter,setCategoryFilter] = useState('all');

  // modals
  const [selected,     setSelected]     = useState(null); // for detail modal
  const [showForm,     setShowForm]     = useState(false);
  const [formLoading,  setFormLoading]  = useState(false);
  const [formError,    setFormError]    = useState('');

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await getComplaints();
      setComplaints(res.data?.complaints ?? res.data ?? []);
    } catch {
      setError('Failed to load complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ------- filtering -------
  const filtered = complaints.filter((c) => {
    if (statusFilter   !== 'all' && c.status   !== statusFilter)   return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const inStudent  = c.student_name?.toLowerCase().includes(q);
      const inCode     = c.student_code?.toLowerCase().includes(q);
      const inCategory = c.category?.toLowerCase().includes(q);
      const inDesc     = c.description?.toLowerCase().includes(q);
      if (!inStudent && !inCode && !inCategory && !inDesc) return false;
    }
    return true;
  });

  // ------- counts strip -------
  const counts = {
    total:       complaints.length,
    pending:     complaints.filter((c) => c.status === 'pending').length,
    in_progress: complaints.filter((c) => c.status === 'in_progress').length,
    resolved:    complaints.filter((c) => c.status === 'resolved').length,
    rejected:    complaints.filter((c) => c.status === 'rejected').length,
  };

  // ------- student submit -------
  async function handleCreate(data) {
    setFormLoading(true); setFormError('');
    try {
      await createComplaint(data);
      setShowForm(false);
      showToast('Complaint submitted successfully.');
      load();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Failed to submit complaint.');
    } finally {
      setFormLoading(false);
    }
  }

  // ------- staff status update -------
  async function handleUpdate(id, data) {
    await updateComplaintStatus(id, data);
    showToast('Complaint status updated.');
    load();
  }

  // ------- open detail and refresh selected if list reloaded -------
  function openDetail(c) { setSelected(c); }
  function closeDetail()  {
    // re-sync selected from latest data after update
    setSelected(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Complaints</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isStudent ? 'View and manage your complaints' : 'Manage hostel complaints'}
          </p>
        </div>
        {isStudent && (
          <button
            onClick={() => { setShowForm(true); setFormError(''); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white
                       bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <span className="text-base">+</span> New Complaint
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: 'total',       label: 'Total',       cls: 'bg-slate-50 border-slate-200 text-slate-700'  },
          { key: 'pending',     label: 'Pending',     cls: 'bg-amber-50  border-amber-200  text-amber-700'  },
          { key: 'in_progress', label: 'In Progress', cls: 'bg-blue-50   border-blue-200   text-blue-700'   },
          { key: 'resolved',    label: 'Resolved',    cls: 'bg-green-50  border-green-200  text-green-700'  },
          { key: 'rejected',    label: 'Rejected',    cls: 'bg-red-50    border-red-200    text-red-700'    },
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
            placeholder="Search by name, code, category…"
            className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-lg text-sm
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
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="capitalize">{c}</option>
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
          <p className="text-4xl mb-3">📋</p>
          <p className="text-slate-500 font-medium">
            {complaints.length === 0 ? 'No complaints found.' : 'No complaints match the filters.'}
          </p>
          {isStudent && complaints.length === 0 && (
            <button
              onClick={() => { setShowForm(true); setFormError(''); }}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300
                         rounded-lg hover:bg-blue-50"
            >
              Submit your first complaint
            </button>
          )}
        </div>
      ) : isStudent ? (
        /* Student card grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <StudentComplaintCard key={c.id} complaint={c} onClick={() => openDetail(c)} />
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
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Description</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{c.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{c.student_name ?? '—'}</div>
                      {c.student_code && (
                        <div className="text-xs text-slate-400 font-mono">{c.student_code}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 capitalize text-slate-600">
                        <span>{CATEGORY_ICONS[c.category] ?? '📋'}</span>
                        {c.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="text-slate-600 truncate">{c.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString('en-IN', { year:'numeric',month:'short',day:'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(c)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
            Showing {filtered.length} of {complaints.length} complaints
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <ComplaintDetailModal
          complaint={selected}
          canManage={isStaff}
          onClose={closeDetail}
          onUpdate={handleUpdate}
        />
      )}

      {/* Submit Form Modal (student) */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Submit New Complaint">
        <ComplaintForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={formLoading}
          error={formError}
        />
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

function StudentComplaintCard({ complaint: c, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left w-full p-4 bg-white rounded-xl border border-slate-200
                 hover:border-blue-300 hover:shadow-md transition-all shadow-sm"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{CATEGORY_ICONS[c.category] ?? '📋'}</span>
          <span className="text-sm font-semibold text-slate-700 capitalize">{c.category}</span>
        </div>
        <StatusBadge status={c.status} />
      </div>
      <p className="text-sm text-slate-600 line-clamp-2 mb-2">{c.description}</p>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>#{c.id}</span>
        <span>
          {c.created_at
            ? new Date(c.created_at).toLocaleDateString('en-IN', { month:'short', day:'numeric', year:'numeric' })
            : ''}
        </span>
      </div>
      {c.response && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-xs font-medium text-blue-600 mb-0.5">Response</p>
          <p className="text-xs text-slate-500 line-clamp-2">{c.response}</p>
        </div>
      )}
    </button>
  );
}

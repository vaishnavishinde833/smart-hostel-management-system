import { useState, useEffect, useCallback } from 'react';
import { getNotices, createNotice, updateNotice, deleteNotice } from '../../api/notices';
import { useAuth } from '../../context/AuthContext';
import NoticeForm from './NoticeForm';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Toast from '../../components/common/Toast';

// ── constants ──────────────────────────────────────────────────────────────

const TARGET_CFG = {
  all:     { cls: 'bg-blue-100 text-blue-700',   label: 'Everyone'      },
  student: { cls: 'bg-purple-100 text-purple-700', label: 'Students'    },
  warden:  { cls: 'bg-teal-100 text-teal-700',    label: 'Wardens'      },
};

const FILTER_OPTIONS = {
  admin:   ['all_filter', 'all', 'student', 'warden'],
  warden:  ['all_filter', 'all', 'warden'],
  student: ['all_filter', 'all', 'student'],
};

const FILTER_LABEL = {
  all_filter: 'All Audiences', all: 'Everyone', student: 'Students', warden: 'Wardens',
};

// ── helpers ────────────────────────────────────────────────────────────────

function fmt(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function TargetBadge({ target }) {
  const cfg = TARGET_CFG[target] ?? { cls: 'bg-slate-100 text-slate-600', label: target };
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ── main component ─────────────────────────────────────────────────────────

/**
 * Props:
 *   role — 'admin' | 'warden' | 'student'
 */
export default function NoticesPage({ role }) {
  const { user } = useAuth();

  const isAdmin   = role === 'admin';
  const isWarden  = role === 'warden';
  const isStudent = role === 'student';
  const canCreate = isAdmin || isWarden;

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // filters
  const [search,       setSearch]       = useState('');
  const [targetFilter, setTargetFilter] = useState('all_filter');

  // modals
  const [viewNotice,   setViewNotice]   = useState(null);  // notice object
  const [editNotice,   setEditNotice]   = useState(null);  // notice object or 'new'
  const [deleteTarget, setDeleteTarget] = useState(null);  // notice object

  // form state
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState('');

  // delete state
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await getNotices();
      setNotices(res.data?.notices ?? res.data ?? []);
    } catch {
      setError('Failed to load notices. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ------- ownership check for warden -------
  function canEdit(notice) {
    if (isAdmin) return true;
    if (isWarden) return notice.author_id === user?.id;
    return false;
  }

  // ------- filtering -------
  const filtered = notices.filter((n) => {
    if (targetFilter !== 'all_filter' && n.target_role !== targetFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const inTitle   = n.title?.toLowerCase().includes(q);
      const inContent = n.content?.toLowerCase().includes(q);
      const inAuthor  = n.author_name?.toLowerCase().includes(q);
      if (!inTitle && !inContent && !inAuthor) return false;
    }
    return true;
  });

  // ------- create / edit -------
  async function handleFormSubmit(data) {
    setFormLoading(true); setFormError('');
    try {
      if (editNotice === 'new') {
        await createNotice(data);
        showToast('Notice published successfully.');
      } else {
        await updateNotice(editNotice.id, data);
        showToast('Notice updated.');
      }
      setEditNotice(null);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Failed to save notice.');
    } finally {
      setFormLoading(false);
    }
  }

  // ------- delete -------
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteNotice(deleteTarget.id);
      showToast('Notice deleted.', 'info');
      setDeleteTarget(null);
      if (viewNotice?.id === deleteTarget.id) setViewNotice(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Failed to delete notice.', 'error');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const filterOptions = FILTER_OPTIONS[role] ?? FILTER_OPTIONS.student;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Notices</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isStudent ? 'Stay updated with hostel announcements' : 'Manage and publish hostel notices'}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setEditNotice('new'); setFormError(''); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white
                       bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <span className="text-base">+</span> New Notice
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border bg-slate-50 border-slate-200 text-slate-700">
          <p className="text-xs font-medium opacity-70">Total</p>
          <p className="text-2xl font-bold">{notices.length}</p>
        </div>
        {[
          { key: 'all',     label: 'For Everyone', cls: 'bg-blue-50  border-blue-200  text-blue-700'   },
          { key: 'student', label: 'For Students',  cls: 'bg-purple-50 border-purple-200 text-purple-700' },
          { key: 'warden',  label: 'For Wardens',   cls: 'bg-teal-50  border-teal-200  text-teal-700'   },
        ].map(({ key, label, cls }) => (
          <div key={key} className={`p-3 rounded-lg border ${cls}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-2xl font-bold">{notices.filter((n) => n.target_role === key).length}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notices…"
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={targetFilter}
          onChange={(e) => setTargetFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {filterOptions.map((opt) => (
            <option key={opt} value={opt}>{FILTER_LABEL[opt]}</option>
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
          <p className="text-4xl mb-3">📢</p>
          <p className="text-slate-500 font-medium">
            {notices.length === 0 ? 'No notices published yet.' : 'No notices match the filters.'}
          </p>
          {canCreate && notices.length === 0 && (
            <button
              onClick={() => { setEditNotice('new'); setFormError(''); }}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300
                         rounded-lg hover:bg-blue-50"
            >
              Publish first notice
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((n) => (
            <NoticeCard
              key={n.id}
              notice={n}
              canEdit={canEdit(n)}
              onView={() => setViewNotice(n)}
              onEdit={() => { setEditNotice(n); setFormError(''); }}
              onDelete={() => setDeleteTarget(n)}
            />
          ))}
        </div>
      )}

      {/* View Modal */}
      {viewNotice && (
        <NoticeViewModal
          notice={viewNotice}
          canEdit={canEdit(viewNotice)}
          onClose={() => setViewNotice(null)}
          onEdit={() => { setEditNotice(viewNotice); setViewNotice(null); setFormError(''); }}
          onDelete={() => { setDeleteTarget(viewNotice); setViewNotice(null); }}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={Boolean(editNotice)}
        onClose={() => setEditNotice(null)}
        title={editNotice === 'new' ? 'New Notice' : 'Edit Notice'}
        maxWidth="max-w-lg"
      >
        <NoticeForm
          initial={editNotice === 'new' ? null : editNotice}
          onSubmit={handleFormSubmit}
          onCancel={() => setEditNotice(null)}
          loading={formLoading}
          error={formError}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Notice"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmClass="bg-red-600 hover:bg-red-700"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

// ── NoticeCard ─────────────────────────────────────────────────────────────

function NoticeCard({ notice: n, canEdit, onView, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <h3
          className="text-sm font-semibold text-slate-800 leading-snug cursor-pointer
                     hover:text-blue-600 flex-1"
          onClick={onView}
        >
          {n.title}
        </h3>
        <TargetBadge target={n.target_role} />
      </div>

      {/* Content preview */}
      <p
        className="text-sm text-slate-500 line-clamp-3 cursor-pointer leading-relaxed"
        onClick={onView}
      >
        {n.content}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-semibold text-[10px]">
            {n.author_name?.[0]?.toUpperCase() ?? '?'}
          </span>
          <span>{n.author_name ?? 'Unknown'}</span>
          <span className="text-slate-300">·</span>
          <span>{fmt(n.created_at)}</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          <button onClick={onView} className="text-blue-600 hover:text-blue-800 hover:underline">
            Read
          </button>
          {canEdit && (
            <>
              <button onClick={onEdit} className="text-slate-500 hover:text-slate-800 hover:underline">
                Edit
              </button>
              <button onClick={onDelete} className="text-red-500 hover:text-red-700 hover:underline">
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── NoticeViewModal ────────────────────────────────────────────────────────

function NoticeViewModal({ notice: n, canEdit, onClose, onEdit, onDelete }) {
  return (
    <Modal open={Boolean(n)} onClose={onClose} title="Notice" maxWidth="max-w-lg">
      {/* Target badge + date */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <TargetBadge target={n.target_role} />
        <span className="text-xs text-slate-400">{fmt(n.created_at)}</span>
      </div>

      {/* Title */}
      <h2 className="text-base font-bold text-slate-800 mb-3">{n.title}</h2>

      {/* Content */}
      <div className="bg-slate-50 rounded-lg px-4 py-3 mb-4">
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{n.content}</p>
      </div>

      {/* Author */}
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
          {n.author_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-700">{n.author_name ?? 'Unknown'}</p>
          <p className="text-xs text-slate-400">Author</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300
                     rounded-md hover:bg-slate-50">
          Close
        </button>
        {canEdit && (
          <>
            <button onClick={onDelete}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md
                         hover:bg-red-700 transition-colors">
              Delete
            </button>
            <button onClick={onEdit}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md
                         hover:bg-blue-700 transition-colors">
              Edit
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

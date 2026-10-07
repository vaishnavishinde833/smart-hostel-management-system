import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getStudents, createStudent, updateStudent,
  deleteStudent, deactivateStudent, activateStudent,
} from '../../api/students';
import Modal          from '../../components/common/Modal';
import ConfirmDialog  from '../../components/common/ConfirmDialog';
import Toast          from '../../components/common/Toast';
import StudentForm    from './StudentForm';
import StudentDetailModal from './StudentDetailModal';

/**
 * canDelete  — true for admin, false for warden
 * canCreate  — true for both; backend also allows warden
 */
export default function StudentsPage({ canDelete = false }) {
  const [students,  setStudents]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [fetchErr,  setFetchErr]  = useState('');

  // Search
  const [search, setSearch] = useState('');

  // Modals
  const [showForm,    setShowForm]    = useState(false);
  const [editStudent, setEditStudent] = useState(null);   // null = add mode
  const [viewStudent, setViewStudent] = useState(null);

  // Confirm dialog
  const [confirm, setConfirm] = useState({ open: false, action: null, student: null });

  // Form state
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState('');

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // ── Load students ────────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setFetchErr('');
    try {
      const { data } = await getStudents();
      setStudents(data.students ?? []);
    } catch (err) {
      setFetchErr(err.response?.data?.message ?? 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── Search filter ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return students;
    return students.filter((s) =>
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.student_code?.toLowerCase().includes(q)
    );
  }, [students, search]);

  // ── Form submit (add / edit) ─────────────────────────────────────────────
  async function handleFormSubmit(payload) {
    setFormLoading(true);
    setFormError('');
    try {
      if (editStudent) {
        await updateStudent(editStudent.id, payload);
        showToast(`${payload.name} updated successfully.`);
      } else {
        await createStudent(payload);
        showToast(`${payload.name} added successfully.`);
      }
      closeForm();
      fetchStudents();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setFormLoading(false);
    }
  }

  function openAdd() {
    setEditStudent(null);
    setFormError('');
    setShowForm(true);
  }

  function openEdit(s) {
    setEditStudent(s);
    setFormError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditStudent(null);
    setFormError('');
  }

  // ── Confirm actions ──────────────────────────────────────────────────────
  function askConfirm(action, student) {
    setConfirm({ open: true, action, student });
  }

  async function handleConfirm() {
    const { action, student } = confirm;
    setConfirm((c) => ({ ...c, loading: true }));
    try {
      if (action === 'delete') {
        await deleteStudent(student.id);
        showToast(`${student.name} deleted.`, 'success');
      } else if (action === 'deactivate') {
        await deactivateStudent(student.id);
        showToast(`${student.name} deactivated.`, 'info');
      } else if (action === 'activate') {
        await activateStudent(student.id);
        showToast(`${student.name} activated.`, 'success');
      }
      setConfirm({ open: false, action: null, student: null });
      fetchStudents();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Action failed.', 'error');
      setConfirm({ open: false, action: null, student: null });
    }
  }

  // ── Confirm dialog text ──────────────────────────────────────────────────
  const confirmText = {
    delete: {
      title: 'Delete Student?',
      message: `This will permanently delete ${confirm.student?.name} and their user account. This cannot be undone.`,
      confirmLabel: 'Delete',
      confirmClass: 'bg-red-600 hover:bg-red-700',
    },
    deactivate: {
      title: 'Deactivate Student?',
      message: `${confirm.student?.name}'s account will be disabled.`,
      confirmLabel: 'Deactivate',
      confirmClass: 'bg-amber-500 hover:bg-amber-600',
    },
    activate: {
      title: 'Activate Student?',
      message: `Re-enable ${confirm.student?.name}'s account.`,
      confirmLabel: 'Activate',
      confirmClass: 'bg-green-600 hover:bg-green-700',
    },
  }[confirm.action] ?? {};

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Students</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${filtered.length} of ${students.length} student${students.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm
                     font-semibold rounded-md hover:bg-blue-700 transition-colors self-start sm:self-auto"
        >
          + Add Student
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or student code…"
          className="w-full sm:max-w-sm pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {fetchErr && (
          <div className="px-5 py-3 bg-red-50 border-b border-red-100 text-sm text-red-700">{fetchErr}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-2">👤</p>
            <p className="text-sm font-medium">
              {search ? 'No students match your search.' : 'No students found.'}
            </p>
            {!search && (
              <button onClick={openAdd} className="mt-3 text-sm text-blue-600 hover:underline">
                Add the first student
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Name', 'Student Code', 'Email', 'Course', 'Year', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <StudentRow
                    key={s.id}
                    student={s}
                    canDelete={canDelete}
                    onView={() => setViewStudent(s)}
                    onEdit={() => openEdit(s)}
                    onActivate={() => askConfirm('activate', s)}
                    onDeactivate={() => askConfirm('deactivate', s)}
                    onDelete={() => askConfirm('delete', s)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={showForm}
        onClose={closeForm}
        title={editStudent ? `Edit — ${editStudent.name}` : 'Add New Student'}
        maxWidth="max-w-2xl"
      >
        <StudentForm
          student={editStudent}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          loading={formLoading}
          error={formError}
        />
      </Modal>

      {/* Detail Modal */}
      <StudentDetailModal student={viewStudent} onClose={() => setViewStudent(null)} />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirm.open}
        title={confirmText.title}
        message={confirmText.message}
        confirmLabel={confirmText.confirmLabel}
        confirmClass={confirmText.confirmClass}
        loading={confirm.loading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm({ open: false, action: null, student: null })}
      />

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}

// ── Row component ────────────────────────────────────────────────────────────
function StudentRow({ student: s, canDelete, onView, onEdit, onActivate, onDeactivate, onDelete }) {
  const isActive = s.is_active !== false && s.is_active !== 0;

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold
                          flex items-center justify-center shrink-0">
            {s.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="font-medium text-slate-800 whitespace-nowrap">{s.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono text-xs">{s.student_code}</td>
      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{s.email}</td>
      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{s.course ?? '—'}</td>
      <td className="px-4 py-3 text-slate-600 text-center">{s.year ?? '—'}</td>
      <td className="px-4 py-3">
        {isActive
          ? <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Active</span>
          : <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">Inactive</span>
        }
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <ActionBtn onClick={onView}  color="slate">View</ActionBtn>
          <ActionBtn onClick={onEdit}  color="blue">Edit</ActionBtn>
          {isActive
            ? <ActionBtn onClick={onDeactivate} color="amber">Deactivate</ActionBtn>
            : <ActionBtn onClick={onActivate}   color="green">Activate</ActionBtn>
          }
          {canDelete && <ActionBtn onClick={onDelete} color="red">Delete</ActionBtn>}
        </div>
      </td>
    </tr>
  );
}

function ActionBtn({ onClick, color, children }) {
  const colors = {
    slate: 'text-slate-600 hover:bg-slate-100',
    blue:  'text-blue-600 hover:bg-blue-50',
    amber: 'text-amber-600 hover:bg-amber-50',
    green: 'text-green-600 hover:bg-green-50',
    red:   'text-red-600 hover:bg-red-50',
  };
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${colors[color]}`}
    >
      {children}
    </button>
  );
}

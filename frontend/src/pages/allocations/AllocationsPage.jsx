import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllocations, createAllocation, vacateAllocation } from '../../api/allocations';
import { getHostels } from '../../api/hostels';
import Modal               from '../../components/common/Modal';
import ConfirmDialog       from '../../components/common/ConfirmDialog';
import Toast               from '../../components/common/Toast';
import AssignForm          from './AssignForm';
import AllocationDetailModal from './AllocationDetailModal';

const STATUS_TABS = ['all', 'active', 'vacated'];

/**
 * canFilterHostel — true for admin (shows hostel filter), false for warden
 */
export default function AllocationsPage({ canFilterHostel = false }) {
  const [allocations, setAllocations] = useState([]);
  const [hostels,     setHostels]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [fetchErr,    setFetchErr]    = useState('');

  // Filters
  const [search,        setSearch]        = useState('');
  const [filterHostel,  setFilterHostel]  = useState('');
  const [filterStatus,  setFilterStatus]  = useState('all');

  // Modals
  const [showAssign,    setShowAssign]    = useState(false);
  const [viewAlloc,     setViewAlloc]     = useState(null);

  // Vacate confirm
  const [confirm, setConfirm] = useState({ open: false, alloc: null, loading: false });

  // Form
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState('');

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = useCallback((msg, type = 'success') => setToast({ message: msg, type }), []);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchAllocations = useCallback(async () => {
    setLoading(true); setFetchErr('');
    try {
      const { data } = await getAllocations();
      setAllocations(data.allocations ?? []);
    } catch (err) {
      setFetchErr(err.response?.data?.message ?? 'Failed to load allocations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllocations(); }, [fetchAllocations]);

  // Admin: load hostels for filter
  useEffect(() => {
    if (!canFilterHostel) return;
    getHostels().then(({ data }) => setHostels(data.hostels ?? [])).catch(() => {});
  }, [canFilterHostel]);

  // ── Counts ───────────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:     allocations.length,
    active:  allocations.filter((a) => a.status === 'active').length,
    vacated: allocations.filter((a) => a.status === 'vacated').length,
  }), [allocations]);

  // ── Filter ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = allocations;
    if (filterStatus !== 'all') list = list.filter((a) => a.status === filterStatus);
    if (filterHostel) list = list.filter((a) => a.hostel_name === filterHostel);
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((a) =>
        a.student_name?.toLowerCase().includes(q) ||
        a.student_code?.toLowerCase().includes(q) ||
        a.room_number?.toLowerCase().includes(q) ||
        a.hostel_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allocations, filterStatus, filterHostel, search]);

  // ── Assign ───────────────────────────────────────────────────────────────
  async function handleAssign(payload) {
    setFormLoading(true); setFormError('');
    try {
      await createAllocation(payload);
      showToast('Room assigned successfully.');
      setShowAssign(false);
      fetchAllocations();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Assignment failed.');
    } finally {
      setFormLoading(false);
    }
  }

  // ── Vacate ───────────────────────────────────────────────────────────────
  async function handleVacate() {
    const a = confirm.alloc;
    setConfirm((c) => ({ ...c, loading: true }));
    try {
      await vacateAllocation(a.id);
      showToast(`Room vacated for ${a.student_name}.`);
      setConfirm({ open: false, alloc: null, loading: false });
      fetchAllocations();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Vacate failed.', 'error');
      setConfirm({ open: false, alloc: null, loading: false });
    }
  }

  // Unique hostel names from loaded data (for admin filter)
  const hostelNames = useMemo(() =>
    [...new Set(allocations.map((a) => a.hostel_name).filter(Boolean))],
    [allocations]
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Room Allocations</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${counts.active} active · ${counts.vacated} vacated`}
          </p>
        </div>
        <button
          onClick={() => { setFormError(''); setShowAssign(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm
                     font-semibold rounded-md hover:bg-blue-700 transition-colors self-start sm:self-auto"
        >
          + Assign Room
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors
              ${filterStatus === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab} <span className="ml-1 opacity-60">{counts[tab]}</span>
          </button>
        ))}
      </div>

      {/* Search + hostel filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, code, room or hostel…"
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Hostel filter — admin sees hostel names from data, or hostels list */}
        {canFilterHostel && (
          <select
            value={filterHostel}
            onChange={(e) => setFilterHostel(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Hostels</option>
            {hostelNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
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
            <p className="text-4xl mb-2">🛏</p>
            <p className="text-sm font-medium">
              {search || filterHostel || filterStatus !== 'all'
                ? 'No allocations match your filters.'
                : 'No allocations yet.'}
            </p>
            {!search && filterStatus !== 'all' && allocations.length === 0 && (
              <button
                onClick={() => { setFormError(''); setShowAssign(true); }}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Assign the first room
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[
                    'Student', 'Code',
                    ...(canFilterHostel ? ['Hostel'] : []),
                    'Room', 'Allocated On', 'Vacated On', 'Status', 'Actions'
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((a) => (
                  <AllocationRow
                    key={a.id}
                    alloc={a}
                    showHostel={canFilterHostel}
                    onView={() => setViewAlloc(a)}
                    onVacate={() => setConfirm({ open: true, alloc: a, loading: false })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      <Modal
        open={showAssign}
        onClose={() => setShowAssign(false)}
        title="Assign Room to Student"
        maxWidth="max-w-lg"
      >
        <AssignForm
          allocations={allocations}
          onSubmit={handleAssign}
          onCancel={() => setShowAssign(false)}
          loading={formLoading}
          error={formError}
        />
      </Modal>

      {/* Detail Modal */}
      <AllocationDetailModal allocation={viewAlloc} onClose={() => setViewAlloc(null)} />

      {/* Vacate Confirm */}
      <ConfirmDialog
        open={confirm.open}
        title="Vacate Room?"
        message={`Mark ${confirm.alloc?.student_name}'s allocation in room "${confirm.alloc?.room_number}" as vacated? This will free up the bed.`}
        confirmLabel="Vacate"
        confirmClass="bg-amber-500 hover:bg-amber-600"
        loading={confirm.loading}
        onConfirm={handleVacate}
        onCancel={() => setConfirm({ open: false, alloc: null, loading: false })}
      />

      <Toast message={toast.message} type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}

// ── Row ──────────────────────────────────────────────────────────────────────
function AllocationRow({ alloc: a, showHostel, onView, onVacate }) {
  const isActive = a.status === 'active';
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold
                          flex items-center justify-center shrink-0">
            {a.student_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="font-medium text-slate-800 whitespace-nowrap">{a.student_name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">{a.student_code}</td>
      {showHostel && (
        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{a.hostel_name}</td>
      )}
      <td className="px-4 py-3 font-mono font-semibold text-slate-800 whitespace-nowrap">{a.room_number}</td>
      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
        {a.allocated_date ? new Date(a.allocated_date).toLocaleDateString() : '—'}
      </td>
      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
        {a.vacated_date ? new Date(a.vacated_date).toLocaleDateString() : '—'}
      </td>
      <td className="px-4 py-3">
        {isActive
          ? <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">Active</span>
          : <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500 rounded-full">Vacated</span>
        }
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Btn color="slate" onClick={onView}>View</Btn>
          {isActive && <Btn color="amber" onClick={onVacate}>Vacate</Btn>}
        </div>
      </td>
    </tr>
  );
}

function Btn({ onClick, color, children }) {
  const cls = {
    slate: 'text-slate-600 hover:bg-slate-100',
    amber: 'text-amber-600 hover:bg-amber-50',
  };
  return (
    <button onClick={onClick}
      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${cls[color]}`}>
      {children}
    </button>
  );
}

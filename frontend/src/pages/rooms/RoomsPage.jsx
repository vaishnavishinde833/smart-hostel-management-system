import { useState, useEffect, useMemo, useCallback } from 'react';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../../api/rooms';
import { getHostels } from '../../api/hostels';
import { getMyHostel } from '../../api/hostels';
import Modal          from '../../components/common/Modal';
import ConfirmDialog  from '../../components/common/ConfirmDialog';
import Toast          from '../../components/common/Toast';
import RoomForm       from './RoomForm';
import RoomDetailModal from './RoomDetailModal';

const STATUS_COLORS = {
  available:   'bg-green-100 text-green-700',
  full:        'bg-red-100 text-red-700',
  maintenance: 'bg-amber-100 text-amber-700',
};

/**
 * canSelectHostel — true for admin (shows hostel filter), false for warden
 */
export default function RoomsPage({ canSelectHostel = false }) {
  const [rooms,    setRooms]    = useState([]);
  const [hostels,  setHostels]  = useState([]);      // for admin hostel filter / form
  const [myHostel, setMyHostel] = useState(null);    // for warden fixed hostel
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState('');

  // Filters
  const [search,          setSearch]          = useState('');
  const [filterHostel,    setFilterHostel]    = useState('');
  const [filterStatus,    setFilterStatus]    = useState('');

  // Modals
  const [showForm,  setShowForm]  = useState(false);
  const [editRoom,  setEditRoom]  = useState(null);
  const [viewRoom,  setViewRoom]  = useState(null);

  // Confirm delete
  const [confirm, setConfirm] = useState({ open: false, room: null, loading: false });

  // Form
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState('');

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = useCallback((msg, type = 'success') => setToast({ message: msg, type }), []);

  // ── Load data ────────────────────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    setLoading(true); setFetchErr('');
    try {
      const params = {};
      if (canSelectHostel && filterHostel) params.hostel_id = filterHostel;
      const { data } = await getRooms(params);
      setRooms(data.rooms ?? []);
    } catch (err) {
      setFetchErr(err.response?.data?.message ?? 'Failed to load rooms.');
    } finally {
      setLoading(false);
    }
  }, [canSelectHostel, filterHostel]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // Admin: load hostels for filter + form
  useEffect(() => {
    if (!canSelectHostel) return;
    getHostels()
      .then(({ data }) => setHostels(data.hostels ?? []))
      .catch(() => {});
  }, [canSelectHostel]);

  // Warden: load own hostel for form
  useEffect(() => {
    if (canSelectHostel) return;
    getMyHostel()
      .then(({ data }) => setMyHostel(data.hostel))
      .catch(() => {});
  }, [canSelectHostel]);

  // ── Client-side filters (search + status) ───────────────────────────────
  const filtered = useMemo(() => {
    let list = rooms;
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((r) =>
        r.room_number?.toLowerCase().includes(q) ||
        r.hostel_name?.toLowerCase().includes(q) ||
        String(r.floor).includes(q)
      );
    }
    if (filterStatus) {
      list = list.filter((r) => r.status === filterStatus);
    }
    return list;
  }, [rooms, search, filterStatus]);

  // ── Summary stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total    = rooms.length;
    const available = rooms.filter((r) => r.status === 'available').length;
    const full      = rooms.filter((r) => r.status === 'full').length;
    const maint     = rooms.filter((r) => r.status === 'maintenance').length;
    const capacity  = rooms.reduce((s, r) => s + Number(r.capacity ?? 0), 0);
    const occupied  = rooms.reduce((s, r) => s + Number(r.occupied_count ?? 0), 0);
    return { total, available, full, maint, capacity, occupied, beds: capacity - occupied };
  }, [rooms]);

  // ── Form submit ──────────────────────────────────────────────────────────
  async function handleFormSubmit(payload) {
    setFormLoading(true); setFormError('');
    try {
      if (editRoom) {
        await updateRoom(editRoom.id, payload);
        showToast(`Room ${payload.room_number} updated.`);
      } else {
        await createRoom(payload);
        showToast(`Room ${payload.room_number} created.`);
      }
      closeForm();
      fetchRooms();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setFormLoading(false);
    }
  }

  function openAdd()  { setEditRoom(null); setFormError(''); setShowForm(true); }
  function openEdit(r){ setEditRoom(r);    setFormError(''); setShowForm(true); }
  function closeForm(){ setShowForm(false); setEditRoom(null); setFormError(''); }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete() {
    const r = confirm.room;
    setConfirm((c) => ({ ...c, loading: true }));
    try {
      await deleteRoom(r.id);
      showToast(`Room ${r.room_number} deleted.`);
      setConfirm({ open: false, room: null, loading: false });
      fetchRooms();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Delete failed.', 'error');
      setConfirm({ open: false, room: null, loading: false });
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Rooms</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${filtered.length} of ${rooms.length} room${rooms.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm
                     font-semibold rounded-md hover:bg-blue-700 transition-colors self-start sm:self-auto">
          + Add Room
        </button>
      </div>

      {/* Stats strip */}
      {!loading && rooms.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatChip label="Total Rooms"     value={stats.total}     color="slate" />
          <StatChip label="Available Beds"  value={stats.beds}      color="green" />
          <StatChip label="Occupied Beds"   value={stats.occupied}  color="blue"  />
          <StatChip label="Maintenance"     value={stats.maint}     color="amber" />
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room, hostel, floor…"
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Hostel filter — admin only */}
        {canSelectHostel && hostels.length > 0 && (
          <select
            value={filterHostel}
            onChange={(e) => setFilterHostel(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Hostels</option>
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        )}

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="full">Full</option>
          <option value="maintenance">Maintenance</option>
        </select>
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
            <p className="text-4xl mb-2">🚪</p>
            <p className="text-sm font-medium">
              {search || filterStatus ? 'No rooms match your filters.' : 'No rooms yet.'}
            </p>
            {!search && !filterStatus && (
              <button onClick={openAdd} className="mt-3 text-sm text-blue-600 hover:underline">
                Add the first room
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Room No.', ...(canSelectHostel ? ['Hostel'] : []), 'Floor', 'Type', 'Capacity', 'Occupied', 'Available', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const avail = Number(r.capacity) - Number(r.occupied_count ?? 0);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {r.room_number}
                      </td>
                      {canSelectHostel && (
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.hostel_name}</td>
                      )}
                      <td className="px-4 py-3 text-slate-600 text-center">{r.floor ?? 0}</td>
                      <td className="px-4 py-3 text-slate-600 capitalize">{r.type}</td>
                      <td className="px-4 py-3 text-slate-600 text-center">{r.capacity}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${Number(r.occupied_count) > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                          {r.occupied_count ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${avail > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {avail}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize
                          ${STATUS_COLORS[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <Btn color="slate" onClick={() => setViewRoom(r)}>View</Btn>
                          <Btn color="blue"  onClick={() => openEdit(r)}>Edit</Btn>
                          <Btn color="red"   onClick={() => setConfirm({ open: true, room: r, loading: false })}>Delete</Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={showForm}
        onClose={closeForm}
        title={editRoom ? `Edit Room — ${editRoom.room_number}` : 'Add New Room'}
      >
        <RoomForm
          room={editRoom}
          hostels={canSelectHostel ? hostels : []}
          fixedHostel={!canSelectHostel ? myHostel : null}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          loading={formLoading}
          error={formError}
        />
      </Modal>

      {/* Detail Modal */}
      <RoomDetailModal room={viewRoom} onClose={() => setViewRoom(null)} />

      {/* Confirm delete */}
      <ConfirmDialog
        open={confirm.open}
        title="Delete Room?"
        message={`Delete room "${confirm.room?.room_number}"? This cannot be undone. Rooms with active occupants cannot be deleted.`}
        confirmLabel="Delete"
        confirmClass="bg-red-600 hover:bg-red-700"
        loading={confirm.loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, room: null, loading: false })}
      />

      <Toast message={toast.message} type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}

function StatChip({ label, value, color }) {
  const colors = { slate: 'text-slate-700', green: 'text-green-600', blue: 'text-blue-600', amber: 'text-amber-600' };
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-0.5 ${colors[color]}`}>{value}</p>
    </div>
  );
}

function Btn({ onClick, color, children }) {
  const cls = { slate: 'text-slate-600 hover:bg-slate-100', blue: 'text-blue-600 hover:bg-blue-50', red: 'text-red-600 hover:bg-red-50' };
  return (
    <button onClick={onClick} className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${cls[color]}`}>
      {children}
    </button>
  );
}

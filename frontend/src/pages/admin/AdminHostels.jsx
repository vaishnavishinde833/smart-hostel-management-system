import { useState, useEffect, useMemo, useCallback } from 'react';
import { getHostels, createHostel, updateHostel, deleteHostel } from '../../api/hostels';
import Modal            from '../../components/common/Modal';
import ConfirmDialog    from '../../components/common/ConfirmDialog';
import Toast            from '../../components/common/Toast';
import HostelForm       from '../hostels/HostelForm';
import HostelDetailModal from '../hostels/HostelDetailModal';

export default function AdminHostels() {
  const [hostels,  setHostels]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState('');

  const [search, setSearch] = useState('');

  const [showForm,   setShowForm]   = useState(false);
  const [editHostel, setEditHostel] = useState(null);
  const [viewHostel, setViewHostel] = useState(null);

  const [confirm, setConfirm] = useState({ open: false, hostel: null, loading: false });

  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState('');

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchHostels = useCallback(async () => {
    setLoading(true); setFetchErr('');
    try {
      const { data } = await getHostels();
      setHostels(data.hostels ?? []);
    } catch (err) {
      setFetchErr(err.response?.data?.message ?? 'Failed to load hostels.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHostels(); }, [fetchHostels]);

  // Build a de-duped list of known wardens from hostel data for the form dropdown
  const knownWardens = useMemo(() => {
    const seen = new Map();
    hostels.forEach((h) => {
      if (h.warden_id && h.warden_name && !seen.has(h.warden_id)) {
        seen.set(h.warden_id, { id: h.warden_id, name: h.warden_name });
      }
    });
    return [...seen.values()];
  }, [hostels]);

  // ── Search ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return hostels;
    return hostels.filter((h) =>
      h.name?.toLowerCase().includes(q) ||
      h.address?.toLowerCase().includes(q) ||
      h.warden_name?.toLowerCase().includes(q)
    );
  }, [hostels, search]);

  // ── Form submit ──────────────────────────────────────────────────────────
  async function handleFormSubmit(payload) {
    setFormLoading(true); setFormError('');
    try {
      if (editHostel) {
        await updateHostel(editHostel.id, payload);
        showToast(`${payload.name} updated.`);
      } else {
        await createHostel(payload);
        showToast(`${payload.name} created.`);
      }
      closeForm();
      fetchHostels();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setFormLoading(false);
    }
  }

  function openAdd()  { setEditHostel(null); setFormError(''); setShowForm(true); }
  function openEdit(h){ setEditHostel(h);    setFormError(''); setShowForm(true); }
  function closeForm(){ setShowForm(false);  setEditHostel(null); setFormError(''); }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete() {
    const h = confirm.hostel;
    setConfirm((c) => ({ ...c, loading: true }));
    try {
      await deleteHostel(h.id);
      showToast(`${h.name} deleted.`);
      setConfirm({ open: false, hostel: null, loading: false });
      fetchHostels();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Delete failed.', 'error');
      setConfirm({ open: false, hostel: null, loading: false });
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Hostels</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${filtered.length} of ${hostels.length} hostel${hostels.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm
                     font-semibold rounded-md hover:bg-blue-700 transition-colors self-start sm:self-auto"
        >
          + Add Hostel
        </button>
      </div>

      {/* Search */}
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
          placeholder="Search by name, address or warden…"
          className="w-full sm:max-w-sm pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Table */}
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
            <p className="text-4xl mb-2">🏢</p>
            <p className="text-sm font-medium">
              {search ? 'No hostels match your search.' : 'No hostels yet.'}
            </p>
            {!search && (
              <button onClick={openAdd} className="mt-3 text-sm text-blue-600 hover:underline">
                Add the first hostel
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Hostel Name', 'Address', 'Assigned Warden', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 text-sm font-bold
                                        flex items-center justify-center shrink-0">
                          🏢
                        </div>
                        <span className="font-medium text-slate-800 whitespace-nowrap">{h.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                      {h.address || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {h.warden_name
                        ? <span className="text-slate-700">{h.warden_name}
                            <span className="ml-1 text-xs text-slate-400">(ID: {h.warden_id})</span>
                          </span>
                        : <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                            Unassigned
                          </span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <Btn onClick={() => setViewHostel(h)} color="slate">View</Btn>
                        <Btn onClick={() => openEdit(h)}      color="blue">Edit</Btn>
                        <Btn onClick={() => setConfirm({ open: true, hostel: h, loading: false })} color="red">Delete</Btn>
                      </div>
                    </td>
                  </tr>
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
        title={editHostel ? `Edit — ${editHostel.name}` : 'Add New Hostel'}
      >
        <HostelForm
          hostel={editHostel}
          knownWardens={knownWardens}
          isAdmin={true}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          loading={formLoading}
          error={formError}
        />
      </Modal>

      {/* Detail Modal */}
      <HostelDetailModal hostel={viewHostel} onClose={() => setViewHostel(null)} />

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirm.open}
        title="Delete Hostel?"
        message={`Permanently delete "${confirm.hostel?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmClass="bg-red-600 hover:bg-red-700"
        loading={confirm.loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, hostel: null, loading: false })}
      />

      <Toast message={toast.message} type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}

function Btn({ onClick, color, children }) {
  const cls = {
    slate: 'text-slate-600 hover:bg-slate-100',
    blue:  'text-blue-600 hover:bg-blue-50',
    red:   'text-red-600 hover:bg-red-50',
  };
  return (
    <button onClick={onClick}
      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${cls[color]}`}>
      {children}
    </button>
  );
}

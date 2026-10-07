import { useState, useEffect, useCallback } from 'react';
import { getMyHostel, updateHostel } from '../../api/hostels';
import Modal     from '../../components/common/Modal';
import Toast     from '../../components/common/Toast';
import HostelForm from '../hostels/HostelForm';

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-slate-100 last:border-0">
      <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide sm:w-40 shrink-0">{label}</dt>
      <dd className="text-sm text-slate-800">{value || <span className="text-slate-400">—</span>}</dd>
    </div>
  );
}

export default function WardenHostel() {
  const [hostel,  setHostel]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchErr,setFetchErr]= useState('');

  const [showEdit,    setShowEdit]    = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState('');

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = useCallback((msg, type = 'success') => setToast({ message: msg, type }), []);

  const fetchHostel = useCallback(async () => {
    setLoading(true); setFetchErr('');
    try {
      const { data } = await getMyHostel();
      setHostel(data.hostel);
    } catch (err) {
      if (err.response?.status === 404) {
        setFetchErr('No hostel is assigned to you yet. Contact the admin.');
      } else {
        setFetchErr(err.response?.data?.message ?? 'Failed to load hostel.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHostel(); }, [fetchHostel]);

  async function handleEdit(payload) {
    setFormLoading(true); setFormError('');
    try {
      await updateHostel(hostel.id, payload);
      showToast('Hostel updated successfully.');
      setShowEdit(false);
      fetchHostel();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Update failed.');
    } finally {
      setFormLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-7 h-7 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchErr) {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-6 text-center">
          <p className="text-2xl mb-2">🏢</p>
          <p className="text-sm text-amber-800 font-medium">{fetchErr}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Hostel</h2>
          <p className="text-sm text-slate-500 mt-0.5">Your assigned hostel details</p>
        </div>
        <button
          onClick={() => { setFormError(''); setShowEdit(true); }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md
                     hover:bg-blue-700 transition-colors shrink-0"
        >
          Edit Details
        </button>
      </div>

      {/* Hostel card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Card header */}
        <div className="bg-blue-600 px-6 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 text-white text-2xl flex items-center justify-center">
            🏢
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{hostel.name}</h3>
            <p className="text-sm text-blue-100">{hostel.address || 'No address on file'}</p>
          </div>
        </div>

        {/* Details */}
        <dl className="px-6 py-2">
          <InfoRow label="Hostel ID"       value={hostel.id} />
          <InfoRow label="Name"            value={hostel.name} />
          <InfoRow label="Address"         value={hostel.address} />
          <InfoRow label="Assigned Warden" value={hostel.warden_name} />
        </dl>
      </div>

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Hostel">
        <HostelForm
          hostel={hostel}
          isAdmin={false}       /* warden cannot change warden_id */
          onSubmit={handleEdit}
          onCancel={() => setShowEdit(false)}
          loading={formLoading}
          error={formError}
        />
      </Modal>

      <Toast message={toast.message} type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}

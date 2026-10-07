import Modal from '../../components/common/Modal';

export default function HostelDetailModal({ hostel, onClose }) {
  if (!hostel) return null;

  const rows = [
    ['Hostel ID',       hostel.id],
    ['Name',            hostel.name],
    ['Address',         hostel.address || '—'],
    ['Assigned Warden', hostel.warden_name || '—'],
    ['Warden User ID',  hostel.warden_id  || '—'],
    ['Created',         hostel.created_at ? new Date(hostel.created_at).toLocaleDateString() : '—'],
  ];

  return (
    <Modal open={Boolean(hostel)} onClose={onClose} title="Hostel Details">
      {/* Icon + name header */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100 mb-4">
        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 text-xl font-bold
                        flex items-center justify-center shrink-0">
          🏢
        </div>
        <div>
          <p className="font-semibold text-slate-900">{hostel.name}</p>
          <p className="text-xs text-slate-500">{hostel.address || 'No address provided'}</p>
        </div>
      </div>

      <dl className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between items-start gap-4">
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide shrink-0 w-36">
              {label}
            </dt>
            <dd className="text-sm text-slate-800 text-right break-words">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300
                     rounded-md hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

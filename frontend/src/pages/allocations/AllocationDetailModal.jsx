import Modal from '../../components/common/Modal';

function StatusBadge({ status }) {
  return status === 'active'
    ? <span className="px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">Active</span>
    : <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full">Vacated</span>;
}

export default function AllocationDetailModal({ allocation: a, onClose }) {
  if (!a) return null;

  const rows = [
    ['Allocation ID',  a.id],
    ['Student',        a.student_name],
    ['Student Code',   a.student_code],
    ['Hostel',         a.hostel_name],
    ['Room',           a.room_number],
    ['Status',         <StatusBadge status={a.status} />],
    ['Allocated On',   a.allocated_date ? new Date(a.allocated_date).toLocaleDateString() : '—'],
    ['Vacated On',     a.vacated_date   ? new Date(a.vacated_date).toLocaleDateString()   : '—'],
  ];

  return (
    <Modal open={Boolean(a)} onClose={onClose} title="Allocation Details">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100 mb-4">
        <div className="w-11 h-11 rounded-full bg-blue-600 text-white text-base font-bold
                        flex items-center justify-center shrink-0">
          {a.student_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{a.student_name}</p>
          <p className="text-xs text-slate-500 font-mono">{a.student_code}</p>
        </div>
        <div className="ml-auto shrink-0"><StatusBadge status={a.status} /></div>
      </div>

      <dl className="space-y-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between items-center gap-4">
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide shrink-0">{label}</dt>
            <dd className="text-sm text-slate-800 font-medium text-right">{value ?? '—'}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex justify-end">
        <button onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300
                     rounded-md hover:bg-slate-50">
          Close
        </button>
      </div>
    </Modal>
  );
}

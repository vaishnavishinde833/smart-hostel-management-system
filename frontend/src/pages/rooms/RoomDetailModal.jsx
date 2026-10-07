import Modal from '../../components/common/Modal';

function StatusBadge({ status }) {
  const cfg = {
    available:   'bg-green-100 text-green-700',
    full:        'bg-red-100 text-red-700',
    maintenance: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${cfg[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

export default function RoomDetailModal({ room, onClose }) {
  if (!room) return null;

  const available = Number(room.capacity) - Number(room.occupied_count ?? 0);

  const rows = [
    ['Room Number',  room.room_number],
    ['Hostel',       room.hostel_name],
    ['Floor',        room.floor ?? 0],
    ['Type',         <span className="capitalize">{room.type}</span>],
    ['Capacity',     room.capacity],
    ['Occupied',     room.occupied_count ?? 0],
    ['Available',    available],
    ['Status',       <StatusBadge status={room.status} />],
  ];

  return (
    <Modal open={Boolean(room)} onClose={onClose} title="Room Details">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100 mb-4">
        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 text-xl font-bold
                        flex items-center justify-center shrink-0">
          🚪
        </div>
        <div>
          <p className="font-bold text-slate-900 text-lg">{room.room_number}</p>
          <p className="text-xs text-slate-500">{room.hostel_name}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={room.status} />
        </div>
      </div>

      {/* Bed visual */}
      <div className="mb-4 p-3 bg-slate-50 rounded-lg flex items-center gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{room.occupied_count ?? 0}</p>
          <p className="text-xs text-slate-500">Occupied</p>
        </div>
        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, ((room.occupied_count ?? 0) / (room.capacity || 1)) * 100)}%` }}
          />
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{available}</p>
          <p className="text-xs text-slate-500">Available</p>
        </div>
      </div>

      <dl className="space-y-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between items-center gap-4">
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</dt>
            <dd className="text-sm text-slate-800 font-medium">{value}</dd>
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

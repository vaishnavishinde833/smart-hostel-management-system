import { useState, useEffect } from 'react';

const TYPES    = ['single', 'double', 'triple'];
const STATUSES = ['available', 'full', 'maintenance'];

/**
 * Add / Edit room form rendered inside a Modal.
 * Props:
 *   room         — null = add, object = edit
 *   hostels      — [{id, name}] for hostel selector (admin only)
 *   fixedHostel  — {id, name} when hostel is pre-fixed (warden)
 *   onSubmit(payload), onCancel, loading, error
 */
export default function RoomForm({ room, hostels = [], fixedHostel, onSubmit, onCancel, loading, error }) {
  const isEdit = Boolean(room);

  const [hostelId,    setHostelId]    = useState('');
  const [roomNumber,  setRoomNumber]  = useState('');
  const [floor,       setFloor]       = useState('0');
  const [type,        setType]        = useState('double');
  const [capacity,    setCapacity]    = useState('2');
  const [status,      setStatus]      = useState('available');

  useEffect(() => {
    if (room) {
      setHostelId(String(room.hostel_id ?? ''));
      setRoomNumber(room.room_number ?? '');
      setFloor(String(room.floor ?? 0));
      setType(room.type ?? 'double');
      setCapacity(String(room.capacity ?? 2));
      setStatus(room.status ?? 'available');
    } else {
      setHostelId(fixedHostel ? String(fixedHostel.id) : (hostels[0]?.id ? String(hostels[0].id) : ''));
      setRoomNumber(''); setFloor('0'); setType('double'); setCapacity('2'); setStatus('available');
    }
  }, [room, fixedHostel, hostels]);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      hostel_id:   Number(hostelId),
      room_number: roomNumber.trim(),
      floor:       Number(floor),
      type,
      capacity:    Number(capacity),
      ...(isEdit ? { status } : {}),
    });
  }

  const showHostelPicker = !fixedHostel && hostels.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Hostel */}
      {fixedHostel ? (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Hostel</label>
          <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700">
            {fixedHostel.name}
          </div>
        </div>
      ) : showHostelPicker ? (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Hostel *</label>
          <select
            required
            value={hostelId}
            onChange={(e) => setHostelId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Select hostel —</option>
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        {/* Room Number */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">Room Number *</label>
          <input
            type="text"
            required
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="e.g. 101, A-01"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Floor */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Floor</label>
          <input
            type="number"
            min={0}
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Room Type *</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
          >
            {TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Capacity *</label>
          <input
            type="number"
            required
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status — edit only */}
        {isEdit && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} disabled={loading}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300
                     rounded-md hover:bg-slate-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md
                     hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Room'}
        </button>
      </div>
    </form>
  );
}

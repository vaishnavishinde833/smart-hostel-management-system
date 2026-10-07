import { useState, useEffect, useMemo } from 'react';
import { getStudents }      from '../../api/students';
import { getAvailableRooms } from '../../api/rooms';

/**
 * Props:
 *   allocations   — already loaded list (to detect existing active allocation)
 *   onSubmit({student_id, room_id, allocated_date})
 *   onCancel
 *   loading, error
 */
export default function AssignForm({ allocations = [], onSubmit, onCancel, loading, error }) {
  const [students,       setStudents]       = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [dataLoading,    setDataLoading]    = useState(true);

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [roomSearch, setRoomSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [allocDate, setAllocDate] = useState(new Date().toISOString().slice(0, 10));

  // Load students + available rooms
  useEffect(() => {
    setDataLoading(true);
    Promise.all([getStudents(), getAvailableRooms()])
      .then(([s, r]) => {
        setStudents(s.data.students ?? []);
        setAvailableRooms(r.data.rooms ?? []);
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, []);

  // Active allocation for selected student (from already-loaded list)
  const existingAlloc = useMemo(() => {
    if (!selectedStudent) return null;
    return allocations.find(
      (a) => a.student_id === selectedStudent.id && a.status === 'active'
    ) ?? null;
  }, [selectedStudent, allocations]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase().trim();
    if (!q) return students.slice(0, 30); // show first 30 when no search
    return students.filter((s) =>
      s.name?.toLowerCase().includes(q) ||
      s.student_code?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [students, studentSearch]);

  // Filtered available rooms
  const filteredRooms = useMemo(() => {
    const q = roomSearch.toLowerCase().trim();
    if (!q) return availableRooms.slice(0, 30);
    return availableRooms.filter((r) =>
      r.room_number?.toLowerCase().includes(q) ||
      r.hostel_name?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [availableRooms, roomSearch]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedStudent || !selectedRoom) return;
    onSubmit({
      student_id: selectedStudent.id,
      room_id:    selectedRoom.id,
      allocated_date: allocDate,
    });
  }

  const availBeds = selectedRoom
    ? Number(selectedRoom.capacity) - Number(selectedRoom.occupied_count ?? selectedRoom.available_beds != null ? selectedRoom.available_beds : 0)
    : null;

  // available_beds comes from findAvailable query; fall back to capacity if not present
  const bedsLeft = selectedRoom
    ? (selectedRoom.available_beds != null
        ? Number(selectedRoom.available_beds)
        : Number(selectedRoom.capacity) - Number(selectedRoom.occupied_count ?? 0))
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {dataLoading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Student picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Select Student *
            </label>
            <input
              type="text"
              placeholder="Search by name, code or email…"
              value={studentSearch}
              onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudent(null); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mb-1
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="border border-slate-200 rounded-md overflow-y-auto max-h-36 bg-white">
              {filteredStudents.length === 0
                ? <p className="px-3 py-2 text-xs text-slate-400">No students found</p>
                : filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setSelectedStudent(s); setStudentSearch(s.name); }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-blue-50
                        ${selectedStudent?.id === s.id ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700'}`}
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="ml-2 text-xs text-slate-400 font-mono">{s.student_code}</span>
                    </button>
                  ))
              }
            </div>

            {/* Warning: student already has active allocation */}
            {existingAlloc && (
              <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
                ⚠ This student already has an active allocation in room{' '}
                <strong>{existingAlloc.room_number}</strong> ({existingAlloc.hostel_name}).
                The backend will reject a duplicate assignment.
              </div>
            )}
          </div>

          {/* Room picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Select Available Room *
              {availableRooms.length === 0 && (
                <span className="ml-2 font-normal text-amber-600">— no available rooms</span>
              )}
            </label>
            <input
              type="text"
              placeholder="Search by room number or hostel…"
              value={roomSearch}
              onChange={(e) => { setRoomSearch(e.target.value); setSelectedRoom(null); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mb-1
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="border border-slate-200 rounded-md overflow-y-auto max-h-36 bg-white">
              {filteredRooms.length === 0
                ? <p className="px-3 py-2 text-xs text-slate-400">No available rooms</p>
                : filteredRooms.map((r) => {
                    const beds = r.available_beds != null ? Number(r.available_beds)
                      : Number(r.capacity) - Number(r.occupied_count ?? 0);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => { setSelectedRoom(r); setRoomSearch(`${r.room_number} (${r.hostel_name})`); }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-blue-50
                          ${selectedRoom?.id === r.id ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700'}`}
                      >
                        <span className="font-mono font-semibold">{r.room_number}</span>
                        <span className="ml-2 text-xs text-slate-500">{r.hostel_name}</span>
                        <span className="ml-auto float-right text-xs text-green-600 font-medium">
                          {beds} bed{beds !== 1 ? 's' : ''} free
                        </span>
                      </button>
                    );
                  })
              }
            </div>

            {/* Selected room details */}
            {selectedRoom && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  ['Capacity',  selectedRoom.capacity],
                  ['Occupied',  selectedRoom.occupied_count ?? '—'],
                  ['Available', bedsLeft ?? '—'],
                ].map(([lbl, val]) => (
                  <div key={lbl} className="bg-slate-50 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-slate-800">{val}</p>
                    <p className="text-xs text-slate-400">{lbl}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Allocation date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Allocation Date
            </label>
            <input
              type="date"
              value={allocDate}
              onChange={(e) => setAllocDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} disabled={loading}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300
                     rounded-md hover:bg-slate-50 disabled:opacity-50">
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || dataLoading || !selectedStudent || !selectedRoom}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md
                     hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Assigning…' : 'Assign Room'}
        </button>
      </div>
    </form>
  );
}

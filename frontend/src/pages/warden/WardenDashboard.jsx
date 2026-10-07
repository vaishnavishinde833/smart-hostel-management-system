import { useEffect, useState } from 'react';
import api from '../../api/axios';

function StatCard({ label, value, color = 'blue' }) {
  const colors = {
    blue:  'text-blue-700',
    green: 'text-green-700',
    amber: 'text-amber-700',
    red:   'text-red-700',
    slate: 'text-slate-700',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colors[color] ?? colors.blue}`}>{value ?? '—'}</p>
    </div>
  );
}

export default function WardenDashboard() {
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/warden')
      .then((r) => setData(r.data.dashboard))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error)   return <p className="text-sm text-red-500">{error}</p>;

  const s = data.stats;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Warden Dashboard</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {data.hostel.name} — {data.hostel.address}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard label="Students"            value={s.hostel_students}       color="blue"  />
        <StatCard label="Rooms"               value={s.total_rooms}           color="slate" />
        <StatCard label="Total Capacity"      value={s.total_capacity}        color="slate" />
        <StatCard label="Occupied Beds"       value={s.occupied_beds}         color="amber" />
        <StatCard label="Available Beds"      value={s.available_beds}        color="green" />
        <StatCard label="Active Allocations"  value={s.active_allocations}    color="blue"  />
        <StatCard label="Pending Complaints"  value={s.pending_complaints}    color="red"   />
        <StatCard label="Pending Leaves"      value={s.pending_leave_requests} color="amber" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <RecentList title="Recent Complaints" items={data.recent_complaints}
          renderItem={(c) => <span>{c.student_name} — <em>{c.category}</em> [{c.status}]</span>} />
        <RecentList title="Pending Leave Requests" items={data.recent_leave_requests}
          renderItem={(l) => <span>{l.student_name} ({l.from_date?.slice(0, 10)} → {l.to_date?.slice(0, 10)})</span>} />
        <RecentList title="Recent Notices" items={data.recent_notices}
          renderItem={(n) => <span>{n.title}</span>} />
      </div>
    </div>
  );
}

function RecentList({ title, items = [], renderItem }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">None</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="text-xs text-slate-600 border-b border-slate-100 pb-1.5 last:border-0">
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function StudentDashboard() {
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/student')
      .then((r) => setData(r.data.dashboard))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error)   return <p className="text-sm text-red-500">{error}</p>;

  const { profile, current_allocation, stats, recent_complaints, recent_leave_requests, notices } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Welcome, {profile.name}</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {profile.course} · Year {profile.year} · {profile.student_code}
        </p>
      </div>

      {/* Allocation card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Room Allocation</h3>
        {current_allocation ? (
          <div className="text-sm text-slate-700 space-y-1">
            <p><span className="text-slate-500">Room:</span> {current_allocation.room_number}</p>
            <p><span className="text-slate-500">Hostel:</span> {current_allocation.hostel_name ?? '—'}</p>
            <p><span className="text-slate-500">Since:</span> {current_allocation.allocation_date?.slice(0, 10)}</p>
          </div>
        ) : (
          <p className="text-sm text-amber-600">No active room allocation.</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Complaints',  value: stats.total_complaints   },
          { label: 'Pending Complaints',value: stats.pending_complaints, red: true },
          { label: 'Total Leaves',      value: stats.total_leaves       },
          { label: 'Pending Leaves',    value: stats.pending_leaves, amber: true },
        ].map(({ label, value, red, amber }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${red ? 'text-red-600' : amber ? 'text-amber-600' : 'text-slate-800'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid md:grid-cols-3 gap-4">
        <SmallList title="My Recent Complaints" items={recent_complaints}
          renderItem={(c) => `${c.category} — ${c.status}`} />
        <SmallList title="My Recent Leaves" items={recent_leave_requests}
          renderItem={(l) => `${l.from_date?.slice(0,10)} → ${l.to_date?.slice(0,10)} [${l.status}]`} />
        <SmallList title="Notices" items={notices}
          renderItem={(n) => n.title} />
      </div>
    </div>
  );
}

function SmallList({ title, items = [], renderItem }) {
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

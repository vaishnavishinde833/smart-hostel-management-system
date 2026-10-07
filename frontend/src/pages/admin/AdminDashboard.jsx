import { useEffect, useState } from 'react';
import api from '../../api/axios';

function StatCard({ label, value, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-700',
    green:  'bg-green-50 text-green-700',
    amber:  'bg-amber-50 text-amber-700',
    red:    'bg-red-50 text-red-700',
    slate:  'bg-slate-50 text-slate-700',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colors[color] ?? colors.blue} px-2 py-0.5 rounded inline-block`}>
        {value ?? '—'}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/admin')
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
        <h2 className="text-xl font-bold text-slate-900">Admin Dashboard</h2>
        <p className="text-sm text-slate-500 mt-0.5">System-wide overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard label="Total Students"      value={s.total_students}       color="blue"  />
        <StatCard label="Hostels"             value={s.total_hostels}        color="slate" />
        <StatCard label="Rooms"               value={s.total_rooms}          color="slate" />
        <StatCard label="Total Capacity"      value={s.total_capacity}       color="slate" />
        <StatCard label="Occupied Beds"       value={s.occupied_beds}        color="amber" />
        <StatCard label="Available Beds"      value={s.available_beds}       color="green" />
        <StatCard label="Active Allocations"  value={s.active_allocations}   color="blue"  />
        <StatCard label="Pending Complaints"  value={s.pending_complaints}   color="red"   />
        <StatCard label="Pending Leaves"      value={s.pending_leave_requests} color="amber" />
      </div>

      {/* Recent rows */}
      <div className="grid md:grid-cols-3 gap-4">
        <RecentTable title="Recent Complaints" rows={data.recent_complaints}
          cols={[{k:'student_name',h:'Student'},{k:'category',h:'Category'},{k:'status',h:'Status'}]} />
        <RecentTable title="Recent Leave Requests" rows={data.recent_leave_requests}
          cols={[{k:'student_name',h:'Student'},{k:'from_date',h:'From'},{k:'status',h:'Status'}]} />
        <RecentTable title="Recent Notices" rows={data.recent_notices}
          cols={[{k:'title',h:'Title'},{k:'target_role',h:'For'},{k:'author_name',h:'By'}]} />
      </div>
    </div>
  );
}

function RecentTable({ title, rows = [], cols }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-xs text-slate-400 text-center">No data</p>
      ) : (
        <table className="w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              {cols.map((c) => (
                <th key={c.k} className="px-3 py-2 text-left font-medium text-slate-500">{c.h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                {cols.map((c) => (
                  <td key={c.k} className="px-3 py-2 text-slate-700 truncate max-w-[120px]">
                    {String(row[c.k] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

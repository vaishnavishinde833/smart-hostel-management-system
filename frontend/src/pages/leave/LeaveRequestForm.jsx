import { useState } from 'react';

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function LeaveRequestForm({ onSubmit, onCancel, loading, error }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');
  const [reason,   setReason]   = useState('');

  const dateError =
    fromDate && toDate && fromDate > toDate
      ? 'End date cannot be before start date.'
      : '';

  function handleSubmit(e) {
    e.preventDefault();
    if (dateError) return;
    onSubmit({ from_date: fromDate, to_date: toDate, reason: reason.trim() });
  }

  const canSubmit = fromDate && toDate && reason.trim() && !dateError && !loading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">From Date *</label>
          <input
            type="date"
            required
            value={fromDate}
            min={today()}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">To Date *</label>
          <input
            type="date"
            required
            value={toDate}
            min={fromDate || today()}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {dateError && (
        <p className="text-xs text-red-600">{dateError}</p>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Reason *</label>
        <textarea
          required
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe the reason for your leave…"
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-none
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-slate-400">{reason.length} / 500 characters</p>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} disabled={loading}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300
                     rounded-md hover:bg-slate-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={!canSubmit}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md
                     hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? 'Submitting…' : 'Submit Request'}
        </button>
      </div>
    </form>
  );
}

import { useState, useEffect } from 'react';

/**
 * Add / Edit hostel form.
 * Props:
 *   hostel       — null = add mode, object = edit mode
 *   knownWardens — [{id, name}] built from the already-loaded hostels list
 *   isAdmin      — true = show warden assignment field
 *   onSubmit(payload)
 *   onCancel
 *   loading, error
 */
export default function HostelForm({ hostel, knownWardens = [], isAdmin, onSubmit, onCancel, loading, error }) {
  const isEdit = Boolean(hostel);

  const [name,      setName]      = useState('');
  const [address,   setAddress]   = useState('');
  const [wardenId,  setWardenId]  = useState('');

  useEffect(() => {
    if (hostel) {
      setName(hostel.name      ?? '');
      setAddress(hostel.address ?? '');
      setWardenId(hostel.warden_id ? String(hostel.warden_id) : '');
    } else {
      setName(''); setAddress(''); setWardenId('');
    }
  }, [hostel]);

  function handleSubmit(e) {
    e.preventDefault();
    const payload = { name: name.trim(), address: address.trim() || undefined };
    if (isAdmin) {
      payload.warden_id = wardenId ? Number(wardenId) : null;
    }
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Hostel Name *</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Block A - Boys"
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
        <textarea
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Full address (optional)"
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-none
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Warden assignment — admin only */}
      {isAdmin && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Assigned Warden</label>

          {/* Quick-select from already-known wardens */}
          {knownWardens.length > 0 && (
            <select
              value={wardenId}
              onChange={(e) => setWardenId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mb-2
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">— No warden (unassigned) —</option>
              {knownWardens.map((w) => (
                <option key={w.id} value={w.id}>{w.name} (ID: {w.id})</option>
              ))}
            </select>
          )}

          {/* Manual ID input for wardens not yet assigned to any hostel */}
          <input
            type="number"
            min={1}
            value={wardenId}
            onChange={(e) => setWardenId(e.target.value)}
            placeholder="Or type warden User ID directly"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-slate-400">
            User must exist with role <span className="font-mono">warden</span>. Leave blank to unassign.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300
                     rounded-md hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md
                     hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Hostel'}
        </button>
      </div>
    </form>
  );
}

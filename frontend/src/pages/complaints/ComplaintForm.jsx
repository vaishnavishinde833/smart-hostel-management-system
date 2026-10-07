import { useState } from 'react';

const CATEGORIES = ['maintenance', 'food', 'security', 'hygiene', 'other'];

export default function ComplaintForm({ onSubmit, onCancel, loading, error }) {
  const [category,    setCategory]    = useState('other');
  const [description, setDescription] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ category, description: description.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white capitalize
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="capitalize">{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Description *</label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your complaint in detail…"
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-none
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-slate-400">{description.length} / 1000 characters</p>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} disabled={loading}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300
                     rounded-md hover:bg-slate-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={loading || !description.trim()}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md
                     hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? 'Submitting…' : 'Submit Complaint'}
        </button>
      </div>
    </form>
  );
}

import { useState } from 'react';

const TARGET_ROLES = ['all', 'student', 'warden'];

const TARGET_LABEL = { all: 'Everyone', student: 'Students only', warden: 'Wardens only' };

/**
 * Props:
 *   initial    — existing notice for edit mode (null for create)
 *   onSubmit({ title, content, target_role }) → called by parent
 *   onCancel
 *   loading
 *   error
 */
export default function NoticeForm({ initial = null, onSubmit, onCancel, loading, error }) {
  const [title,      setTitle]      = useState(initial?.title       ?? '');
  const [content,    setContent]    = useState(initial?.content     ?? '');
  const [targetRole, setTargetRole] = useState(initial?.target_role ?? 'all');

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ title: title.trim(), content: content.trim(), target_role: targetRole });
  }

  const canSubmit = title.trim() && content.trim() && !loading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notice title"
          maxLength={200}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Content *</label>
        <textarea
          required
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write the notice content here…"
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-none
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-slate-400">{content.length} characters</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Target Audience</label>
        <select
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TARGET_ROLES.map((r) => (
            <option key={r} value={r}>{TARGET_LABEL[r]}</option>
          ))}
        </select>
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
          {loading ? 'Saving…' : initial ? 'Save Changes' : 'Publish Notice'}
        </button>
      </div>
    </form>
  );
}

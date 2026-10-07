import { useState } from 'react';
import Modal from '../../components/common/Modal';

const STATUSES   = ['pending', 'in_progress', 'resolved', 'rejected'];
const TERMINAL   = ['resolved', 'rejected'];

const STATUS_CFG = {
  pending:    { cls: 'bg-amber-100 text-amber-700',  label: 'Pending'     },
  in_progress:{ cls: 'bg-blue-100 text-blue-700',    label: 'In Progress' },
  resolved:   { cls: 'bg-green-100 text-green-700',  label: 'Resolved'    },
  rejected:   { cls: 'bg-red-100 text-red-700',      label: 'Rejected'    },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? { cls: 'bg-slate-100 text-slate-600', label: status };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

/**
 * Props:
 *   complaint    — the complaint object
 *   canManage    — true for admin/warden (shows status update form)
 *   onClose
 *   onUpdate(id, {status, response}) → Promise — called when admin/warden submits update
 */
export default function ComplaintDetailModal({ complaint: c, canManage, onClose, onUpdate }) {
  const [status,   setStatus]   = useState(c?.status ?? 'pending');
  const [response, setResponse] = useState(c?.response ?? '');
  const [saving,   setSaving]   = useState(false);
  const [saveErr,  setSaveErr]  = useState('');

  // Sync local state if complaint prop changes
  if (c && status !== c.status && !saving) {
    setStatus(c.status);
    setResponse(c.response ?? '');
  }

  if (!c) return null;

  const isTerminal = TERMINAL.includes(c.status);

  async function handleUpdate(e) {
    e.preventDefault();
    setSaving(true); setSaveErr('');
    try {
      await onUpdate(c.id, { status, response: response.trim() || undefined });
      onClose();
    } catch (err) {
      setSaveErr(err.response?.data?.message ?? 'Update failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={Boolean(c)} onClose={onClose} title="Complaint Details" maxWidth="max-w-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-slate-400">#{c.id}</span>
            <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded capitalize">
              {c.category}
            </span>
            <StatusBadge status={c.status} />
          </div>
          {c.student_name && (
            <p className="text-sm font-medium text-slate-800 mt-1">
              {c.student_name}
              {c.student_code && (
                <span className="ml-2 text-xs text-slate-400 font-mono">{c.student_code}</span>
              )}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-0.5">
            {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { year:'numeric',month:'short',day:'numeric' }) : ''}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</p>
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{c.description}</p>
      </div>

      {/* Response (read-only view for student / already has response) */}
      {c.response && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Response</p>
          <p className="text-sm text-blue-800 whitespace-pre-wrap">{c.response}</p>
        </div>
      )}

      {/* Status update form — admin / warden only */}
      {canManage && !isTerminal && (
        <form onSubmit={handleUpdate} className="border-t border-slate-100 pt-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Update Status</p>

          {saveErr && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {saveErr}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">New Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_CFG[s]?.label ?? s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Response (optional)</label>
            <textarea
              rows={3}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write a response to the student…"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300
                         rounded-md hover:bg-slate-50 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md
                         hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save Update'}
            </button>
          </div>
        </form>
      )}

      {/* Terminal state notice for admin/warden */}
      {canManage && isTerminal && (
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400 italic">
            This complaint is {c.status} and cannot be updated further.
          </p>
          <div className="mt-3 flex justify-end">
            <button onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300
                         rounded-md hover:bg-slate-50">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Student close button */}
      {!canManage && (
        <div className="flex justify-end mt-4">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300
                       rounded-md hover:bg-slate-50">
            Close
          </button>
        </div>
      )}
    </Modal>
  );
}

export { StatusBadge };

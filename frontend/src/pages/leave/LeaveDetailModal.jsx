import { useState } from 'react';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const STATUS_CFG = {
  pending:  { cls: 'bg-amber-100 text-amber-700',  label: 'Pending'  },
  approved: { cls: 'bg-green-100 text-green-700',  label: 'Approved' },
  rejected: { cls: 'bg-red-100 text-red-700',      label: 'Rejected' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? { cls: 'bg-slate-100 text-slate-600', label: status };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function dayCount(from, to) {
  if (!from || !to) return null;
  const diff = (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24) + 1;
  return diff > 0 ? diff : null;
}

/**
 * Props:
 *   leave      — leave request object
 *   canManage  — true for admin/warden
 *   onClose
 *   onApprove(id, { remarks }) → Promise
 *   onReject(id, { remarks })  → Promise
 */
export default function LeaveDetailModal({ leave: l, canManage, onClose, onApprove, onReject }) {
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject' | null
  const [remarks,       setRemarks]       = useState('');
  const [acting,        setActing]        = useState(false);
  const [actionErr,     setActionErr]     = useState('');

  if (!l) return null;

  const isPending  = l.status === 'pending';
  const days       = dayCount(l.from_date, l.to_date);

  async function handleAction() {
    setActing(true); setActionErr('');
    try {
      const payload = remarks.trim() ? { remarks: remarks.trim() } : {};
      if (confirmAction === 'approve') {
        await onApprove(l.id, payload);
      } else {
        await onReject(l.id, payload);
      }
      setConfirmAction(null);
      onClose();
    } catch (err) {
      setActionErr(err.response?.data?.message ?? 'Action failed. Please try again.');
      setActing(false);
    }
  }

  const confirmLabel = confirmAction === 'approve' ? 'Approve' : 'Reject';
  const confirmClass = confirmAction === 'approve'
    ? 'bg-green-600 hover:bg-green-700'
    : 'bg-red-600 hover:bg-red-700';

  return (
    <>
      <Modal open={Boolean(l)} onClose={onClose} title="Leave Request Details" maxWidth="max-w-lg">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-400">#{l.id}</span>
              <StatusBadge status={l.status} />
              {days && (
                <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded">
                  {days} day{days !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {l.student_name && (
              <p className="text-sm font-medium text-slate-800 mt-1">
                {l.student_name}
                {l.student_code && (
                  <span className="ml-2 text-xs text-slate-400 font-mono">{l.student_code}</span>
                )}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-0.5">Submitted {fmt(l.created_at)}</p>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-400 mb-0.5">From</p>
            <p className="text-sm font-semibold text-slate-700">{fmt(l.from_date)}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-400 mb-0.5">To</p>
            <p className="text-sm font-semibold text-slate-700">{fmt(l.to_date)}</p>
          </div>
        </div>

        {/* Reason */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Reason</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{l.reason}</p>
        </div>

        {/* Approval info */}
        {l.status !== 'pending' && (
          <div className={`mb-4 p-3 rounded-lg border ${
            l.status === 'approved'
              ? 'bg-green-50 border-green-100'
              : 'bg-red-50 border-red-100'
          }`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
              l.status === 'approved' ? 'text-green-600' : 'text-red-600'
            }`}>
              {l.status === 'approved' ? 'Approved' : 'Rejected'} by
            </p>
            <p className={`text-sm font-medium ${
              l.status === 'approved' ? 'text-green-800' : 'text-red-800'
            }`}>
              {l.approved_by_name ?? 'Staff'}
            </p>
            {l.remarks && (
              <p className={`text-sm mt-1 ${
                l.status === 'approved' ? 'text-green-700' : 'text-red-700'
              }`}>
                {l.remarks}
              </p>
            )}
          </div>
        )}

        {/* Action buttons — staff, pending only */}
        {canManage && isPending && (
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</p>

            {actionErr && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {actionErr}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Remarks (optional)</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add optional remarks for the student…"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-none
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300
                           rounded-md hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={() => { setActionErr(''); setConfirmAction('reject'); }}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md
                           hover:bg-red-700 transition-colors">
                Reject
              </button>
              <button
                onClick={() => { setActionErr(''); setConfirmAction('approve'); }}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md
                           hover:bg-green-700 transition-colors">
                Approve
              </button>
            </div>
          </div>
        )}

        {/* Non-pending or student — just close */}
        {(!canManage || !isPending) && (
          <div className={`flex justify-end ${canManage ? 'border-t border-slate-100 pt-4' : 'mt-4'}`}>
            {canManage && !isPending && (
              <p className="flex-1 text-xs text-slate-400 italic self-center">
                This request is {l.status} and cannot be processed again.
              </p>
            )}
            <button onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300
                         rounded-md hover:bg-slate-50">
              Close
            </button>
          </div>
        )}
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={`${confirmLabel} Leave Request`}
        message={`Are you sure you want to ${confirmLabel.toLowerCase()} this leave request for ${l.student_name ?? 'the student'}?`}
        confirmLabel={confirmLabel}
        confirmClass={confirmClass}
        loading={acting}
        onConfirm={handleAction}
        onCancel={() => { setConfirmAction(null); setActing(false); }}
      />
    </>
  );
}

export { StatusBadge };

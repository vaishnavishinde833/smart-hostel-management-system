import Modal from '../../components/common/Modal';

const ROWS = [
  ['Student Code', 'student_code'],
  ['Email',        'email'],
  ['Phone',        'phone'],
  ['Course',       'course'],
  ['Year',         'year'],
  ['Parent Name',  'parent_name'],
  ['Parent Phone', 'parent_phone'],
];

function Badge({ active }) {
  return active
    ? <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Active</span>
    : <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">Inactive</span>;
}

export default function StudentDetailModal({ student, onClose }) {
  if (!student) return null;

  return (
    <Modal open={Boolean(student)} onClose={onClose} title="Student Details">
      {/* Header row */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100 mb-4">
        <div className="w-12 h-12 rounded-full bg-blue-600 text-white text-lg font-bold flex items-center justify-center shrink-0">
          {student.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{student.name}</p>
          <Badge active={student.is_active !== false && student.is_active !== 0} />
        </div>
      </div>

      {/* Detail grid */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
        {ROWS.map(([label, key]) => (
          <div key={key}>
            <dt className="text-xs text-slate-400 uppercase tracking-wide">{label}</dt>
            <dd className="text-sm text-slate-800 font-medium mt-0.5 break-words">
              {student[key] ?? <span className="text-slate-400">—</span>}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300
                     rounded-md hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

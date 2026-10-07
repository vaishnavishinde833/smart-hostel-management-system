import { useState, useEffect } from 'react';

const INITIAL = {
  name: '', email: '', password: '', phone: '',
  student_code: '', course: '', year: '', parent_name: '', parent_phone: '',
};

/**
 * Add / Edit student form rendered inside a Modal.
 * Props: student (null = add mode), onSubmit(formData), onCancel, loading, error
 */
export default function StudentForm({ student, onSubmit, onCancel, loading, error }) {
  const isEdit = Boolean(student);
  const [form, setForm] = useState(INITIAL);

  useEffect(() => {
    if (student) {
      setForm({
        name:         student.name         ?? '',
        email:        student.email        ?? '',
        password:     '',                          // never pre-fill password
        phone:        student.phone        ?? '',
        student_code: student.student_code ?? '',
        course:       student.course       ?? '',
        year:         student.year         ?? '',
        parent_name:  student.parent_name  ?? '',
        parent_phone: student.parent_phone ?? '',
      });
    } else {
      setForm(INITIAL);
    }
  }, [student]);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form };
    if (isEdit && !payload.password) delete payload.password; // don't send empty password on edit
    if (payload.year) payload.year = Number(payload.year);
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name *" required value={form.name} onChange={set('name')} />
        <Field label="Email *" type="email" required value={form.email} onChange={set('email')} />
        <Field
          label={isEdit ? 'New Password (leave blank to keep)' : 'Password *'}
          type="password"
          required={!isEdit}
          value={form.password}
          onChange={set('password')}
          placeholder={isEdit ? '••••••••' : ''}
        />
        <Field label="Phone" value={form.phone} onChange={set('phone')} />
        <Field label="Student Code *" required value={form.student_code} onChange={set('student_code')} />
        <Field label="Course *" required value={form.course} onChange={set('course')} placeholder="e.g. MCA" />
        <Field
          label="Year *"
          type="number"
          required
          min={1} max={6}
          value={form.year}
          onChange={set('year')}
          placeholder="1"
        />
        <Field label="Parent Name" value={form.parent_name} onChange={set('parent_name')} />
        <Field label="Parent Phone" value={form.parent_phone} onChange={set('parent_phone')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
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
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Student'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, type = 'text', required, value, onChange, placeholder, min, max }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   placeholder-slate-400"
      />
    </div>
  );
}

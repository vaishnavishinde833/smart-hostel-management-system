import { useEffect } from 'react';

/**
 * type: 'success' | 'error' | 'info'
 * onClose called after duration ms (default 3500)
 */
export default function Toast({ message, type = 'success', onClose, duration = 3500 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: 'bg-green-600',
    error:   'bg-red-600',
    info:    'bg-blue-600',
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
                  text-white text-sm font-medium max-w-xs animate-fade-in
                  ${styles[type] ?? styles.info}`}
    >
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">
        ×
      </button>
    </div>
  );
}

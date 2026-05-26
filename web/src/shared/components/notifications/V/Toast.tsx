import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@app/store'; // Adjust path to your hooks
import { hideToast, selectToast } from '@features/ui/uiSlice'; // Adjust path to your uiSlice
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const Toast: React.FC = () => {
  const dispatch = useAppDispatch();
  const { open, message, type } = useAppSelector(selectToast);

  // Automatically hide toast after 4 seconds
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      dispatch(hideToast());
    }, 4000);

    return () => clearTimeout(timer);
  }, [open, dispatch]);

  if (!open) return null;

  // Style configurations based on toast type
  const styles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: <Info className="w-5 h-5 text-blue-500" />,
    },
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-fade-in-up">
      <div className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg max-w-md ${currentStyle.bg}`}>
        {currentStyle.icon}
        <p className={`text-sm font-medium ${currentStyle.text}`}>{message}</p>
        <button
          onClick={() => dispatch(hideToast())}
          className="ml-auto p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Close notification"
        >
          <X className={`w-4 h-4 ${currentStyle.text}`} />
        </button>
      </div>
    </div>
  );
};

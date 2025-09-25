import React from 'react';
import type { Toast, ToastType } from '../types';
import { CheckCircleIcon, XCircleIcon, CloseIcon } from './icons/Icons';

interface ToastProps {
  toast: Toast;
  removeToast: (id: string) => void;
}

const ToastMessage: React.FC<ToastProps> = ({ toast, removeToast }) => {
  const iconMap: Record<ToastType, React.ReactNode> = {
    success: <CheckCircleIcon />,
    error: <XCircleIcon />,
    info: <CheckCircleIcon />,
  };

  const colorMap: Record<ToastType, string> = {
    success: 'text-green-500 dark:text-green-400',
    error: 'text-red-500 dark:text-red-400',
    info: 'text-blue-500 dark:text-blue-400',
  };

  return (
    <div className="bg-white dark:bg-slate-700 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden w-full max-w-sm">
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${colorMap[toast.type]}`}>
            {iconMap[toast.type]}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {toast.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => removeToast(toast.id)}
              className="rounded-md inline-flex text-slate-400 hover:text-slate-500 dark:text-slate-300 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <span className="sr-only">Close</span>
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map(toast => (
          <ToastMessage key={toast.id} toast={toast} removeToast={removeToast} />
        ))}
      </div>
    </div>
  );
};

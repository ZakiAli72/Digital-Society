import React from 'react';
import type { SimulatedEmail } from '../types';
import { CloseIcon, EmailIcon } from './icons/Icons';

interface EmailSimulationModalProps {
  email: SimulatedEmail;
  onClose: () => void;
}

export const EmailSimulationModal: React.FC<EmailSimulationModalProps> = ({ email, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-lg w-full relative">
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
                <div className="bg-primary-100 dark:bg-slate-700 text-primary-600 dark:text-primary-400 rounded-full p-2">
                    <EmailIcon />
                </div>
                <div className="ml-3">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Password Reset Email Simulation</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">This is what the sent email would look like.</p>
                </div>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200 rounded-full">
                <CloseIcon />
            </button>
        </div>

        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
            <div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Subject: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{email.subject}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{email.body}</p>
            </div>
        </div>

        <div className="mt-6 flex justify-end">
            <button
                onClick={onClose}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

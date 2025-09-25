import React from 'react';

export const Loader: React.FC = () => (
    <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center z-50">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-300 font-semibold">Loading Digital Society...</p>
    </div>
);
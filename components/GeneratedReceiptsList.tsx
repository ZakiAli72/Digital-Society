
import React, { useState, useMemo } from 'react';
import type { Receipt } from '../types';
import { SearchIcon, CalendarIcon, CloseIcon, TrashIcon } from './icons/Icons';
import { useDebounce } from '../hooks/useDebounce';
import { Highlight } from './Highlight';
import { ConfirmationModal } from './ConfirmationModal';

const MONTHS = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

interface GeneratedReceiptsListProps {
  receipts: Receipt[];
  onViewReceipt: (receiptId: string) => void;
  onDeleteReceipt: (receiptId: string) => void;
  isSuperAdminView?: boolean;
}

export const GeneratedReceiptsList: React.FC<GeneratedReceiptsListProps> = ({ receipts, onViewReceipt, onDeleteReceipt, isSuperAdminView = false }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [deletingReceipt, setDeletingReceipt] = useState<Receipt | null>(null);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const getPaymentPeriodString = (r: Receipt) => {
        const fromMonth = MONTHS[r.paymentFromMonth - 1].substring(0,3);
        const fromYear = r.paymentFromYear;
        const tillMonth = MONTHS[r.paymentTillMonth - 1].substring(0,3);
        const tillYear = r.paymentTillYear;
        
        if (fromYear === tillYear && fromMonth === tillMonth) {
            return `${fromMonth} ${fromYear}`;
        }
        return `${fromMonth} ${fromYear} - ${tillMonth} ${tillYear}`;
    }
    
    const filteredReceipts = useMemo(() => {
        let results = receipts;

        if (debouncedSearchQuery) {
            const searchTerms = debouncedSearchQuery.toLowerCase().split(' ').filter(term => term);
            if (searchTerms.length > 0) {
                 results = results.filter(r => {
                    const receiptText = `${r.memberName} ${r.receiptNumber} ${isSuperAdminView ? r.societyName : ''}`.toLowerCase();
                    return searchTerms.every(term => receiptText.includes(term));
                });
            }
        }

        if (dateFilter) {
            const [year, month, day] = dateFilter.split('-').map(Number);
            const filterDate = new Date(Date.UTC(year, month - 1, day));
            const filterDateStart = filterDate.getTime();
            const filterDateEnd = filterDateStart + 24 * 60 * 60 * 1000 - 1;

            results = results.filter(r => {
                const receiptDate = new Date(r.date).getTime();
                return receiptDate >= filterDateStart && receiptDate <= filterDateEnd;
            });
        }
        
        return results;
    }, [receipts, debouncedSearchQuery, dateFilter, isSuperAdminView]);

  return (
    <div className="space-y-8">
      {deletingReceipt && (
        <ConfirmationModal
            title={`Delete Receipt #${String(deletingReceipt.receiptNumber).padStart(4, '0')}`}
            message={`Are you sure? This will permanently delete this receipt and roll back the member's dues to ${MONTHS[deletingReceipt.paymentFromMonth - 1]} ${deletingReceipt.paymentFromYear}. This action is irreversible.`}
            onConfirm={() => {
                onDeleteReceipt(deletingReceipt.id);
                setDeletingReceipt(null);
            }}
            onCancel={() => setDeletingReceipt(null)}
            confirmText="Delete Receipt"
        />
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">{isSuperAdminView ? "All Receipts" : "Generated Receipts"}</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <CalendarIcon />
                </span>
                <input 
                    type="date"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                {dateFilter && (
                    <button onClick={() => setDateFilter('')} className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <CloseIcon className="h-4 w-4" />
                    </button>
                )}
            </div>
            <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <SearchIcon />
                </span>
                <input 
                    type="text"
                    placeholder={isSuperAdminView ? "Search by member, society, #" : "Search by member, #"}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                 {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <CloseIcon className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:shadow-slate-700/50">
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Receipt History</h2>
            <div className="max-h-[75vh] overflow-y-auto">
                {filteredReceipts.length > 0 ? (
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 sticky top-0 bg-white dark:bg-slate-800">
                            <tr>
                                <th className="py-2 px-2">#</th>
                                {isSuperAdminView && <th className="py-2 px-2 hidden sm:table-cell">Society</th>}
                                <th className="py-2 px-2">Member</th>
                                <th className="py-2 px-2 hidden md:table-cell">Date</th>
                                <th className="py-2 px-2 hidden md:table-cell">Period</th>
                                <th className="py-2 px-2 text-right">Amount</th>
                                <th className="py-2 px-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredReceipts.map(r => (
                                <tr key={r.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="py-3 px-2 font-mono text-primary-600 dark:text-primary-400 cursor-pointer" onClick={() => onViewReceipt(r.id)}>
                                        <Highlight text={String(r.receiptNumber).padStart(4, '0')} highlight={debouncedSearchQuery} />
                                    </td>
                                    {isSuperAdminView && <td className="py-3 px-2 text-slate-500 dark:text-slate-400 text-xs hidden sm:table-cell cursor-pointer" onClick={() => onViewReceipt(r.id)}> <Highlight text={r.societyName} highlight={debouncedSearchQuery} /></td>}
                                    <td className="py-3 px-2 font-medium text-slate-800 dark:text-slate-100 cursor-pointer" onClick={() => onViewReceipt(r.id)}>
                                        <Highlight text={r.memberName} highlight={debouncedSearchQuery} />
                                    </td>
                                    <td className="py-3 px-2 text-slate-500 dark:text-slate-400 text-xs hidden md:table-cell cursor-pointer" onClick={() => onViewReceipt(r.id)}>{new Date(r.date).toLocaleDateString()}</td>
                                    <td className="py-3 px-2 text-slate-500 dark:text-slate-400 text-xs hidden md:table-cell cursor-pointer" onClick={() => onViewReceipt(r.id)}>{getPaymentPeriodString(r)}</td>
                                    <td className="py-3 px-2 font-semibold text-slate-800 dark:text-slate-100 text-right cursor-pointer" onClick={() => onViewReceipt(r.id)}>₹{r.totalAmount.toLocaleString('en-IN')}</td>
                                    <td className="py-3 px-2 text-right">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingReceipt(r);
                                            }}
                                            className="text-red-500 dark:text-red-400 hover:text-red-700 p-1 rounded-full hover:bg-red-50 dark:hover:bg-slate-700"
                                            title={`Delete receipt #${String(r.receiptNumber).padStart(4, '0')}`}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-10">
                        {searchQuery || dateFilter ? 'No receipts found for your search.' : 'No receipts have been generated yet.'}
                    </p>
                )}
            </div>
        </div>
    </div>
  );
};

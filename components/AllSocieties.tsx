import React, { useState, useMemo } from 'react';
import type { Society, Member } from '../types';
import { TrashIcon, SearchIcon } from './icons/Icons';
import { ConfirmationModal } from './ConfirmationModal';
import { useToast } from '../App';
import { useDebounce } from '../hooks/useDebounce';
import { Highlight } from './Highlight';

interface AllSocietiesProps {
  societies: Society[];
  members: Member[];
  onDeleteSociety: (societyId: string) => void;
}

export const AllSocieties: React.FC<AllSocietiesProps> = ({ societies, members, onDeleteSociety }) => {
    const [deletingSociety, setDeletingSociety] = useState<Society | null>(null);
    const { addToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const getMemberCount = (societyId: string) => {
        return members.filter(m => m.societyId === societyId).length;
    };

    const handleDelete = () => {
        if (!deletingSociety) return;
        onDeleteSociety(deletingSociety.id);
        addToast(`Society "${deletingSociety.name}" and all its data have been deleted.`, 'success');
        setDeletingSociety(null);
    };

    const filteredSocieties = useMemo(() => {
        if (!debouncedSearchQuery) return societies;
        const searchTerms = debouncedSearchQuery.toLowerCase().split(' ').filter(term => term);
        if (searchTerms.length === 0) return societies;
        return societies.filter(s => {
            const societyText = `${s.name} ${s.address} ${s.registrationNumber}`.toLowerCase();
            return searchTerms.every(term => societyText.includes(term));
        });
    }, [societies, debouncedSearchQuery]);

    return (
        <div className="space-y-8">
            {deletingSociety && (
                <ConfirmationModal 
                    title="Delete Society"
                    message={`Are you sure you want to delete ${deletingSociety.name}? This will permanently delete the society, all its members, all receipts, and the admin account. This action cannot be undone.`}
                    onConfirm={handleDelete}
                    onCancel={() => setDeletingSociety(null)}
                />
            )}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">All Registered Societies</h1>
                <div className="relative w-full sm:w-64">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <SearchIcon />
                    </span>
                    <input 
                        type="text"
                        placeholder="Search societies..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:shadow-slate-700/50">
                <div className="max-h-[75vh] overflow-y-auto">
                    {filteredSocieties.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 sticky top-0 bg-white dark:bg-slate-800">
                                <tr>
                                    <th className="py-2 px-2">Society Name</th>
                                    <th className="py-2 px-2 hidden md:table-cell">Address</th>
                                    <th className="py-2 px-2 hidden sm:table-cell">Reg. Number</th>
                                    <th className="py-2 px-2 text-center">Members</th>
                                    <th className="py-2 px-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredSocieties.map(s => (
                                    <tr key={s.id}>
                                        <td className="py-3 px-2 font-medium text-slate-800 dark:text-slate-100">
                                            <Highlight text={s.name} highlight={debouncedSearchQuery} />
                                        </td>
                                        <td className="py-3 px-2 text-slate-600 dark:text-slate-300 hidden md:table-cell">
                                             <Highlight text={s.address || 'N/A'} highlight={debouncedSearchQuery} />
                                        </td>
                                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 text-xs hidden sm:table-cell">
                                            <Highlight text={s.registrationNumber || 'N/A'} highlight={debouncedSearchQuery} />
                                        </td>
                                        <td className="py-3 px-2 font-bold text-primary-600 dark:text-primary-400 text-center">{getMemberCount(s.id)}</td>
                                        <td className="py-3 px-2 text-center">
                                            <button onClick={() => setDeletingSociety(s)} className="text-red-500 dark:text-red-400 hover:text-red-700 p-1 rounded-full hover:bg-red-50 dark:hover:bg-slate-700">
                                                <TrashIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <p className="text-center text-slate-500 dark:text-slate-400 py-10">
                            {searchQuery ? 'No societies found for your search.' : 'No societies have been registered yet.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
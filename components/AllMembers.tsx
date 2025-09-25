import React, { useState, useMemo } from 'react';
import type { Member, Society } from '../types';
import { SearchIcon } from './icons/Icons';
import { useDebounce } from '../hooks/useDebounce';
import { Highlight } from './Highlight';

interface AllMembersProps {
  members: Member[];
  societies: Society[];
}

export const AllMembers: React.FC<AllMembersProps> = ({ members, societies }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const getSocietyName = (societyId: string) => {
        return societies.find(s => s.id === societyId)?.name || 'Unknown Society';
    };

    const filteredMembers = useMemo(() => {
        if (!debouncedSearchQuery) return members;
        const searchTerms = debouncedSearchQuery.toLowerCase().split(' ').filter(term => term);
        if (searchTerms.length === 0) return members;
        return members.filter(m => {
            const memberText = `${m.name} ${m.building} ${m.apartment} ${m.phone} ${getSocietyName(m.societyId)}`.toLowerCase();
            return searchTerms.every(term => memberText.includes(term));
        });
    }, [members, debouncedSearchQuery, societies]);

    return (
        <div className="space-y-8">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">All Members</h1>
                <div className="relative w-full sm:w-64">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <SearchIcon />
                    </span>
                    <input 
                        type="text"
                        placeholder="Search all members..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:shadow-slate-700/50">
                <div className="max-h-[75vh] overflow-y-auto">
                    {filteredMembers.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 sticky top-0 bg-white dark:bg-slate-800">
                                <tr>
                                    <th className="py-2 px-2">Member Name</th>
                                    <th className="py-2 px-2 hidden sm:table-cell">Address</th>
                                    <th className="py-2 px-2 hidden md:table-cell">Phone</th>
                                    <th className="py-2 px-2">Society</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredMembers.map(m => (
                                    <tr key={m.id}>
                                        <td className="py-3 px-2 font-medium text-slate-800 dark:text-slate-100">
                                            <Highlight text={m.name} highlight={debouncedSearchQuery} />
                                        </td>
                                        <td className="py-3 px-2 text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                                            <Highlight text={`${m.building} - ${m.apartment}`} highlight={debouncedSearchQuery} />
                                        </td>
                                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 text-xs hidden md:table-cell">
                                            <Highlight text={`${m.countryCode} ${m.phone}`} highlight={debouncedSearchQuery} />
                                        </td>
                                        <td className="py-3 px-2 font-medium text-primary-600 dark:text-primary-400 text-sm">
                                            <Highlight text={getSocietyName(m.societyId)} highlight={debouncedSearchQuery} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-10">
                             {searchQuery ? 'No members found for your search.' : 'No members have been added yet across all societies.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
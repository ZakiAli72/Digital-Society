import React from 'react';
import type { Society, Member, Receipt, View } from '../types';
import { BuildingStorefrontIcon, MembersIcon, ReceiptsIcon, CurrencyRupeeIcon } from './icons/Icons';

interface SuperAdminDashboardProps {
  societies: Society[];
  members: Member[];
  receipts: Receipt[];
  setView: (view: View) => void;
}

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; onClick?: () => void; }> = ({ title, value, icon, onClick }) => (
    <div 
      className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:shadow-slate-700/50 flex items-center justify-between ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105 transition-transform' : ''}`}
      onClick={onClick}
    >
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
      <div className="bg-primary-100 dark:bg-slate-700 text-primary-600 dark:text-primary-400 rounded-full p-3">
        {icon}
      </div>
    </div>
);

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ societies, members, receipts, setView }) => {
    const totalRevenue = receipts.reduce((sum, receipt) => sum + receipt.totalAmount, 0);
    const recentReceipts = [...receipts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    const getMemberCount = (societyId: string) => {
        return members.filter(m => m.societyId === societyId).length;
    };
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">Super Admin Dashboard</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Societies" value={societies.length} icon={<BuildingStorefrontIcon />} onClick={() => setView('all-societies')} />
                <StatCard title="Total Members" value={members.length} icon={<MembersIcon />} onClick={() => setView('all-members')} />
                <StatCard title="Total Receipts" value={receipts.length} icon={<ReceiptsIcon />} onClick={() => setView('generated-receipts')} />
                <StatCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} icon={<CurrencyRupeeIcon />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:shadow-slate-700/50">
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Societies Overview</h2>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {societies.length > 0 ? societies.map(society => (
                            <div key={society.id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{society.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{society.address}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-primary-600 dark:text-primary-400 text-lg">{getMemberCount(society.id)}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Members</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-slate-500 dark:text-slate-400 text-center py-8">No societies registered yet.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:shadow-slate-700/50">
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Recent Global Receipts</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                                    <th className="py-2">Society</th>
                                    <th className="py-2">Member</th>
                                    <th className="py-2">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentReceipts.length > 0 ? recentReceipts.map(receipt => (
                                    <tr key={receipt.id} className="border-b border-slate-100 dark:border-slate-700">
                                        <td className="py-3 text-sm text-slate-600 dark:text-slate-400">{receipt.societyName}</td>
                                        <td className="py-3 text-slate-700 dark:text-slate-300">{receipt.memberName}</td>
                                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-100">₹{receipt.totalAmount.toLocaleString('en-IN')}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="text-center text-slate-500 dark:text-slate-400 py-8">No receipts generated yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

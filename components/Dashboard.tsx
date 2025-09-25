import React from 'react';
import type { Society, Member, Receipt, View } from '../types';
import { SocietiesIcon, MembersIcon, ReceiptsIcon, ExclamationTriangleIcon } from './icons/Icons';

interface DashboardProps {
  societies: Society[];
  members: Member[];
  receipts: Receipt[];
  setView: (view: View) => void;
}

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; onClick?: () => void; iconBgClass?: string; }> = ({ title, value, icon, onClick, iconBgClass = 'bg-primary-100 dark:bg-slate-700 text-primary-600 dark:text-primary-400' }) => (
    <div 
      className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:shadow-slate-700/50 flex items-center justify-between h-full ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105 transition-transform' : ''}`}
      onClick={onClick}
    >
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
      <div className={`${iconBgClass} rounded-full p-3`}>
        {icon}
      </div>
    </div>
);

const getPaymentStatus = (member: Member): 'Pending' | 'Paid' | 'Not Set' => {
    if (!member.duesFromMonth || !member.duesFromYear) {
      return 'Not Set';
    }
    const dueDate = new Date(member.duesFromYear, member.duesFromMonth - 1, 1);
    const currentPeriodDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return dueDate <= currentPeriodDate ? 'Pending' : 'Paid';
};

const MONTHS = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];


export const Dashboard: React.FC<DashboardProps> = ({ societies, members, receipts, setView }) => {
    const recentReceipts = [...receipts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    const pendingMembers = members.filter(m => getPaymentStatus(m) === 'Pending');

    const getMemberCount = (societyId: string) => {
        return members.filter(m => m.societyId === societyId).length;
    };
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Societies" value={societies.length} icon={<SocietiesIcon />} onClick={() => setView('societies')} />
                <StatCard title="Total Members" value={members.length} icon={<MembersIcon />} onClick={() => setView('members')} />
                <StatCard title="Pending Dues" value={pendingMembers.length} icon={<ExclamationTriangleIcon />} onClick={() => setView('members')} iconBgClass="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" />
                <StatCard title="Total Receipts" value={receipts.length} icon={<ReceiptsIcon />} onClick={() => setView('generated-receipts')} />
            </div>

            {pendingMembers.length > 0 && (
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:shadow-slate-700/50">
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Members with Pending Dues</h2>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {pendingMembers.map(member => (
                            <div key={member.id} className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-red-800 dark:text-red-200">{member.name}</p>
                                    <p className="text-sm text-red-600 dark:text-red-400">{member.building} - {member.apartment}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-red-600 dark:text-red-400">Dues from</p>
                                    <p className="font-semibold text-red-800 dark:text-red-200">
                                        {member.duesFromMonth && member.duesFromYear ? `${MONTHS[member.duesFromMonth - 1].substring(0,3)} ${member.duesFromYear}` : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                            <p className="text-slate-500 dark:text-slate-400 text-center py-8">No societies added yet.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:shadow-slate-700/50">
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Recent Receipts</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                                    <th className="py-2">Receipt #</th>
                                    <th className="py-2">Member</th>
                                    <th className="py-2">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentReceipts.length > 0 ? recentReceipts.map(receipt => (
                                    <tr key={receipt.id} className="border-b border-slate-100 dark:border-slate-700">
                                        <td className="py-3 font-mono text-sm text-primary-600 dark:text-primary-400">{String(receipt.receiptNumber).padStart(4, '0')}</td>
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
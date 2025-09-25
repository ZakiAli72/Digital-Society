


import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Society, Member, Receipt, PaymentItem, View, BulkMemberPeriod } from '../types';
import { PlusIcon, InfoCircleIcon, SearchIcon, CloseIcon } from './icons/Icons';
import { useToast, useTime } from '../App';
import { useDebounce } from '../hooks/useDebounce';
import { Highlight } from './Highlight';

const MONTHS = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];
const DEFAULT_THANK_YOU_MESSAGE = "Thank you for your prompt payment! We appreciate your contribution to our community. 🙏✨";

const getPaymentStatus = (member: Member): 'Pending' | 'Paid' | 'Not Set' => {
    if (!member.duesFromMonth || !member.duesFromYear) {
      return 'Not Set';
    }
    const dueDate = new Date(member.duesFromYear, member.duesFromMonth - 1, 1);
    const currentPeriodDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return dueDate <= currentPeriodDate ? 'Pending' : 'Paid';
};

interface ReceiptsProps {
  society: Society;
  members: Member[];
  receipts: Receipt[];
  onViewReceipt: (receiptId: string) => void;
  setView: (view: View) => void;
  onAddReceipt: (newReceipt: Omit<Receipt, 'id'>) => string;
  onUpdateMemberDues: (memberId: string, dues: { duesFromMonth: number; duesFromYear: number; }) => void;
  onBulkGenerate: (memberPeriods: BulkMemberPeriod[], description?: string) => number;
}

export const Receipts: React.FC<ReceiptsProps> = ({ society, members, receipts, onViewReceipt, setView, onAddReceipt, onUpdateMemberDues, onBulkGenerate }) => {
  const { now } = useTime();
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  
  // Single Mode State
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [memberSearchInput, setMemberSearchInput] = useState('');
  const [isMemberSearchFocused, setIsMemberSearchFocused] = useState(false);
  const memberSearchRef = useRef<HTMLDivElement>(null);
  const [paymentFromMonth, setPaymentFromMonth] = useState<string>(String(now.getMonth() + 1));
  const [paymentFromYear, setPaymentFromYear] = useState<string>(String(now.getFullYear()));
  const [paymentTillMonth, setPaymentTillMonth] = useState<string>(String(now.getMonth() + 1));
  const [paymentTillYear, setPaymentTillYear] = useState<string>(String(now.getFullYear()));
  const [singleDescription, setSingleDescription] = useState(DEFAULT_THANK_YOU_MESSAGE);

  // Bulk Mode State
  type BulkPeriodState = { [memberId: string]: { month: number, year: number, tillMonth: number, tillYear: number } };
  const [selectedBulkMembers, setSelectedBulkMembers] = useState<Set<string>>(new Set());
  const [bulkPeriods, setBulkPeriods] = useState<BulkPeriodState>({});
  const [bulkDescription, setBulkDescription] = useState(DEFAULT_THANK_YOU_MESSAGE);

  // Search State for Bulk Mode
  const [bulkSearchQuery, setBulkSearchQuery] = useState('');
  const debouncedBulkSearchQuery = useDebounce(bulkSearchQuery, 300);

  const [error, setError] = useState('');
  const { addToast } = useToast();

  const [isFormDisabled, setIsFormDisabled] = useState(true);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  
  const commonSelectClass = "w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";
  const commonInputClass = commonSelectClass;

  const YEARS = useMemo(() => {
    const startYear = society.registrationYear || 2000;
    const endYear = 2050;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).reverse();
  }, [society.registrationYear]);

  const pendingMembers = useMemo(() => members.filter(m => getPaymentStatus(m) === 'Pending'), [members]);
  
  const filteredPendingMembersForSingle = useMemo(() => {
    if (!memberSearchInput) return [];
    const searchTerms = memberSearchInput.toLowerCase().split(' ').filter(term => term);
    if(searchTerms.length === 0) return [];

    return pendingMembers.filter(member => {
        const memberText = `${member.name} ${member.building} ${member.apartment} ${member.phone}`.toLowerCase();
        return searchTerms.every(term => memberText.includes(term));
    });
  }, [pendingMembers, memberSearchInput]);

  const filteredPendingMembersForBulk = useMemo(() => {
    if (!debouncedBulkSearchQuery) return pendingMembers;
    const searchTerms = debouncedBulkSearchQuery.toLowerCase().split(' ').filter(term => term);
    if(searchTerms.length === 0) return pendingMembers;

    return pendingMembers.filter(member => {
        const memberText = `${member.name} ${member.building} ${member.apartment} ${member.phone}`.toLowerCase();
        return searchTerms.every(term => memberText.includes(term));
    });
  }, [pendingMembers, debouncedBulkSearchQuery]);

  // Effect to manage form state when mode or member selection changes.
  // This replaces the previous complex effect to fix multiple bugs.
  useEffect(() => {
    // This effect should only manage the state for the 'single' receipt form.
    if (mode !== 'single') {
        // When not in single mode, ensure the form is reset to its default disabled state.
        setIsFormDisabled(true);
        return;
    }

    const member = members.find(m => m.id === selectedMemberId);

    if (member) {
        // A member is selected. Enable the form and populate it.
        setIsFormDisabled(false);
        setInfoMessage(null);
        setSingleDescription(DEFAULT_THANK_YOU_MESSAGE);

        if (member.duesFromMonth && member.duesFromYear) {
            // Member has pre-set dues, so lock the 'From' date.
            setPaymentFromMonth(String(member.duesFromMonth));
            setPaymentFromYear(String(member.duesFromYear));
            setPaymentTillMonth(String(member.duesFromMonth));
            setPaymentTillYear(String(member.duesFromYear));
        } else {
            // Member has no pre-set dues, default to current month and allow editing 'From' date.
            const currentMonth = String(now.getMonth() + 1);
            const currentYear = String(now.getFullYear());
            setPaymentFromMonth(currentMonth);
            setPaymentFromYear(currentYear);
            setPaymentTillMonth(currentMonth);
            setPaymentTillYear(currentYear);
            setInfoMessage("This member has no pending dues specified. Defaulted to the current month.");
        }
    } else {
        // No member is selected (e.g. user is typing in search box).
        // Disable the form until a member is chosen from the list.
        setIsFormDisabled(true);
        setInfoMessage('Please select a member to generate a receipt.');
        // Reset dates to current month/year when no member is selected
        const currentMonth = String(now.getMonth() + 1);
        const currentYear = String(now.getFullYear());
        setPaymentFromMonth(currentMonth);
        setPaymentFromYear(currentYear);
        setPaymentTillMonth(currentMonth);
        setPaymentTillYear(currentYear);
    }
  }, [selectedMemberId, mode, members, now]);


  // Effect for Bulk Mode Setup
  useEffect(() => {
      if (mode !== 'bulk') return;

      const initialPeriods: BulkPeriodState = {};
      pendingMembers.forEach(m => {
          if (m.duesFromMonth && m.duesFromYear) {
              initialPeriods[m.id] = { 
                  month: m.duesFromMonth, 
                  year: m.duesFromYear,
                  tillMonth: m.duesFromMonth,
                  tillYear: m.duesFromYear,
                };
          }
      });
      setBulkPeriods(initialPeriods);
  }, [mode, pendingMembers]);

  // Reset descriptions and search when switching modes
  useEffect(() => {
    setSingleDescription(DEFAULT_THANK_YOU_MESSAGE);
    setBulkDescription(DEFAULT_THANK_YOU_MESSAGE);
    setBulkSearchQuery('');
    setError('');
    
    // Clear single-mode specific state when switching away
    if (mode === 'bulk') {
        setSelectedMemberId('');
        setMemberSearchInput('');
    }

  }, [mode]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (memberSearchRef.current && !memberSearchRef.current.contains(event.target as Node)) {
            setIsMemberSearchFocused(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { totalAmount, calculatedItems, monthsCount } = useMemo(() => {
    if (mode !== 'single' || !selectedMemberId || !paymentFromMonth || !paymentFromYear || !paymentTillMonth || !paymentTillYear) {
        return { totalAmount: 0, calculatedItems: [], monthsCount: 0 };
    }

    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return { totalAmount: 0, calculatedItems: [], monthsCount: 0 };
    
    const fromDate = new Date(Number(paymentFromYear), Number(paymentFromMonth) - 1, 1);
    const tillDate = new Date(Number(paymentTillYear), Number(paymentTillMonth) - 1, 1);

    if (fromDate > tillDate) return { totalAmount: 0, calculatedItems: [], monthsCount: 0 };
    const months = (tillDate.getFullYear() - fromDate.getFullYear()) * 12 + (tillDate.getMonth() - fromDate.getMonth()) + 1;
    if (months <= 0) return { totalAmount: 0, calculatedItems: [], monthsCount: 0 };
    
    let items: PaymentItem[] = [];
    if (member.monthlyMaintenance > 0) items.push({ description: `Maintenance Bill (${months} month${months > 1 ? 's' : ''})`, amount: member.monthlyMaintenance * months });
    if (member.monthlyWaterBill > 0) items.push({ description: `Water Bill (${months} month${months > 1 ? 's' : ''})`, amount: member.monthlyWaterBill * months });
    member.otherBills.forEach(bill => {
        if(bill.amount > 0) items.push({ description: `${bill.name} (${months} month${months > 1 ? 's' : ''})`, amount: bill.amount * months });
    });
    
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    return { totalAmount: total, calculatedItems: items, monthsCount: months };
  }, [selectedMemberId, paymentFromMonth, paymentFromYear, paymentTillMonth, paymentTillYear, members, mode]);


  const handleSingleSubmit = () => {
    setError('');
    if (!selectedMemberId) return setError('Please select a member.');
    if (totalAmount <= 0 || calculatedItems.length === 0) return setError('The selected member must have billable items set, and the date range must be valid.');

    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return setError('Invalid member selected.');
    
    const newFromPeriod = parseInt(paymentFromYear) * 12 + parseInt(paymentFromMonth);
    const newTillPeriod = parseInt(paymentTillYear) * 12 + parseInt(paymentTillMonth);

    const isDuplicate = receipts.some(r => {
        if (r.memberId !== selectedMemberId) return false;
        const existingFromPeriod = r.paymentFromYear * 12 + r.paymentFromMonth;
        const existingTillPeriod = r.paymentTillYear * 12 + r.paymentTillMonth;
        return Math.max(newFromPeriod, existingFromPeriod) <= Math.min(newTillPeriod, existingTillPeriod);
    });

    if (isDuplicate) return setError('A receipt for this member covering this period (or part of it) already exists.');

    const societyReceipts = receipts.filter(r => r.societyId === society.id);
    const nextReceiptNumber = (Math.max(0, ...societyReceipts.map(r => r.receiptNumber)) || 0) + 1;

    const newReceipt: Omit<Receipt, 'id'> = {
      receiptNumber: nextReceiptNumber, date: new Date().toISOString(), societyId: society.id,
      societyName: society.name, memberId: member.id, memberName: member.name,
      items: calculatedItems, totalAmount: totalAmount,
      paymentFromMonth: parseInt(paymentFromMonth), paymentFromYear: parseInt(paymentFromYear),
      paymentTillMonth: parseInt(paymentTillMonth), paymentTillYear: parseInt(paymentTillYear),
      description: singleDescription.trim() || undefined,
    };

    const newReceiptId = onAddReceipt(newReceipt);
    
    const paymentTillDate = new Date(parseInt(paymentTillYear), parseInt(paymentTillMonth) - 1);
    const nextDueDate = new Date(paymentTillDate.setMonth(paymentTillDate.getMonth() + 1));
    onUpdateMemberDues(member.id, { duesFromMonth: nextDueDate.getMonth() + 1, duesFromYear: nextDueDate.getFullYear() });
    
    onViewReceipt(newReceiptId);
    setSelectedMemberId('');
    setMemberSearchInput('');
    setError('');
    setSingleDescription(DEFAULT_THANK_YOU_MESSAGE);
  };

  const handleBulkSubmit = () => {
    setError('');
    if (selectedBulkMembers.size === 0) {
        return setError('Please select at least one member.');
    }

    const memberPeriodsToGenerate: BulkMemberPeriod[] = [];
    for (const memberId of selectedBulkMembers) {
        const period = bulkPeriods[memberId];
        if (period && period.month && period.year && period.tillMonth && period.tillYear) {
             const fromDate = new Date(period.year, period.month - 1, 1);
             const tillDate = new Date(period.tillYear, period.tillMonth - 1, 1);
             if (fromDate <= tillDate) {
                memberPeriodsToGenerate.push({ memberId, ...period });
             }
        }
    }

    if (memberPeriodsToGenerate.length === 0) {
        return setError('No valid payment periods set for selected members. Ensure "From" date is not after "To" date.');
    }

    const generatedCount = onBulkGenerate(memberPeriodsToGenerate, bulkDescription);
    if (generatedCount > 0) {
        setView('generated-receipts');
    } else {
        addToast('No new receipts were generated. This might be due to invalid date ranges, zero-amount bills, or existing receipts.', 'info');
    }
    setSelectedBulkMembers(new Set());
    setBulkDescription(DEFAULT_THANK_YOU_MESSAGE);
  };
  
  const handleSelectAllBulk = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectedBulkMembers(new Set(filteredPendingMembersForBulk.map(m => m.id)));
    } else {
        setSelectedBulkMembers(new Set());
    }
  };

  const handleSelectBulkMember = (memberId: string, isSelected: boolean) => {
    setSelectedBulkMembers(prev => {
        const newSet = new Set(prev);
        if (isSelected) newSet.add(memberId);
        else newSet.delete(memberId);
        return newSet;
    });
  };

  const handleBulkPeriodChange = (memberId: string, field: 'tillMonth' | 'tillYear', value: string) => {
      setBulkPeriods(prev => ({
          ...prev,
          [memberId]: {
              ...(prev[memberId] || { month: 0, year: 0, tillMonth: 0, tillYear: 0 }),
              [field]: parseInt(value)
          }
      }));
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
        <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">Generate Receipt</h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 mt-2">Create new receipts for society members.</p>
        </div>
      
        <form onSubmit={(e) => { e.preventDefault(); mode === 'single' ? handleSingleSubmit() : handleBulkSubmit(); }} 
            className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-md dark:shadow-slate-700/50 space-y-6"
        >
            <div className="flex justify-between items-center">
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={() => setMode('single')} className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${mode === 'single' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>Single Receipt</button>
                    <button type="button" onClick={() => setMode('bulk')} className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${mode === 'bulk' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>Bulk Generate</button>
                </div>
                <button type="button" onClick={() => setView('generated-receipts')} className="text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
                    View History &rarr;
                </button>
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md">{error}</p>}
            
            {mode === 'single' ? (
              <>
                <div ref={memberSearchRef} className="relative space-y-4">
                    <div>
                        <label htmlFor="receiptMember" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Select Member</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><SearchIcon/></span>
                            <input
                                id="receiptMember"
                                type="text"
                                value={memberSearchInput}
                                onChange={e => {
                                    setMemberSearchInput(e.target.value);
                                    if(selectedMemberId) setSelectedMemberId('');
                                }}
                                onFocus={() => setIsMemberSearchFocused(true)}
                                placeholder="Start typing to search for a member..."
                                className={`${commonInputClass} pl-10`}
                                autoComplete="off"
                            />
                        </div>
                        {isMemberSearchFocused && memberSearchInput && !selectedMemberId && (
                            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-700 shadow-lg rounded-md border border-slate-200 dark:border-slate-600 max-h-60 overflow-y-auto">
                                {filteredPendingMembersForSingle.length > 0 ? (
                                    filteredPendingMembersForSingle.map(member => (
                                        <div key={member.id} onClick={() => { 
                                            setSelectedMemberId(member.id);
                                            setMemberSearchInput(member.name);
                                            setIsMemberSearchFocused(false);
                                         }} className="px-3 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 cursor-pointer">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{member.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{member.building} - {member.apartment}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-3 text-sm text-slate-500 text-center">No matching members with pending dues found.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {infoMessage && <div className="text-blue-600 dark:text-blue-400 text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md flex items-center gap-2"><InfoCircleIcon/><span>{infoMessage}</span></div>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Payment From</label>
                        <div className="grid grid-cols-2 gap-2">
                            <select disabled={isFormDisabled || !!members.find(m => m.id === selectedMemberId)?.duesFromMonth} value={paymentFromMonth} onChange={e => setPaymentFromMonth(e.target.value)} className={`${commonSelectClass} disabled:bg-slate-100 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed`}>{MONTHS.map((month, i) => <option key={month} value={i + 1}>{month}</option>)}</select>
                            <select disabled={isFormDisabled || !!members.find(m => m.id === selectedMemberId)?.duesFromYear} value={paymentFromYear} onChange={e => setPaymentFromYear(e.target.value)} className={`${commonSelectClass} disabled:bg-slate-100 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed`}>{YEARS.map(year => <option key={year} value={year}>{year}</option>)}</select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Payment Till</label>
                        <div className="grid grid-cols-2 gap-2">
                            <select disabled={isFormDisabled} value={paymentTillMonth} onChange={e => setPaymentTillMonth(e.target.value)} className={`${commonSelectClass} disabled:bg-slate-100 dark:disabled:bg-slate-700/50`}>{MONTHS.map((month, i) => <option key={month} value={i + 1}>{month}</option>)}</select>
                            <select disabled={isFormDisabled} value={paymentTillYear} onChange={e => setPaymentTillYear(e.target.value)} className={`${commonSelectClass} disabled:bg-slate-100 dark:disabled:bg-slate-700/50`}>{YEARS.map(year => <option key={year} value={year}>{year}</option>)}</select>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Description (Optional)</label>
                    <textarea id="description" rows={3} value={singleDescription} onChange={(e) => setSingleDescription(e.target.value)} placeholder="Add a note for the member, e.g., payment method, late fees, etc." className={`${commonInputClass} disabled:bg-slate-100 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed`} disabled={isFormDisabled}/>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg text-slate-700 dark:text-slate-200">Total Amount Due</span>
                        <span className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">₹{totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    {calculatedItems.length > 0 && <p className="text-right text-sm text-slate-500 dark:text-slate-400 mt-1">{monthsCount} month(s) of charges</p>}
                </div>
              </>
            ) : (
                <div className="space-y-4">
                     <div className="relative w-full">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><SearchIcon /></span>
                        <input 
                            type="text"
                            placeholder="Search members with pending dues..."
                            value={bulkSearchQuery}
                            onChange={e => setBulkSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                        {bulkSearchQuery && (
                            <button type="button" onClick={() => setBulkSearchQuery('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <CloseIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto border border-slate-300 dark:border-slate-600 rounded-md max-h-[50vh]">
                        {filteredPendingMembersForBulk.length > 0 ? (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-600 dark:text-slate-300 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-2 w-10">
                                            <input type="checkbox" onChange={handleSelectAllBulk} checked={selectedBulkMembers.size === filteredPendingMembersForBulk.length && filteredPendingMembersForBulk.length > 0} className="h-4 w-4 text-primary-600 rounded border-slate-400 focus:ring-primary-500"/>
                                        </th>
                                        <th className="p-2">Member</th>
                                        <th className="p-2">Payment From</th>
                                        <th className="p-2">Payment To</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {filteredPendingMembersForBulk.map(member => (
                                        <tr key={member.id} className={selectedBulkMembers.has(member.id) ? "bg-primary-50 dark:bg-primary-900/20" : ""}>
                                            <td className="p-2">
                                                <input type="checkbox" checked={selectedBulkMembers.has(member.id)} onChange={e => handleSelectBulkMember(member.id, e.target.checked)} className="h-4 w-4 text-primary-600 rounded border-slate-400 focus:ring-primary-500"/>
                                            </td>
                                            <td className="p-2 text-sm text-slate-700 dark:text-slate-200">
                                                <Highlight text={`${member.name} (${member.building}-${member.apartment})`} highlight={debouncedBulkSearchQuery} />
                                            </td>
                                            <td className="p-2">
                                                <div className="flex gap-2">
                                                     <select
                                                        value={bulkPeriods[member.id]?.month || ''}
                                                        className={`${commonSelectClass} text-sm`}
                                                        disabled={true}
                                                    >
                                                        {MONTHS.map((month, i) => <option key={month} value={i + 1}>{month}</option>)}
                                                    </select>
                                                    <select
                                                        value={bulkPeriods[member.id]?.year || ''}
                                                        className={`${commonSelectClass} text-sm`}
                                                        disabled={true}
                                                    >
                                                        {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="p-2">
                                                <div className="flex gap-2">
                                                     <select
                                                        value={bulkPeriods[member.id]?.tillMonth || ''}
                                                        onChange={e => handleBulkPeriodChange(member.id, 'tillMonth', e.target.value)}
                                                        className={`${commonSelectClass} text-sm`}
                                                        disabled={!selectedBulkMembers.has(member.id)}
                                                    >
                                                        {MONTHS.map((month, i) => <option key={month} value={i + 1}>{month}</option>)}
                                                    </select>
                                                    <select
                                                        value={bulkPeriods[member.id]?.tillYear || ''}
                                                        onChange={e => handleBulkPeriodChange(member.id, 'tillYear', e.target.value)}
                                                        className={`${commonSelectClass} text-sm`}
                                                        disabled={!selectedBulkMembers.has(member.id)}
                                                    >
                                                        {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                             <div className="text-center text-sm text-slate-500 dark:text-slate-400 p-4">
                                {bulkSearchQuery ? 'No matching members with pending dues found.' : 'No members have pending dues.'}
                            </div>
                        )}
                    </div>
                     <div className="space-y-2">
                        <label htmlFor="bulk-description" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Common Description (Optional)</label>
                        <textarea id="bulk-description" rows={3} value={bulkDescription} onChange={(e) => setBulkDescription(e.target.value)} placeholder="This note will be added to all generated receipts." className={commonInputClass}/>
                    </div>
                </div>
            )}

          <button disabled={(mode === 'single' && isFormDisabled) || (mode === 'bulk' && selectedBulkMembers.size === 0)} type="submit" className="w-full flex justify-center items-center bg-primary-600 text-white px-4 py-3 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors text-base font-semibold disabled:bg-primary-300 dark:disabled:bg-primary-800 disabled:cursor-not-allowed">
            <PlusIcon />
            <span className="ml-2">{mode === 'single' ? 'Generate Receipt' : `Generate for ${selectedBulkMembers.size} Members`}</span>
          </button>
        </form>
    </div>
  );
};
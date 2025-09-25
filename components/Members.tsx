import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Society, Member, OtherBill, View, Country } from '../types';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, CalendarIcon, CloseIcon } from './icons/Icons';
import { useToast, useTime } from '../App';
import { ConfirmationModal } from './ConfirmationModal';
import { useDebounce } from '../hooks/useDebounce';
import { Highlight } from './Highlight';
import { COUNTRIES } from '../countries';

const MONTHS = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

const getCountryFlag = (iso: string) => iso.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));

const validatePhone = (phone: string, country: Country | undefined): { isValid: boolean; message: string | null } => {
    if (!country?.phoneLength) return { isValid: true, message: null };
    
    const len = phone.trim().length;
    const expected = country.phoneLength;
    
    // An empty phone number is considered valid by this function;
    // the required field validation is handled separately.
    if (len === 0) return { isValid: true, message: null };

    if (typeof expected === 'number') {
        if (len !== expected) {
            return { isValid: false, message: `For ${country.name}, the phone number must be ${expected} digits.` };
        }
    } else if (Array.isArray(expected)) {
        if (!expected.includes(len)) {
            return { isValid: false, message: `For ${country.name}, the phone number must be ${expected.join(' or ')} digits long.` };
        }
    }
    return { isValid: true, message: null };
};


// --- Reusable Searchable Country Code Selector ---
const CountryCodeSelector: React.FC<{
    selectedCode: string;
    onSelect: (code: string) => void;
}> = ({ selectedCode, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredCountries = useMemo(() => 
        COUNTRIES.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            c.code.includes(searchTerm)
        ), [searchTerm]);

    const selectedCountry = useMemo(() => COUNTRIES.find(c => c.code === selectedCode) || COUNTRIES.find(c => c.iso === 'IN'), [selectedCode]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (country: Country) => {
        onSelect(country.code);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-left">
                <span>{getCountryFlag(selectedCountry!.iso)} {selectedCountry!.code}</span>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-700 shadow-lg rounded-md border border-slate-200 dark:border-slate-600 max-h-60 overflow-y-auto">
                    <div className="p-2">
                        <input type="text" placeholder="Search country..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-500 rounded-md"/>
                    </div>
                    <ul>
                        {filteredCountries.map(country => (
                            <li key={country.iso} onClick={() => handleSelect(country)} className="px-3 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 cursor-pointer flex items-center gap-2">
                                <span>{getCountryFlag(country.iso)}</span>
                                <span className="text-sm text-slate-800 dark:text-slate-200">{country.name}</span>
                                <span className="text-sm text-slate-500 dark:text-slate-400 ml-auto">{country.code}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


type OtherBillState = { id: string; name: string; amount: number | '' };
type MemberFormData = Omit<Member, 'otherBills'> & { otherBills: OtherBillState[] };

interface EditMemberModalProps {
    member: Member;
    members: Member[];
    onClose: () => void;
    onSave: (updatedMember: Member) => void;
    activeSociety: Society;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ member, members, onClose, onSave, activeSociety }) => {
    // FIX: Ensure `countryCode` has a default value to prevent validation issues with older data.
    const [formData, setFormData] = useState<MemberFormData>({ 
        ...member, 
        countryCode: member.countryCode || '+91', 
        otherBills: member.otherBills.map(b => ({...b, id: b.id || crypto.randomUUID()})) 
    });
    const [error, setError] = useState('');
    
    const selectedCountry = useMemo(() => COUNTRIES.find(c => c.code === formData.countryCode), [formData.countryCode]);
    
    const YEARS = useMemo(() => {
        const startYear = activeSociety.registrationYear || 2000;
        const endYear = 2050;
        return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).reverse();
    }, [activeSociety.registrationYear]);

    useEffect(() => {
        // FIX: Ensure `countryCode` has a default value when the modal is reopened for a different member.
        setFormData({ 
            ...member,
            countryCode: member.countryCode || '+91',
            otherBills: member.otherBills.map(b => ({...b, id: b.id || crypto.randomUUID()})) 
        });
        setError('');
    }, [member]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let finalValue: string | number = value;

        if (name === 'building') {
            finalValue = value.toUpperCase();
        } else if (['monthlyMaintenance', 'monthlyWaterBill'].includes(name)) {
            finalValue = value === '' ? '' : Number(value);
        } else if (name === 'phone') {
            let phoneValue = value.replace(/\D/g, '');
            const maxLength = selectedCountry?.phoneLength
                ? (Array.isArray(selectedCountry.phoneLength)
                    ? Math.max(...selectedCountry.phoneLength)
                    : selectedCountry.phoneLength)
                : null;
    
            if (maxLength && phoneValue.length > maxLength) {
                phoneValue = phoneValue.slice(0, maxLength);
            }
            finalValue = phoneValue;
        }
        
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSave = () => {
        setError('');
        if (!formData.name.trim() || !formData.phone.trim() || !formData.building.trim() || !formData.apartment.trim()) {
            setError('Name, Phone, Building, and Apartment fields are required.');
            return;
        }

        const phoneValidation = validatePhone(formData.phone, selectedCountry);
        if (!phoneValidation.isValid) {
            setError(phoneValidation.message);
            return;
        }

        const isDuplicateAddress = members.some(m => 
            m.id !== formData.id &&
            m.building.trim().toLowerCase() === formData.building.trim().toLowerCase() &&
            m.apartment.trim().toLowerCase() === formData.apartment.trim().toLowerCase()
        );

        if (isDuplicateAddress) {
            setError('A member is already registered for this building and apartment number.');
            return;
        }

        onSave({
            ...formData,
            monthlyMaintenance: Number(formData.monthlyMaintenance) || 0,
            monthlyWaterBill: Number(formData.monthlyWaterBill) || 0,
            otherBills: formData.otherBills
                .filter(b => b.name.trim() && Number(b.amount) > 0)
                .map(b => ({...b, amount: Number(b.amount)})),
            duesFromMonth: formData.duesFromMonth ? Number(formData.duesFromMonth) : undefined,
            duesFromYear: formData.duesFromYear ? Number(formData.duesFromYear) : undefined,
        });
        onClose();
    };
    
    const handleAddOtherBill = () => setFormData(prev => ({...prev, otherBills: [...prev.otherBills, { id: crypto.randomUUID(), name: '', amount: ''}]}));
    const handleRemoveOtherBill = (id: string) => setFormData(prev => ({...prev, otherBills: prev.otherBills.filter(b => b.id !== id)}));
    const handleOtherBillChange = (id: string, field: 'name' | 'amount', value: string) => {
        setFormData(prev => ({
            ...prev,
            otherBills: prev.otherBills.map(b => b.id === id ? { ...b, [field]: field === 'amount' ? (value === '' ? '' : value) : value } : b)
        }));
    };
    
    const commonInputClass = "w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Edit Member</h2>
                {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md mb-4">{error}</p>}
                <div className="space-y-4">
                    <input name="name" type="text" value={formData.name} onChange={handleChange} className={commonInputClass} placeholder="Member Name"/>
                    <div className="grid grid-cols-3 gap-2">
                        <CountryCodeSelector selectedCode={formData.countryCode} onSelect={(code) => setFormData(prev => ({ ...prev, countryCode: code, phone: '' }))} />
                        <div className="col-span-2">
                            <input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Phone number" className={`w-full ${commonInputClass}`} />
                            {selectedCountry?.phoneLength && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">
                                    {formData.phone.length} / {Array.isArray(selectedCountry.phoneLength) ? selectedCountry.phoneLength.join('/') : selectedCountry.phoneLength} digits
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input name="building" type="text" value={formData.building} onChange={handleChange} placeholder="Building" className={commonInputClass} />
                        <input name="apartment" type="text" value={formData.apartment} onChange={handleChange} placeholder="Apartment" className={commonInputClass} />
                    </div>
                    <input name="monthlyMaintenance" type="number" value={formData.monthlyMaintenance} onChange={handleChange} placeholder="Monthly Maintenance (₹)" className={commonInputClass} />
                    <input name="monthlyWaterBill" type="number" value={formData.monthlyWaterBill} onChange={handleChange} placeholder="Monthly Water Bill (₹)" className={commonInputClass} />
                    
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Other Monthly Bills</label>
                        {formData.otherBills.map((bill) => (
                            <div key={bill.id} className="flex items-center gap-2">
                                <input type="text" placeholder="Bill Name" value={bill.name} onChange={e => handleOtherBillChange(bill.id, 'name', e.target.value)} className={`flex-grow ${commonInputClass}`}/>
                                <input type="number" placeholder="Amount" value={bill.amount} onChange={e => handleOtherBillChange(bill.id, 'amount', e.target.value)} className={`w-28 ${commonInputClass}`}/>
                                <button type="button" onClick={() => handleRemoveOtherBill(bill.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"><TrashIcon/></button>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddOtherBill} className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">+ Add Other Bill</button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Dues From Month</label>
                            <select name="duesFromMonth" value={formData.duesFromMonth || ''} onChange={handleChange} className={commonInputClass}>
                                <option value="">Not Set</option>
                                {MONTHS.map((month, i) => <option key={month} value={i + 1}>{month}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Dues From Year</label>
                             <select name="duesFromYear" value={formData.duesFromYear || ''} onChange={handleChange} className={commonInputClass}>
                                <option value="">Not Set</option>
                                {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Save Changes</button>
                </div>
            </div>
        </div>
    );
};


interface MembersProps {
  members: Member[];
  activeSociety: Society;
  onAddMember: (newMember: Omit<Member, 'id'>) => void;
  onUpdateMember: (updatedMember: Member) => void;
  onDeleteMember: (memberId: string) => void;
}

const getPaymentStatus = (member: Member): {text: 'Pending' | 'Paid' | 'Not Set', className: string} => {
    if (!member.duesFromMonth || !member.duesFromYear) {
      return { text: 'Not Set', className: 'bg-slate-400 dark:bg-slate-600' };
    }

    const dueDate = new Date(member.duesFromYear, member.duesFromMonth - 1, 1);
    const currentPeriodDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    if (dueDate <= currentPeriodDate) {
      return { text: 'Pending', className: 'bg-red-500 dark:bg-red-600' };
    }
    return { text: 'Paid', className: 'bg-green-500 dark:bg-green-600' };
};


export const Members: React.FC<MembersProps> = ({ members, activeSociety, onAddMember, onUpdateMember, onDeleteMember }) => {
  const { now } = useTime();
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [building, setBuilding] = useState('');
  const [apartment, setApartment] = useState('');
  const [monthlyMaintenance, setMonthlyMaintenance] = useState<number | ''>('');
  const [monthlyWaterBill, setMonthlyWaterBill] = useState<number | ''>('');
  const [otherBills, setOtherBills] = useState<OtherBillState[]>([]);
  const [duesFromMonth, setDuesFromMonth] = useState<string>(String(now.getMonth() + 1));
  const [duesFromYear, setDuesFromYear] = useState<string>(String(now.getFullYear()));
  const [error, setError] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const selectedCountry = useMemo(() => COUNTRIES.find(c => c.code === countryCode), [countryCode]);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const commonInputClass = "w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";
  
  const YEARS = useMemo(() => {
    const startYear = activeSociety.registrationYear || 2000;
    const endYear = 2050;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).reverse();
  }, [activeSociety.registrationYear]);
  
  // Effect to update default date if month/year changes while component is mounted
    useEffect(() => {
        const currentMonth = String(now.getMonth() + 1);
        const currentYear = String(now.getFullYear());
        if (duesFromMonth !== currentMonth) setDuesFromMonth(currentMonth);
        if (duesFromYear !== currentYear) setDuesFromYear(currentYear);
    }, [now.getMonth(), now.getFullYear()]);


  const handleAddOtherBill = () => setOtherBills(prev => [...prev, { id: crypto.randomUUID(), name: '', amount: ''}]);
  const handleRemoveOtherBill = (id: string) => setOtherBills(prev => prev.filter(b => b.id !== id));
  const handleOtherBillChange = (id: string, field: 'name' | 'amount', value: string) => {
    setOtherBills(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    const maxLength = selectedCountry?.phoneLength
      ? (Array.isArray(selectedCountry.phoneLength)
          ? Math.max(...selectedCountry.phoneLength)
          : selectedCountry.phoneLength)
      : null;

    if (maxLength && value.length > maxLength) {
      value = value.slice(0, maxLength);
    }
    setPhone(value);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !phone.trim() || !building.trim() || !apartment.trim() || Number(monthlyMaintenance) <= 0) {
      setError('Name, phone, address are required and maintenance must be greater than 0.');
      return;
    }

    const phoneValidation = validatePhone(phone, selectedCountry);
    if (!phoneValidation.isValid) {
        setError(phoneValidation.message);
        return;
    }
    
    const isDuplicateAddress = members.some(
      member =>
        member.building.trim().toLowerCase() === building.trim().toLowerCase() &&
        member.apartment.trim().toLowerCase() === apartment.trim().toLowerCase()
    );

    if (isDuplicateAddress) {
        setError('A member is already registered for this building and apartment number.');
        return;
    }

    const newMember: Omit<Member, 'id'> = {
      name,
      countryCode,
      phone,
      building,
      apartment,
      monthlyMaintenance: Number(monthlyMaintenance) || 0,
      monthlyWaterBill: Number(monthlyWaterBill) || 0,
      otherBills: otherBills
        .filter(b => b.name.trim() && Number(b.amount) > 0)
        .map(b => ({ id: b.id, name: b.name, amount: Number(b.amount) })),
      societyId: activeSociety.id,
      duesFromMonth: parseInt(duesFromMonth),
      duesFromYear: parseInt(duesFromYear),
      createdAt: new Date().toISOString(),
    };
    onAddMember(newMember);
    setName('');
    setPhone('');
    setBuilding('');
    setApartment('');
    setMonthlyMaintenance('');
    setMonthlyWaterBill('');
    setOtherBills([]);
    setError('');
    setDuesFromMonth(String(now.getMonth() + 1));
    setDuesFromYear(String(now.getFullYear()));
  };

  const handleDeleteMember = () => {
    if (!deletingMember) return;
    onDeleteMember(deletingMember.id);
    setDeletingMember(null);
  };
  
  const calculateTotalMonthly = (member: Member) => {
      const maintenance = member.monthlyMaintenance || 0;
      const water = member.monthlyWaterBill || 0;
      const others = member.otherBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
      return maintenance + water + others;
  }
  
  const filteredMembers = useMemo(() => {
    let results = members;

    if (debouncedSearchQuery) {
        const searchTerms = debouncedSearchQuery.toLowerCase().split(' ').filter(term => term);
        if(searchTerms.length > 0) {
            results = results.filter(member => {
                const statusText = getPaymentStatus(member).text;
                const memberText = `${member.name} ${member.apartment} ${member.building} ${member.phone} ${statusText}`.toLowerCase();
                return searchTerms.every(term => memberText.includes(term));
            });
        }
    }
    
    if (dateFilter) {
        const [year, month, day] = dateFilter.split('-').map(Number);
        const filterDate = new Date(Date.UTC(year, month - 1, day));
        const filterDateStart = filterDate.getTime();
        const filterDateEnd = filterDateStart + 24 * 60 * 60 * 1000 - 1;

        results = results.filter(member => {
            if (!member.createdAt) return false;
            const memberDate = new Date(member.createdAt).getTime();
            return memberDate >= filterDateStart && memberDate <= filterDateEnd;
        });
    }

    return results;
  }, [members, debouncedSearchQuery, dateFilter]);

    useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setIsSearchFocused(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-8">
      {editingMember && <EditMemberModal member={editingMember} members={members} onClose={() => setEditingMember(null)} onSave={onUpdateMember} activeSociety={activeSociety} />}
      {deletingMember && (
        <ConfirmationModal 
            title="Delete Member"
            message={`Are you sure you want to delete ${deletingMember.name}? This action cannot be undone.`}
            onConfirm={handleDeleteMember}
            onCancel={() => setDeletingMember(null)}
        />
      )}
      <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">Manage Members</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:shadow-slate-700/50 space-y-4">
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Add New Member</h2>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Member Name" className={commonInputClass}/>
              <div className="grid grid-cols-3 gap-2">
                  <CountryCodeSelector selectedCode={countryCode} onSelect={(code) => { setCountryCode(code); setPhone(''); }} />
                  <div className="col-span-2">
                    <input type="tel" value={phone} onChange={handlePhoneChange} placeholder="Phone number" className={`w-full ${commonInputClass}`} />
                    {selectedCountry?.phoneLength && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">
                            {phone.length} / {Array.isArray(selectedCountry.phoneLength) ? selectedCountry.phoneLength.join('/') : selectedCountry.phoneLength} digits
                        </p>
                    )}
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={building} onChange={(e) => setBuilding(e.target.value.toUpperCase())} placeholder="Building" className={commonInputClass} />
                  <input type="text" value={apartment} onChange={(e) => setApartment(e.target.value)} placeholder="Apartment No." className={commonInputClass} />
              </div>
              <input type="number" value={monthlyMaintenance} onChange={(e) => setMonthlyMaintenance(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Monthly Maintenance (₹)" className={commonInputClass} />
              <input type="number" value={monthlyWaterBill} onChange={(e) => setMonthlyWaterBill(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Monthly Water Bill (₹)" className={commonInputClass} />
              
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Other Monthly Bills</label>
                  {otherBills.map((bill) => (
                      <div key={bill.id} className="flex items-center gap-2">
                          <input type="text" placeholder="Bill Name" value={bill.name} onChange={e => handleOtherBillChange(bill.id, 'name', e.target.value)} className={`${commonInputClass} text-sm py-1`}/>
                          <input type="number" placeholder="Amount" value={bill.amount} onChange={e => handleOtherBillChange(bill.id, 'amount', e.target.value)} className={`w-24 text-sm py-1 ${commonInputClass}`}/>
                          <button type="button" onClick={() => handleRemoveOtherBill(bill.id)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"><TrashIcon/></button>
                      </div>
                  ))}
                  <button type="button" onClick={handleAddOtherBill} className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">+ Add Bill</button>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Initial Dues From</label>
                <div className="grid grid-cols-2 gap-4">
                    <select value={duesFromMonth} onChange={e => setDuesFromMonth(e.target.value)} className={commonInputClass}>
                        {MONTHS.map((month, i) => <option key={month} value={i + 1}>{month}</option>)}
                    </select>
                    <select value={duesFromYear} onChange={e => setDuesFromYear(e.target.value)} className={commonInputClass}>
                        {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
              </div>
              <button type="submit" className="w-full flex justify-center items-center bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
                  <PlusIcon /> <span className="ml-2">Add Member</span>
              </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:shadow-slate-700/50">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Members of {activeSociety.name}</h2>
              <div className="flex flex-col sm:flex-row gap-2">
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
                <div ref={searchContainerRef} className="relative w-full sm:w-64">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <SearchIcon />
                    </span>
                    <input 
                        type="text"
                        placeholder="Search by name, address, phone, status..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        className="w-full pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <CloseIcon className="h-4 w-4" />
                        </button>
                    )}
                    {isSearchFocused && searchQuery && (
                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-700 shadow-lg rounded-md border border-slate-200 dark:border-slate-600 max-h-60 overflow-y-auto">
                            {filteredMembers.length > 0 ? (
                                filteredMembers.slice(0, 10).map(member => (
                                    <div key={member.id} onClick={() => { setSearchQuery(member.name); setIsSearchFocused(false); }} className="px-3 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 cursor-pointer">
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200"><Highlight text={member.name} highlight={searchQuery} /></p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400"><Highlight text={`${member.building} - ${member.apartment}`} highlight={searchQuery} /></p>
                                    </div>
                                ))
                            ) : (
                                <p className="p-3 text-sm text-slate-500 dark:text-slate-400 text-center">No members found.</p>
                            )}
                        </div>
                    )}
                </div>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
                {filteredMembers.length > 0 ? (
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 sticky top-0 bg-white dark:bg-slate-800">
                            <tr>
                                <th className="py-2 px-2">Name</th>
                                <th className="py-2 px-2">Address</th>
                                <th className="py-2 px-2 hidden sm:table-cell">Status</th>
                                <th className="py-2 px-2">Dues From</th>
                                <th className="py-2 px-2 hidden md:table-cell">Total Monthly Bill</th>
                                <th className="py-2 px-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredMembers.map(member => {
                                const status = getPaymentStatus(member);
                                return (
                                <tr key={member.id}>
                                    <td className="py-3 px-2 font-medium text-slate-800 dark:text-slate-100">
                                        <Highlight text={member.name} highlight={debouncedSearchQuery} />
                                    </td>
                                    <td className="py-3 px-2 text-slate-600 dark:text-slate-300">
                                        <Highlight text={`${member.building} - ${member.apartment}`} highlight={debouncedSearchQuery} />
                                    </td>
                                    <td className="py-3 px-2 hidden sm:table-cell">
                                        <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${status.className}`}>
                                            <Highlight text={status.text} highlight={debouncedSearchQuery} />
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 text-sm text-slate-600 dark:text-slate-400">
                                      {member.duesFromMonth && member.duesFromYear 
                                        ? `${MONTHS[member.duesFromMonth - 1].substring(0,3)} ${member.duesFromYear}` 
                                        : <span className="text-slate-400 dark:text-slate-500">Not Set</span>}
                                    </td>
                                    <td className="py-3 px-2 text-slate-600 dark:text-slate-300 hidden md:table-cell">₹{calculateTotalMonthly(member).toLocaleString('en-IN')}</td>
                                    <td className="py-3 px-2 text-center">
                                        <button onClick={() => setEditingMember(member)} className="text-primary-600 dark:text-primary-400 hover:text-primary-800 p-1 rounded-full hover:bg-primary-50 dark:hover:bg-slate-700">
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => setDeletingMember(member)} className="text-red-500 dark:text-red-400 hover:text-red-700 p-1 rounded-full hover:bg-red-50 dark:hover:bg-slate-700 ml-2">
                                            <TrashIcon />
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-10">
                        {searchQuery || dateFilter ? 'No members found for your search.' : 'No members have been added to this society yet.'}
                    </p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
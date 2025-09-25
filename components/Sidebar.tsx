import React from 'react';
import type { View } from '../types';
import { DashboardIcon, SocietiesIcon, MembersIcon, ReceiptsIcon, LogoIcon, LogoutIcon, PlusIcon, CloseIcon, BuildingStorefrontIcon, BackupIcon } from './icons/Icons';
import { ThemeToggle } from './ThemeToggle';
import { DigitalClock } from './DigitalClock';
import { DigitalDate } from './DigitalDate';

interface SidebarProps {
  view: View;
  setView: (view: View) => void;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userRole: 'admin' | 'superadmin';
}

export const Sidebar: React.FC<SidebarProps> = ({ view, setView, onLogout, isOpen, setIsOpen, userRole }) => {
  const adminNavItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'societies', label: 'Society Profile', icon: <SocietiesIcon /> },
    { id: 'members', label: 'Members', icon: <MembersIcon /> },
    { id: 'receipts', label: 'Generate Receipt', icon: <PlusIcon /> },
    { id: 'generated-receipts', label: 'Generated Receipts', icon: <ReceiptsIcon /> },
    { id: 'backup', label: 'Backup & Restore', icon: <BackupIcon /> },
  ];

  const superAdminNavItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'superadmin-dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'all-societies', label: 'All Societies', icon: <BuildingStorefrontIcon /> },
    { id: 'all-members', label: 'All Members', icon: <MembersIcon /> },
    { id: 'generated-receipts', label: 'All Receipts', icon: <ReceiptsIcon /> },
    { id: 'backup', label: 'Backup & Restore', icon: <BackupIcon /> },
  ];

  const navItems = userRole === 'superadmin' ? superAdminNavItems : adminNavItems;


  const handleNavigation = (newView: View) => {
    setView(newView);
    setIsOpen(false); // Close sidebar on navigation in mobile
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity duration-300 no-print ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      ></div>

      <aside
        className={`fixed lg:relative inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 shadow-lg flex flex-col z-40 transform transition-transform duration-300 ease-in-out no-print ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between h-20 border-b border-slate-200 dark:border-slate-700 px-4">
          <div className="flex items-center">
            <LogoIcon />
            <h1 className="text-xl font-bold text-primary-700 dark:text-primary-500 ml-2">Digital Society</h1>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100">
              <CloseIcon />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6">
          <ul>
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.id)}
                  className={`flex items-center w-full px-4 py-3 my-1 text-left rounded-lg transition-colors duration-200 ${
                    view === item.id
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                >
                  <span className="w-6 h-6">{item.icon}</span>
                  <span className="ml-4 font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={onLogout}
                    className="flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                >
                    <span className="w-6 h-6"><LogoutIcon /></span>
                    <span className="ml-4 font-medium">Logout</span>
                </button>
                <ThemeToggle />
            </div>
          <DigitalDate />
          <DigitalClock />
          <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">&copy; 2025 Digital Society Management</p>
        </div>
      </aside>
    </>
  );
};

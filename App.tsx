
import React, { useState, createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Societies } from './components/Societies';
import { Members } from './components/Members';
import { Receipts } from './components/Receipts';
import { Auth } from './components/Auth';
import { GeneratedReceipt } from './components/GeneratedReceipt';
import { GeneratedReceiptsList } from './components/GeneratedReceiptsList';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { AllSocieties } from './components/AllSocieties';
import { AllMembers } from './components/AllMembers';
// FIX: Renamed the `Backup` component to `BackupPage` on import to avoid a name collision with the `Backup` type.
import { BackupPage } from './components/Backup';
import type { View, Society, Member, Receipt, User, Toast, ToastType, SimulatedEmail, Backup, BackupSettings, PaymentItem, BulkMemberPeriod } from './types';
import { MenuIcon } from './components/icons/Icons';
import { ToastContainer } from './components/Toast';
import { Loader } from './components/Loader';
import { useLocalStorage } from './hooks/useLocalStorage';
import { EmailSimulationModal } from './components/EmailSimulationModal';


// THEME CONTEXT
type Theme = 'light' | 'dark';
type ThemeContextType = { theme: Theme; toggleTheme: () => void; };
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        const storedTheme = window.localStorage.getItem('theme');
        const initialTheme = storedTheme ? storedTheme as Theme : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setTheme(initialTheme);
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        try {
            window.localStorage.setItem('theme', theme);
        } catch (error) {
            console.error("Could not save theme to local storage.", error);
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// TOAST CONTEXT
type ToastContextType = {
    addToast: (message: string, type: ToastType) => void;
};
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: ToastType) => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};


// TIME CONTEXT
type TimeContextType = {
    now: Date;
};
const TimeContext = createContext<TimeContextType | undefined>(undefined);

export const TimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(timerId);
    }, []);

    return <TimeContext.Provider value={{ now }}>{children}</TimeContext.Provider>;
};

export const useTime = () => {
    const context = useContext(TimeContext);
    if (context === undefined) {
        throw new Error('useTime must be used within a TimeProvider');
    }
    return context;
}


// Mobile Header Component
const MobileHeader: React.FC<{ onMenuClick: () => void, view: View }> = ({ onMenuClick, view }) => {
    const titleMap: Record<View, string> = {
        'dashboard': 'Dashboard',
        'societies': 'Society Profile',
        'members': 'Members',
        'receipts': 'Generate Receipt',
        'generated-receipts': 'Generated Receipts',
        'view-receipt': 'View Receipt',
        'superadmin-dashboard': 'Super Admin Dashboard',
        'all-societies': 'All Societies',
        'all-members': 'All Members',
        'backup': 'Backup & Restore'
    };
  
    return (
      <header className="lg:hidden bg-white dark:bg-slate-800 shadow-md dark:shadow-slate-700 sticky top-0 z-20 no-print">
        <div className="flex items-center justify-between p-4 h-20 border-b border-slate-200 dark:border-slate-700">
          <button onClick={onMenuClick} className="text-slate-600 dark:text-slate-300 hover:text-primary-600 p-2 -ml-2">
            <MenuIcon />
          </button>
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{titleMap[view] || 'Dashboard'}</h1>
          <div className="w-6"></div> {/* Spacer */}
        </div>
      </header>
    );
  };

const AppContent: React.FC = () => {
  const { addToast } = useToast();
  const [societies, setSocieties] = useLocalStorage<Society[]>('societies', []);
  const [members, setMembers] = useLocalStorage<Member[]>('members', []);
  const [receipts, setReceipts] = useLocalStorage<Receipt[]>('receipts', []);
  const [users, setUsers] = useLocalStorage<User[]>('users', []);
  const [currentUserId, setCurrentUserId] = useLocalStorage<string | null>('currentUserId', null);
  
  const [view, setView] = useState<View>('dashboard');
  const [viewingReceiptId, setViewingReceiptId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [simulatedEmail, setSimulatedEmail] = useState<SimulatedEmail | null>(null);

  // Backup State
  const [backups, setBackups] = useLocalStorage<Backup[]>('digital_society_backups', []);
    const [backupSettings, setBackupSettings] = useLocalStorage<BackupSettings>('digital_society_backup_settings', {
    frequency: 'weekly',
    lastBackupTimestamp: 0,
  });

  const currentUser = useMemo(() => users.find(u => u.id === currentUserId) || null, [users, currentUserId]);

  useEffect(() => {
    const superAdminExists = users.some(u => u.role === 'superadmin');
    if (!superAdminExists) {
        setUsers(prev => [...prev, {
            id: 'superadmin-001',
            email: 'admin@gmail.com',
            password: 'password',
            role: 'superadmin'
        }]);
    }
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentUser) {
        setView(currentUser.role === 'superadmin' ? 'superadmin-dashboard' : 'dashboard');
    }
  }, [currentUserId]);

  // Automatic backup check on app load
  useEffect(() => {
    const performAutoBackup = () => {
        const { frequency, lastBackupTimestamp } = backupSettings;
        if (frequency === 'disabled' || !lastBackupTimestamp) {
            // If never backed up, create first one.
            if (frequency !== 'disabled' && lastBackupTimestamp === 0 && (societies.length > 0 || members.length > 0)) {
                handleCreateBackup(true);
            }
            return;
        }

        const now = Date.now();
        let interval = 0;
        if (frequency === 'daily') interval = 24 * 60 * 60 * 1000;
        else if (frequency === 'weekly') interval = 7 * 24 * 60 * 60 * 1000;
        else if (frequency === 'monthly') interval = 30 * 24 * 60 * 60 * 1000; // Simplified
        
        if (now - lastBackupTimestamp > interval) {
            handleCreateBackup(true);
        }
    };
    // Run on startup after initial load
    const timer = setTimeout(performAutoBackup, 3000);
    return () => clearTimeout(timer);
  }, [backupSettings.frequency]); // Only depends on frequency change to avoid re-running too often


  const handleRegister = (societyName: string, registrationNumber: string, email: string, password: string, registrationYear: number): string | true => {
    if (users.some(u => u.email === email)) {
        return 'An account with this email already exists.';
    }
    
    const newSocietyId = crypto.randomUUID();
    const newSociety: Society = {
        id: newSocietyId,
        name: societyName,
        address: '',
        registrationNumber: registrationNumber,
        registrationYear: registrationYear
    };
    
    const newUserId = crypto.randomUUID();
    const newUser: User = {
        id: newUserId,
        email: email,
        password: password,
        societyId: newSocietyId,
        societyName: societyName,
        role: 'admin'
    };

    setSocieties(prev => [...prev, newSociety]);
    setUsers(prev => [...prev, newUser]);
    setCurrentUserId(newUserId);
    
    return true;
  };

  const handleLogin = (email: string, password: string): boolean => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUserId(user.id);
      return true;
    }
    return false;
  };
  
  const handleForgotPassword = (email: string) => {
      const user = users.find(u => u.email === email);
      if (user) {
          setSimulatedEmail({
              subject: 'Your Password Reset Link',
              body: `Hello ${user.email},\n\nWe received a request to reset your password. For this demonstration, your password is: ${user.password}\n\nIn a real application, you would receive a secure link to reset it.`,
          });
      } else {
          addToast("If an account with this email exists, a reset link will be sent.", 'info');
      }
  };

  const handleLogout = () => {
    setCurrentUserId(null);
  };
  
  const handleDeleteSociety = (societyId: string) => {
    const societyToDelete = societies.find(s => s.id === societyId);
    if (!societyToDelete) return;

    setMembers(prev => prev.filter(m => m.societyId !== societyId));
    setReceipts(prev => prev.filter(r => r.societyId !== societyId));
    setUsers(prev => prev.filter(u => u.societyId !== societyId));
    setSocieties(prev => prev.filter(s => s.id !== societyId));

    if (currentUser?.societyId === societyId) {
        handleLogout();
    }
    addToast(`Society "${societyToDelete.name}" and all its data deleted.`, 'success');
  };

  const checkSocietyNameExists = (name: string): boolean => {
    return societies.some(s => s.name.toLowerCase() === name.toLowerCase());
  };
  
  const checkRegistrationNumberExists = (regNo: string): boolean => {
    return societies.some(s => s.registrationNumber.toLowerCase() === regNo.toLowerCase());
  };

  const handleViewReceipt = (receiptId: string) => {
    setViewingReceiptId(receiptId);
    setView('view-receipt');
  };

  const handleDeleteReceipt = (receiptId: string) => {
    const receiptToDelete = receipts.find(r => r.id === receiptId);
    if (!receiptToDelete) {
        addToast('Receipt not found. Could not delete.', 'error');
        return;
    }

    // Find the member and roll back their dues date
    setMembers(prevMembers => prevMembers.map(m => {
        if (m.id === receiptToDelete.memberId) {
            return {
                ...m,
                duesFromMonth: receiptToDelete.paymentFromMonth,
                duesFromYear: receiptToDelete.paymentFromYear,
            };
        }
        return m;
    }));

    // Remove the receipt
    setReceipts(prevReceipts => prevReceipts.filter(r => r.id !== receiptId));

    // If currently viewing this receipt, navigate back to the list
    if (view === 'view-receipt' && viewingReceiptId === receiptId) {
        setView('generated-receipts');
        setViewingReceiptId(null);
    }
    
    addToast(`Receipt #${String(receiptToDelete.receiptNumber).padStart(4, '0')} has been deleted and member dues updated.`, 'success');
  };

  // --- BACKUP HANDLERS ---
  const handleCreateBackup = (isAutomatic = false) => {
    const newBackup: Backup = {
        timestamp: Date.now(),
        data: { societies, members, receipts, users }
    };

    setBackups(prev => {
        let updatedBackups = [...prev, newBackup].sort((a, b) => b.timestamp - a.timestamp);
        // Simple rotation: keep the last 20 backups
        if (updatedBackups.length > 20) {
            updatedBackups = updatedBackups.slice(0, 20);
        }
        return updatedBackups;
    });
    
    setBackupSettings(prev => ({ ...prev, lastBackupTimestamp: newBackup.timestamp }));
    
    if (!isAutomatic) {
        addToast('Backup created successfully!', 'success');
    } else {
        addToast(`Automatic ${backupSettings.frequency} backup created.`, 'info');
    }
  };

  const handleRestoreBackup = (timestamp: number) => {
    const backupToRestore = backups.find(b => b.timestamp === timestamp);
    if (!backupToRestore) {
        addToast('Backup not found.', 'error');
        return;
    }

    try {
        // Preserve the email of the currently logged-in user to attempt to maintain the session.
        const loggedInUserEmail = currentUser?.email;

        // Restore all the data from the backup file.
        setSocieties(backupToRestore.data.societies);
        setMembers(backupToRestore.data.members);
        setReceipts(backupToRestore.data.receipts);
        setUsers(backupToRestore.data.users);

        // After restoring, find the user in the new dataset to keep them logged in.
        if (loggedInUserEmail) {
            const userInRestoredData = backupToRestore.data.users.find(u => u.email === loggedInUserEmail);
            
            if (userInRestoredData) {
                // If the user exists in the backup, update the current user ID to their ID from the backup.
                // This handles cases where user ID might be different across backups/sessions.
                setCurrentUserId(userInRestoredData.id);
            } else {
                // If the user does not exist in the backup, they must be logged out.
                setCurrentUserId(null);
            }
        } else {
            // If no user was logged in before, ensure no one is logged in after.
            setCurrentUserId(null);
        }
        
        addToast('Data restored successfully!', 'success');
    } catch (error) {
        console.error('Failed to restore backup:', error);
        addToast('An unexpected error occurred during the restore process.', 'error');
    }
  };

  const handleImportBackup = (backup: Backup) => {
    if (backup && backup.timestamp && backup.data && Array.isArray(backup.data.societies)) {
        setBackups(prevBackups => {
            if (prevBackups.some(b => b.timestamp === backup.timestamp)) {
                addToast('This backup version already exists.', 'info');
                return prevBackups;
            }
            addToast('Backup imported successfully!', 'success');
            const updatedBackups = [...prevBackups, backup].sort((a, b) => b.timestamp - a.timestamp);
            // Simple rotation: keep the last 20 backups
            return updatedBackups.length > 20 ? updatedBackups.slice(0, 20) : updatedBackups;
        });
    } else {
        addToast('Invalid backup file format.', 'error');
    }
  };

  const handleDeleteBackup = (timestamp: number) => {
    setBackups(prev => prev.filter(b => b.timestamp !== timestamp));
    addToast('Backup deleted.', 'success');
  };

  const handleBulkGenerate = (memberPeriods: BulkMemberPeriod[], description?: string): number => {
    const societyId = currentUser?.societyId;
    if (!societyId) return 0;

    const society = societies.find(s => s.id === societyId);
    if (!society) return 0;
    
    const memberIds = memberPeriods.map(mp => mp.memberId);
    const membersToProcess = members.filter(m => memberIds.includes(m.id) && m.societyId === societyId);
    
    const societyReceipts = receipts.filter(r => r.societyId === society.id);
    let nextReceiptNumber = (Math.max(0, ...societyReceipts.map(r => r.receiptNumber)) || 0) + 1;

    const newReceipts: Receipt[] = [];
    const membersToUpdate: { memberId: string, updates: { duesFromMonth: number, duesFromYear: number } }[] = [];
    let skippedCount = 0;
    
    memberPeriods.forEach(mp => {
        const member = membersToProcess.find(m => m.id === mp.memberId);
        if (!member) return;

        const fromDate = new Date(mp.year, mp.month - 1, 1);
        const tillDate = new Date(mp.tillYear, mp.tillMonth - 1, 1);
        if (fromDate > tillDate) return;
        
        const memberReceipts = receipts.filter(r => r.memberId === member.id);
        const newFromPeriod = mp.year * 12 + mp.month;
        const newTillPeriod = mp.tillYear * 12 + mp.tillMonth;
        const isDuplicate = memberReceipts.some(r => {
            const existingFromPeriod = r.paymentFromYear * 12 + r.paymentFromMonth;
            const existingTillPeriod = r.paymentTillYear * 12 + r.paymentTillMonth;
            return Math.max(newFromPeriod, existingFromPeriod) <= Math.min(newTillPeriod, existingTillPeriod);
        });

        if (isDuplicate) {
            skippedCount++;
            return;
        }

        const months = (tillDate.getFullYear() - fromDate.getFullYear()) * 12 + (tillDate.getMonth() - fromDate.getMonth()) + 1;
        if (months <= 0) return;

        let items: PaymentItem[] = [];
        if (member.monthlyMaintenance > 0) items.push({ description: `Maintenance Bill (${months} month${months > 1 ? 's' : ''})`, amount: member.monthlyMaintenance * months });
        if (member.monthlyWaterBill > 0) items.push({ description: `Water Bill (${months} month${months > 1 ? 's' : ''})`, amount: member.monthlyWaterBill * months });
        member.otherBills.forEach(bill => {
            if(bill.amount > 0) items.push({ description: `${bill.name} (${months} month${months > 1 ? 's' : ''})`, amount: bill.amount * months });
        });
        const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

        if (totalAmount <= 0) {
            return;
        }

        const newReceipt: Receipt = {
            id: crypto.randomUUID(),
            receiptNumber: nextReceiptNumber++,
            date: new Date().toISOString(),
            societyId: society.id,
            societyName: society.name,
            memberId: member.id,
            memberName: member.name,
            items: items,
            totalAmount: totalAmount,
            paymentFromMonth: mp.month,
            paymentFromYear: mp.year,
            paymentTillMonth: mp.tillMonth,
            paymentTillYear: mp.tillYear,
            description: description?.trim() || undefined,
        };
        newReceipts.push(newReceipt);

        const paymentTillDate = new Date(mp.tillYear, mp.tillMonth - 1);
        const nextDueDate = new Date(paymentTillDate.setMonth(paymentTillDate.getMonth() + 1));
        
        membersToUpdate.push({
            memberId: member.id,
            updates: {
                duesFromMonth: nextDueDate.getMonth() + 1,
                duesFromYear: nextDueDate.getFullYear(),
            }
        });
    });

    if (newReceipts.length > 0) {
        setReceipts(prev => [...newReceipts.sort((a,b) => b.receiptNumber - a.receiptNumber), ...prev]);
        setMembers(prev => prev.map(m => {
            const updateInfo = membersToUpdate.find(u => u.memberId === m.id);
            return updateInfo ? { ...m, ...updateInfo.updates } : m;
        }));
    }

    if (newReceipts.length > 0 && skippedCount > 0) {
        addToast(`${newReceipts.length} receipt(s) generated. ${skippedCount} skipped as duplicates.`, 'info');
    } else if (newReceipts.length > 0 && skippedCount === 0) {
        addToast(`${newReceipts.length} receipt(s) generated successfully!`, 'success');
    } else if (skippedCount > 0 && newReceipts.length === 0) {
        addToast(`No new receipts generated. All ${skippedCount} selected members had existing receipts for the chosen period(s).`, 'info');
    }

    return newReceipts.length;
  };
  
  const handleUpdateSociety = (updatedSociety: Society) => {
    if (!currentUser?.societyId) return;

    setSocieties(prevSocieties =>
        prevSocieties.map(s =>
            s.id === currentUser.societyId ? updatedSociety : s
        )
    );
    if (updatedSociety.name) {
        setUsers(prevUsers =>
            prevUsers.map(u =>
                u.id === currentUser.id ? { ...u, societyName: updatedSociety.name } : u
            )
        );
    }
    addToast('Society profile updated!', 'success');
  };


  if (isLoading) {
    return <Loader />;
  }

  if (!currentUser) {
    return <>
      {simulatedEmail && <EmailSimulationModal email={simulatedEmail} onClose={() => setSimulatedEmail(null)} />}
      <Auth 
        onLogin={handleLogin} 
        onRegister={handleRegister} 
        onForgotPassword={handleForgotPassword}
        checkSocietyNameExists={checkSocietyNameExists}
        checkRegistrationNumberExists={checkRegistrationNumberExists}
      />
    </>;
  }
  
  // SUPER ADMIN VIEW
  if (currentUser.role === 'superadmin') {
     const renderSuperAdminView = () => {
        const receiptToView = viewingReceiptId ? receipts.find(r => r.id === viewingReceiptId) : undefined;
        const societyForReceipt = receiptToView ? societies.find(s => s.id === receiptToView.societyId) : null;

        switch (view) {
            case 'superadmin-dashboard':
                return <SuperAdminDashboard societies={societies} members={members} receipts={receipts} setView={setView} />;
            case 'all-societies':
                return <AllSocieties societies={societies} members={members} onDeleteSociety={handleDeleteSociety} />;
            case 'all-members':
                return <AllMembers members={members} societies={societies} />;
            case 'generated-receipts':
                return <GeneratedReceiptsList receipts={receipts} onViewReceipt={handleViewReceipt} onDeleteReceipt={handleDeleteReceipt} isSuperAdminView={true} />;
            case 'view-receipt':
                return <GeneratedReceipt receipt={receiptToView} society={societyForReceipt} onBack={() => setView('generated-receipts')} onDeleteReceipt={handleDeleteReceipt} />;
            case 'backup':
                // FIX: Use the renamed `BackupPage` component.
                return <BackupPage 
                    backups={backups}
                    settings={backupSettings}
                    onUpdateSettings={setBackupSettings}
                    onCreateBackup={handleCreateBackup}
                    onRestoreBackup={handleRestoreBackup}
                    onDeleteBackup={handleDeleteBackup}
                    onImportBackup={handleImportBackup}
                />;
            default:
                setView('superadmin-dashboard');
                return <SuperAdminDashboard societies={societies} members={members} receipts={receipts} setView={setView} />;
        }
    };
     return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200">
          <Sidebar view={view} setView={setView} onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} userRole='superadmin' />
          <div className="flex-1 flex flex-col overflow-hidden">
            <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} view={view} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
              {renderSuperAdminView()}
            </main>
          </div>
        </div>
    );
  }

  // REGULAR ADMIN VIEW
  const loggedInSociety = societies.find(s => s.id === currentUser.societyId);
  const societyMembers = members.filter(m => m.societyId === currentUser.societyId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const societyReceipts = receipts.filter(r => r.societyId === currentUser.societyId).sort((a,b) => b.receiptNumber - a.receiptNumber);

  if (!loggedInSociety) {
    // This can happen if society is deleted while admin is logged in.
    handleLogout();
    return <Loader />;
  }
  
  const receiptToView = viewingReceiptId ? societyReceipts.find(r => r.id === viewingReceiptId) : undefined;

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard societies={[loggedInSociety]} members={societyMembers} receipts={societyReceipts} setView={setView} />;
      case 'societies':
        return <Societies 
                  society={loggedInSociety} 
                  onUpdateSociety={handleUpdateSociety}
                  onDeleteSociety={handleDeleteSociety}
                />;
      case 'members':
        return <Members 
                  members={societyMembers}
                  activeSociety={loggedInSociety}
                  onAddMember={(newMember) => {
                    setMembers(prev => [{ ...newMember, id: crypto.randomUUID() }, ...prev]);
                    addToast('Member added successfully!', 'success');
                  }}
                  onUpdateMember={(updatedMember) => {
                    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
                    addToast('Member details updated.', 'success');
                  }}
                  onDeleteMember={(memberId) => {
                    setMembers(prev => prev.filter(m => m.id !== memberId));
                    addToast(`Member has been deleted.`, 'success');
                  }}
                />;
      case 'receipts':
        return <Receipts 
                  society={loggedInSociety}
                  members={societyMembers} 
                  receipts={societyReceipts}
                  onViewReceipt={handleViewReceipt}
                  setView={setView}
                  onAddReceipt={(newReceipt) => {
                    const receiptWithId = { ...newReceipt, id: crypto.randomUUID() };
                    setReceipts(prev => [receiptWithId, ...prev]);
                    addToast('Receipt generated successfully!', 'success');
                    return receiptWithId.id;
                  }}
                  onUpdateMemberDues={(memberId, dues) => {
                      setMembers(prevMembers =>
                          prevMembers.map(m =>
                              m.id === memberId ? { ...m, ...dues } : m
                          )
                      );
                  }}
                  onBulkGenerate={handleBulkGenerate}
                />;
      case 'generated-receipts':
        return <GeneratedReceiptsList
                  receipts={societyReceipts}
                  onViewReceipt={handleViewReceipt}
                  onDeleteReceipt={handleDeleteReceipt}
                />;
      case 'view-receipt':
        return <GeneratedReceipt
                  receipt={receiptToView}
                  society={loggedInSociety}
                  onBack={() => setView('generated-receipts')}
                  onDeleteReceipt={handleDeleteReceipt}
                />
      case 'backup':
        // FIX: Use the renamed `BackupPage` component.
        return <BackupPage 
            backups={backups}
            settings={backupSettings}
            onUpdateSettings={setBackupSettings}
            onCreateBackup={handleCreateBackup}
            onRestoreBackup={handleRestoreBackup}
            onDeleteBackup={handleDeleteBackup}
            onImportBackup={handleImportBackup}
        />;
      default:
        setView('dashboard');
        return <Dashboard societies={[loggedInSociety]} members={societyMembers} receipts={societyReceipts} setView={setView} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200">
      <Sidebar view={view} setView={setView} onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} userRole='admin' />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} view={view} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
          {renderView()}
        </main>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  return (
    <ThemeProvider>
        <ToastProvider>
            <TimeProvider>
                <AppContent />
            </TimeProvider>
        </ToastProvider>
    </ThemeProvider>
  );
};


export default App;

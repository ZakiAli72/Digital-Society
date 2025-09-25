
import React, { useState, useCallback, useRef } from 'react';
import type { Backup, BackupSettings } from '../types';
import { BackupIcon, DownloadIcon, TrashIcon, UploadIcon, InfoCircleIcon, DocumentIcon, RestoreIcon, MoreVerticalIcon, PrintIcon, SpinnerIcon } from './icons/Icons';
import { ConfirmationModal } from './ConfirmationModal';
import { useToast } from '../App';

declare const jspdf: any;

const isValidBackup = (data: any): data is Backup => {
    if (typeof data !== 'object' || data === null) return false;
    if (typeof data.timestamp !== 'number') return false;
    if (typeof data.data !== 'object' || data.data === null) return false;
    const { societies, members, receipts, users } = data.data;
    return Array.isArray(societies) && Array.isArray(members) && Array.isArray(receipts) && Array.isArray(users);
};

interface BackupProps {
    backups: Backup[];
    settings: BackupSettings;
    onUpdateSettings: (settings: BackupSettings) => void;
    onCreateBackup: (isAutomatic?: boolean) => void;
    onRestoreBackup: (timestamp: number) => void;
    onDeleteBackup: (timestamp: number) => void;
    onImportBackup: (backup: Backup) => void;
}

const ActionsDropdown: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const closeDropdown = () => setIsOpen(false);

    const handleToggle = () => setIsOpen(prev => !prev);
    
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={handleToggle} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                <MoreVerticalIcon />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical" onClick={closeDropdown}>
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const BackupListItem: React.FC<{
    backup: Backup;
    onDownloadJson: (backup: Backup) => void;
    onDownloadPdf: (backup: Backup) => void;
    onDelete: (backup: Backup) => void;
    onRestore: (backup: Backup) => void;
}> = ({ backup, onDownloadJson, onDownloadPdf, onDelete, onRestore }) => {
    const sizeInKB = (JSON.stringify(backup).length / 1024).toFixed(2);
    const date = new Date(backup.timestamp);
    const formattedDate = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    return (
        <li className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
            <div className="flex items-center gap-4">
                <DocumentIcon className="w-10 h-10 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                        Backup - <span className="font-normal">{formattedDate}</span>
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formattedTime} &bull; {sizeInKB} KB
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => onRestore(backup)} className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md hover:bg-primary-200 dark:hover:bg-primary-900/50">
                    <RestoreIcon className="w-4 h-4" /> Restore
                </button>
                <ActionsDropdown>
                    <button onClick={() => onRestore(backup)} className="w-full text-left flex sm:hidden items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">
                        <RestoreIcon className="w-4 h-4" /> Restore
                    </button>
                    <button onClick={() => onDownloadJson(backup)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">
                        <DownloadIcon className="w-4 h-4"/> Download (.json)
                    </button>
                    <button onClick={() => onDownloadPdf(backup)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">
                        <PrintIcon className="w-4 h-4"/> Get PDF Summary
                    </button>
                    <div className="border-t border-slate-200 dark:border-slate-600 my-1"></div>
                    <button onClick={() => onDelete(backup)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                       <TrashIcon /> Delete
                    </button>
                </ActionsDropdown>
            </div>
        </li>
    );
};

const UploaderCard: React.FC<{
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    dragHandlers: any;
    isDragging: boolean;
    isImporting: boolean;
}> = ({ onFileChange, dragHandlers, isDragging, isImporting }) => (
    <div 
        {...dragHandlers}
        className={`relative rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 p-4 transition-colors duration-300 ${isDragging ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}
    >
        {isImporting && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 flex items-center justify-center z-10 rounded-lg">
                <SpinnerIcon className="animate-spin h-10 w-10 text-primary-600" />
            </div>
        )}
        <input type="file" id="import-backup-input" onChange={onFileChange} accept=".json" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isImporting} />
        <label htmlFor="import-backup-input" className={`flex flex-col items-center justify-center text-center p-6 h-full ${isImporting ? 'cursor-wait' : 'cursor-pointer'}`}>
            <UploadIcon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                 Click to browse or <span className="font-semibold text-primary-600 dark:text-primary-400">drag & drop</span> a file.
            </p>
        </label>
    </div>
);


export const BackupPage: React.FC<BackupProps> = ({
    backups,
    settings,
    onUpdateSettings,
    onCreateBackup,
    onRestoreBackup,
    onDeleteBackup,
    onImportBackup
}) => {
    const [modalAction, setModalAction] = useState<{ type: 'restore' | 'delete', backup: Backup } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const { addToast } = useToast();
    
    const processBackupFile = useCallback(async (file: File) => {
        if (!file) return;
        if (file.type !== 'application/json') {
            addToast('Invalid file type. Please upload a .json backup file.', 'error');
            return;
        }
        setIsImporting(true);
        try {
            const content = await file.text();
            const parsed = JSON.parse(content);
            if (isValidBackup(parsed)) {
                onImportBackup(parsed);
            } else {
                throw new Error("Invalid backup format. The file is not a valid Digital Society backup.");
            }
        } catch (error) {
            console.error("Backup import error:", error);
            const message = error instanceof Error ? error.message : 'Failed to read or parse the backup file.';
            addToast(message, 'error');
        } finally {
            setIsImporting(false);
        }
    }, [onImportBackup, addToast]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) processBackupFile(file);
        event.target.value = '';
    };

    const handleDragEvents = {
        onDragEnter: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); },
        onDragLeave: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); },
        onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); },
        onDrop: (e: React.DragEvent) => {
            e.preventDefault(); e.stopPropagation(); setIsDragging(false);
            if (e.dataTransfer.files?.[0]) {
                processBackupFile(e.dataTransfer.files[0]);
                e.dataTransfer.clearData();
            }
        },
    };

    const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdateSettings({ ...settings, frequency: e.target.value as BackupSettings['frequency'] });
        addToast('Automatic backup settings updated!', 'success');
    };

    const handleDownloadJson = (backup: Backup) => {
        try {
            const jsonString = JSON.stringify(backup, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const date = new Date(backup.timestamp);
            const timestamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
            link.download = `digital-society-backup-${timestamp}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            addToast('Failed to download backup.', 'error');
        }
    };
    
    const handleDownloadPdfSummary = (backup: Backup) => {
        try {
            const { jsPDF } = jspdf;
            const pdf = new jsPDF();
            const date = new Date(backup.timestamp);
            const societyNames = backup.data.societies.map(s => s.name).join(', ');

            pdf.setFontSize(22); pdf.text("Digital Society Backup Summary", 14, 22);
            pdf.setFontSize(12); pdf.text(`Backup Date: ${date.toLocaleString()}`, 14, 32);
            pdf.setLineWidth(0.5); pdf.line(14, 37, 196, 37);
            pdf.setFontSize(14); pdf.text("Backup Contents:", 14, 47);
            pdf.setFontSize(12);
            pdf.text(`- Societies: ${backup.data.societies.length}`, 20, 57);
            pdf.text(`- Members: ${backup.data.members.length}`, 20, 64);
            pdf.text(`- Receipts: ${backup.data.receipts.length}`, 20, 71);
            pdf.text(`- Users: ${backup.data.users.length}`, 20, 78);
            if (backup.data.societies.length > 0) {
                pdf.setFontSize(14); pdf.text("Societies Included:", 14, 92);
                pdf.setFontSize(12); pdf.text(societyNames || "N/A", 20, 99, { maxWidth: 170 });
            }
            pdf.setFontSize(10); pdf.setTextColor(150);
            pdf.text("This is a summary. Use the .json file for data restoration.", 14, pdf.internal.pageSize.height - 20);
            
            const timestamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
            pdf.save(`digital-society-backup-summary-${timestamp}.pdf`);
            addToast('PDF summary downloaded!', 'success');
        } catch (error) {
            addToast('Failed to generate PDF summary.', 'error');
        }
    };
    
    const handleConfirm = () => {
        if (!modalAction) return;
        if (modalAction.type === 'restore') onRestoreBackup(modalAction.backup.timestamp);
        else if (modalAction.type === 'delete') onDeleteBackup(modalAction.backup.timestamp);
        setModalAction(null);
    };
    
    const getModalMessage = () => {
        if (!modalAction) return '';
        const dateStr = new Date(modalAction.backup.timestamp).toLocaleString();
        if (modalAction.type === 'restore') return `This will overwrite all current application data with the data from the backup created on ${dateStr}. This action is irreversible.`;
        return `Are you sure you want to permanently delete the backup from ${dateStr}?`;
    }
    
    return (
        <div className="space-y-8">
            {modalAction && (<ConfirmationModal title={`${modalAction.type === 'restore' ? 'Restore Backup' : 'Delete Backup'}`} message={getModalMessage()} onConfirm={handleConfirm} onCancel={() => setModalAction(null)} confirmText={modalAction.type === 'restore' ? 'Restore' : 'Delete'} variant={modalAction.type === 'restore' ? 'primary' : 'danger'} />)}
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">Backup & Restore</h1>
                <button onClick={() => onCreateBackup(false)} className="w-full sm:w-auto flex justify-center items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-semibold transition-colors text-base shadow hover:shadow-lg">
                    <BackupIcon /> <span className="ml-2">Create New Backup</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* --- RIGHT SIDEBAR ON DESKTOP --- */}
                <div className="lg:col-span-1 lg:order-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:shadow-slate-700/50">
                        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Automatic Backups</h2>
                        <div className="space-y-3">
                             <select id="frequency" value={settings.frequency} onChange={handleFrequencyChange} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="disabled">Disabled</option>
                            </select>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Last backup: {settings.lastBackupTimestamp ? new Date(settings.lastBackupTimestamp).toLocaleString() : 'Never'}.
                            </p>
                        </div>
                    </div>
                     <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 rounded-xl flex items-start gap-3">
                        <InfoCircleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800 dark:text-yellow-300">
                            <h3 className="font-bold">JSON vs. PDF</h3>
                            <ul className="mt-1 list-disc list-inside space-y-1">
                                <li><strong>Use .json files</strong> for restoring data.</li>
                                <li><strong>Use .pdf files</strong> for printing or records.</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                {/* --- MAIN CONTENT --- */}
                <div className="lg:col-span-2 lg:order-1 space-y-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:shadow-slate-700/50">
                        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">Import from File</h2>
                        <UploaderCard onFileChange={handleFileChange} dragHandlers={handleDragEvents} isDragging={isDragging} isImporting={isImporting} />
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:shadow-slate-700/50">
                        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
                            Existing Backups ({backups.length})
                        </h2>
                        {backups.length > 0 ? (
                           <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                                {backups.map(backup => (
                                    <BackupListItem 
                                        key={backup.timestamp} 
                                        backup={backup} 
                                        onDownloadJson={handleDownloadJson} 
                                        onDownloadPdf={handleDownloadPdfSummary} 
                                        onDelete={(b) => setModalAction({ type: 'delete', backup: b })} 
                                        onRestore={(b) => setModalAction({ type: 'restore', backup: b })} 
                                    />
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center p-8 sm:p-12">
                                <BackupIcon className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600" />
                                <p className="mt-4 text-lg font-semibold text-slate-600 dark:text-slate-300">No backups found.</p>
                                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                                    Create or import your first backup.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

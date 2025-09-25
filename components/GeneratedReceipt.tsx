
import React, { useState } from 'react';
import type { Receipt, Society } from '../types';
import { DownloadIcon, BackArrowIcon, TrashIcon } from './icons/Icons';
import { useToast } from '../App';
import { ConfirmationModal } from './ConfirmationModal';


declare const jspdf: any;
declare const html2canvas: any;

const MONTHS = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

interface GeneratedReceiptProps {
  receipt: Receipt | undefined;
  society: Society | null;
  onBack: () => void;
  onDeleteReceipt: (receiptId: string) => void;
}

export const GeneratedReceipt: React.FC<GeneratedReceiptProps> = ({ receipt, society, onBack, onDeleteReceipt }) => {
  const { addToast } = useToast();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  if (!receipt) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200">Receipt Not Found</h2>
            <p className="text-slate-500 dark:text-slate-400">The receipt you are looking for could not be found.</p>
            <button onClick={onBack} className="mt-6 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center">
                <BackArrowIcon />
                <span className="ml-2">Back to Receipts</span>
            </button>
        </div>
    )
  }
  
  const getFilenamePeriod = () => {
    const fromMonth = String(receipt.paymentFromMonth).padStart(2, '0');
    const fromYear = receipt.paymentFromYear;
    const tillMonth = String(receipt.paymentTillMonth).padStart(2, '0');
    const tillYear = receipt.paymentTillYear;

    if (fromYear === tillYear && fromMonth === tillMonth) {
        return `${fromYear}-${fromMonth}`;
    }
    return `${fromYear}-${fromMonth}_to_${tillYear}-${tillMonth}`;
  }

  const handleDownloadPdf = () => {
    const input = document.getElementById('receipt-to-print');
    if (!input) return;

    html2canvas(input, { scale: 2, backgroundColor: '#ffffff' }).then((canvas) => {
        const { jsPDF } = jspdf;
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasAspectRatio = canvas.height / canvas.width;
        let finalWidth = pdfWidth;
        let finalHeight = finalWidth * canvasAspectRatio;

        if (finalHeight > pdfHeight) {
            finalHeight = pdfHeight;
            finalWidth = finalHeight / canvasAspectRatio;
        }

        const x = (pdfWidth - finalWidth) / 2;
        
        pdf.addImage(imgData, 'PNG', x, 0, finalWidth, finalHeight);

        const sanitizedMemberName = receipt.memberName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
        const periodString = getFilenamePeriod();
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const filename = `Receipt-${String(receipt.receiptNumber).padStart(4, '0')}-${sanitizedMemberName}-${periodString}-${timestamp}.pdf`;

        pdf.save(filename);
        addToast('Receipt PDF downloaded!', 'success');
    });
  };
  
  const paymentPeriod = () => {
    const fromMonth = MONTHS[receipt.paymentFromMonth - 1];
    const fromYear = receipt.paymentFromYear;
    const tillMonth = MONTHS[receipt.paymentTillMonth - 1];
    const tillYear = receipt.paymentTillYear;
    
    if (fromYear === tillYear && fromMonth === tillMonth) {
        return `${fromMonth} ${fromYear}`;
    } else if (fromYear === tillYear) {
        return `${fromMonth} to ${tillMonth} ${fromYear}`;
    } else {
        return `${fromMonth} ${fromYear} to ${tillMonth} ${tillYear}`;
    }
  };


  return (
    <div className="max-w-3xl mx-auto printable-area">
      {isDeleteModalOpen && receipt && (
        <ConfirmationModal
            title={`Delete Receipt #${String(receipt.receiptNumber).padStart(4, '0')}`}
            message={`Are you sure? This will permanently delete this receipt and roll back the member's dues to ${MONTHS[receipt.paymentFromMonth - 1]} ${receipt.paymentFromYear}. This action is irreversible.`}
            onConfirm={() => {
                onDeleteReceipt(receipt.id);
            }}
            onCancel={() => setIsDeleteModalOpen(false)}
            confirmText="Delete Receipt"
        />
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 no-print">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
            Receipt <span className="font-mono text-primary-600 dark:text-primary-400">#{String(receipt.receiptNumber).padStart(4, '0')}</span>
        </h1>
         <button onClick={onBack} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center self-end sm:self-center">
            <BackArrowIcon />
            <span className="ml-2">Back to List</span>
        </button>
      </div>

       <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-slate-700/50">
        <div id="receipt-to-print" className="p-6 md:p-10 bg-white text-slate-800">
          <header className="text-center mb-8 border-b pb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-700">{society?.name}</h2>
            <p className="text-sm text-slate-500 mt-1">{society?.address}</p>
            {society?.registrationNumber && <p className="text-xs text-slate-400 mt-1">Reg. No: {society.registrationNumber}</p>}
          </header>
          <div className="space-y-4 text-md text-slate-600">
            <div className="flex justify-between"><span>Receipt No:</span> <strong className="font-mono text-slate-800">{String(receipt.receiptNumber).padStart(4, '0')}</strong></div>
            <div className="flex justify-between"><span>Date:</span> <strong className="text-slate-800">{new Date(receipt.date).toLocaleDateString()}</strong></div>
            <div className="flex justify-between"><span>Member Name:</span> <strong className="text-slate-800">{receipt.memberName}</strong></div>
            <div className="flex justify-between"><span>Payment For:</span> <strong className="text-slate-800">{paymentPeriod()}</strong></div>
          </div>
          
          <div className="mt-8 border-t pt-6">
              <table className="w-full text-md">
                  <thead>
                      <tr className="border-b">
                          <th className="text-left font-semibold text-slate-500 pb-2">Description</th>
                          <th className="text-right font-semibold text-slate-500 pb-2">Amount</th>
                      </tr>
                  </thead>
                  <tbody>
                      {receipt.items.map((item, index) => (
                          <tr key={index} className="border-b border-slate-100">
                              <td className="py-3 text-slate-700">{item.description}</td>
                              <td className="py-3 text-right text-slate-700">₹{item.amount.toLocaleString('en-IN')}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>

          <div className="mt-8 pt-6 border-t flex justify-end">
            <div className="w-full max-w-xs text-right">
                <p className="text-md text-slate-500">Total Amount Paid</p>
                <p className="text-4xl sm:text-5xl font-bold text-slate-800">₹{receipt.totalAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {receipt.description && (
            <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-md font-semibold text-slate-600">Notes & Description</h3>
                <p className="mt-2 text-slate-700 whitespace-pre-wrap">{receipt.description}</p>
            </div>
          )}

          <div className="mt-20 pt-10 flex justify-end">
            <div className="text-center w-48">
                {society?.signatureType === 'image' && society.signatureImage ? (
                    <img src={society.signatureImage} alt="Signature" className="h-16 mx-auto object-contain" />
                ) : society?.signatureType === 'text' && society.signatureText ? (
                    <p className="text-3xl font-caveat text-slate-800">{society.signatureText}</p>
                ) : (
                    <div className="h-16"></div> 
                )}
                <div className="border-t border-slate-400 mt-2"></div>
                <p className="mt-2 text-sm text-slate-600 font-semibold">
                {society?.signatureAuthority || 'Authorized Signatory'}
                </p>
            </div>
          </div>

        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl flex flex-col sm:flex-row justify-end items-center space-y-3 sm:space-y-0 sm:space-x-3 border-t border-slate-200 dark:border-slate-700 no-print">
          <button onClick={handleDownloadPdf} className="w-full sm:w-auto px-5 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center justify-center font-semibold">
            <DownloadIcon />
            <span className="ml-2">Download as PDF</span>
          </button>
        </div>
      </div>

      <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl no-print">
        <h3 className="text-lg font-bold text-red-800 dark:text-red-300">Danger Zone</h3>
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          Deleting this receipt is a permanent action. It will also update the member's due date accordingly.
        </p>
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="mt-4 inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow hover:shadow-lg font-semibold"
        >
          <TrashIcon />
          <span className="ml-2">Delete this Receipt</span>
        </button>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import type { Society } from '../types';
import { EditIcon, TrashIcon, UploadIcon, CalendarIcon } from './icons/Icons';
import { useToast } from '../App';
import { ConfirmationModal } from './ConfirmationModal';

interface SocietiesProps {
  society: Society;
  onUpdateSociety: (updatedData: Society) => void;
  onDeleteSociety: (societyId: string) => void;
}

// Rewriting the Societies component to address state management issues and improve clarity.

export const Societies: React.FC<SocietiesProps> = ({ society, onUpdateSociety, onDeleteSociety }) => {
  const [isEditing, setIsEditing] = useState(false);
  // formData holds the state of the form while editing.
  const [formData, setFormData] = useState<Society>(society);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { addToast } = useToast();
  
  // Effect to reset form data when the original society data changes from the parent.
  useEffect(() => {
    setFormData(society);
  }, [society]);
  
  const registrationYears = useMemo(() => 
    Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => new Date().getFullYear() - i)
  , []);
  
  const handleEditClick = () => {
    // When entering edit mode, ensure the form data is based on the latest society prop.
    // This also defaults the signature type for a consistent editing experience.
    setFormData({
      ...society,
      signatureType: society.signatureType || 'text',
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    // When canceling, we revert the form data back to the original prop data and exit edit mode.
    setFormData(society);
    setIsEditing(false);
  };

  const handleSave = () => {
    // Create a final version of the data to be saved.
    const dataToSave = { ...formData, registrationYear: Number(formData.registrationYear) };
    
    // Clean up signature data based on the selected type to avoid storing unused data.
    if (dataToSave.signatureType === 'text') {
      dataToSave.signatureImage = undefined; // Clear image if text is selected
      if (!dataToSave.signatureText?.trim()) { // If text is empty, clear the type and text
        dataToSave.signatureType = undefined;
        dataToSave.signatureText = undefined;
      }
    } else if (dataToSave.signatureType === 'image') {
      dataToSave.signatureText = undefined; // Clear text if image is selected
      if (!dataToSave.signatureImage) { // If no image is uploaded, clear the type
        dataToSave.signatureType = undefined;
      }
    }

    onUpdateSociety(dataToSave);
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSignatureTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newType = e.target.value as 'text' | 'image';
    setFormData(prev => ({ ...prev, signatureType: newType }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
        addToast('Please upload a PNG or JPEG image.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        setFormData(prev => ({ ...prev, signatureImage: reader.result as string, signatureType: 'image' }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignatureImage = () => {
      setFormData(prev => ({ 
          ...prev, 
          signatureImage: undefined,
          signatureType: 'text', // Revert to text mode for a better user experience.
        }));
  };
  
  const handleDeleteConfirm = () => {
    onDeleteSociety(society.id);
  };
  
  const commonInputClass = "w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";
  
  // --- RENDER LOGIC ---

  const renderSignatureDisplay = () => {
    const { signatureType, signatureImage, signatureText } = society;

    if (signatureType === 'image' && signatureImage) {
      return <img src={signatureImage} alt="Signature" className="h-20 max-w-xs mt-2 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md object-contain" />;
    }
    if (signatureType === 'text' && signatureText) {
      return <p className="text-3xl font-caveat text-slate-700 dark:text-slate-200">{signatureText}</p>;
    }
    return <p className="text-lg text-slate-600 dark:text-slate-300"><span className="text-slate-400 italic">No signature set</span></p>;
  };

  const renderDisplayMode = () => (
    <div className="space-y-6">
        <div>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Society Name</h2>
            <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{society.name}</p>
        </div>
        <div>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Registered Address</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">{society.address || <span className="text-slate-400 italic">Not set</span>}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
                <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Registration Number</h2>
                <p className="text-lg text-slate-600 dark:text-slate-300">{society.registrationNumber || <span className="text-slate-400 italic">Not set</span>}</p>
            </div>
             <div>
                <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Registration Year</h2>
                <p className="text-lg text-slate-600 dark:text-slate-300">{society.registrationYear || <span className="text-slate-400 italic">Not set</span>}</p>
            </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Receipt Signature Settings</h2>
            <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Authority Title</h3>
                  <p className="text-lg text-slate-600 dark:text-slate-300">{society.signatureAuthority || <span className="text-slate-400 italic">Not set</span>}</p>
            </div>
            <div className="mt-4">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Signature</h3>
                  {renderSignatureDisplay()}
            </div>
        </div>
    </div>
  );

  const renderEditMode = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Society Name</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={commonInputClass}/>
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Registered Address</label>
        <textarea name="address" id="address" value={formData.address} onChange={handleChange} rows={3} className={commonInputClass}/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
            <label htmlFor="registrationNumber" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Registration Number</label>
            <input type="text" name="registrationNumber" id="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className={commonInputClass}/>
        </div>
        <div>
            <label htmlFor="registrationYear" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Registration Year</label>
             <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><CalendarIcon/></span>
                <select 
                    name="registrationYear"
                    id="registrationYear"
                    value={formData.registrationYear} 
                    onChange={handleChange} 
                    className={`${commonInputClass} pl-10`}
                    aria-label="Year of Registration"
                >
                    {registrationYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
            </div>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Receipt Signature Settings</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Customize the signature block that appears on all generated receipts.</p>
          <div className="space-y-4">
              <div>
                  <label htmlFor="signatureAuthority" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Authority Title</label>
                  <input type="text" name="signatureAuthority" id="signatureAuthority" placeholder="e.g., Secretary, Chairman" value={formData.signatureAuthority || ''} onChange={handleChange} className={commonInputClass}/>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Signature Type</label>
                  <div className="flex items-center space-x-4">
                      <label className="flex items-center cursor-pointer">
                          <input type="radio" name="signatureType" value="text" checked={formData.signatureType === 'text'} onChange={handleSignatureTypeChange} className="h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-500"/>
                          <span className="ml-2 text-sm text-slate-700 dark:text-slate-200">Typed Name</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                          <input type="radio" name="signatureType" value="image" checked={formData.signatureType === 'image'} onChange={handleSignatureTypeChange} className="h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-500"/>
                          <span className="ml-2 text-sm text-slate-700 dark:text-slate-200">Upload Image</span>
                      </label>
                  </div>
              </div>

              {formData.signatureType === 'text' && (
                  <div>
                      <label htmlFor="signatureText" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Signature Name</label>
                      <input type="text" name="signatureText" id="signatureText" placeholder="Enter the full name for signature" value={formData.signatureText || ''} onChange={handleChange} className={`${commonInputClass} font-caveat text-xl`}/>
                  </div>
              )}

              {formData.signatureType === 'image' && (
                  <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Signature Image</label>
                      {formData.signatureImage ? (
                          <div className="flex items-center gap-4 p-2 border border-slate-300 dark:border-slate-600 rounded-md">
                              <img src={formData.signatureImage} alt="Signature preview" className="h-16 bg-white p-1 rounded object-contain" />
                              <button type="button" onClick={handleRemoveSignatureImage} className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">Remove Image</button>
                          </div>
                      ) : (
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md">
                              <div className="space-y-1 text-center">
                                  <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
                                  <div className="flex text-sm text-slate-600 dark:text-slate-400">
                                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-slate-700 rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                                      <span>Upload a file</span>
                                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleImageUpload}/>
                                  </label>
                                  <p className="pl-1">or drag and drop</p>
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-500">PNG, JPG</p>
                              </div>
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button onClick={handleCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">Cancel</button>
        <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Save Changes</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {isDeleteModalOpen && (
        <ConfirmationModal
          title={`Delete ${society.name}`}
          message="Are you sure? This will permanently delete your society, all its members, all receipts, and your admin account. This action is irreversible."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">Society Profile</h1>
        {!isEditing && (
            <button 
                onClick={handleEditClick}
                className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow hover:shadow-lg"
            >
                <EditIcon />
                <span className="ml-2">Edit Profile</span>
            </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md dark:shadow-slate-700/50">
        {isEditing ? renderEditMode() : renderDisplayMode()}
      </div>

      <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl">
        <h3 className="text-lg font-bold text-red-800 dark:text-red-300">Danger Zone</h3>
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          Deleting your society is a permanent action that cannot be undone. All associated data will be lost forever.
        </p>
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="mt-4 inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow hover:shadow-lg font-semibold"
        >
          <TrashIcon />
          <span className="ml-2">Delete this Society</span>
        </button>
      </div>
    </div>
  );
};
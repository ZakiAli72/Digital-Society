export type View = 'dashboard' | 'societies' | 'members' | 'receipts' | 'generated-receipts' | 'view-receipt' | 'superadmin-dashboard' | 'all-societies' | 'all-members' | 'backup';

export interface Society {
  id: string;
  name: string;
  address: string;
  registrationNumber: string;
  registrationYear: number;
  signatureAuthority?: string;
  signatureType?: 'text' | 'image';
  signatureText?: string;
  signatureImage?: string; // base64 string
}

export interface OtherBill {
  id: string;
  name: string;
  amount: number;
}

export interface Member {
  id:string;
  name: string;
  countryCode: string;
  phone: string;
  building: string;
  apartment: string;
  societyId: string;
  monthlyMaintenance: number;
  monthlyWaterBill: number;
  otherBills: OtherBill[];
  duesFromMonth?: number; // 1-12
  duesFromYear?: number;
  createdAt: string;
}

export interface PaymentItem {
  description: string;
  amount: number;
}

export interface Receipt {
  id: string;
  receiptNumber: number;
  date: string;
  memberId: string;
  memberName: string;
  societyId: string;
  societyName: string;
  items: PaymentItem[];
  totalAmount: number;
  paymentFromMonth: number; // 1-12
  paymentFromYear: number;
  paymentTillMonth: number; // 1-12
  paymentTillYear: number;
  description?: string;
}

export interface User {
  id: string; // This will now be a UUID
  email: string;
  password?: string; // Password is stored locally for this version
  societyId?: string;
  societyName?: string;
  role: 'admin' | 'superadmin';
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

export interface SimulatedEmail {
    subject: string;
    body: string;
}

export interface Backup {
    timestamp: number;
    data: {
        societies: Society[];
        members: Member[];
        receipts: Receipt[];
        users: User[];
    };
}

export interface BackupSettings {
    frequency: 'daily' | 'weekly' | 'monthly' | 'disabled';
    lastBackupTimestamp: number;
}

export type BulkMemberPeriod = { 
  memberId: string; 
  month: number; 
  year: number; 
  tillMonth: number;
  tillYear: number;
};

export interface Country {
    name: string;
    code: string;
    iso: string;
    phoneLength: number | number[];
}
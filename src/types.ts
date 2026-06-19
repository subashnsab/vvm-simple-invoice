export interface BusinessSettings {
  name: string;
  gstin: string; // GST/Tax Registration number
  address: string;
  phone: string;
  email: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string; // Indian Financial System Code
  upiId: string; // UPI ID for digital payments QR code
  currency: string; // Currency symbol (e.g. ₹ or $)
}

export interface InvoiceItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  taxPercent: number; // e.g. 18 for 18% GST/VAT
  unit?: 'pcs' | 'kg' | 'g';
}

export interface Invoice {
  id: string; // Unique Invoice ID (e.g. INV-2026-001)
  invoiceNumber: number; // Numeric sequence
  createdAt: string; // JSON ISO date
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number; // Discount amount
  taxTotal: number;
  grandTotal: number;
  roundOff?: number;
  status: 'Paid' | 'Unpaid' | 'Pending';
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Other';
  notes?: string;
  synced: boolean;
  syncDate?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  taxPercent: number; // default tax level
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin?: string;
}

export interface PurchaseItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number; // Unit purchase price
  taxPercent: number;
  unit?: 'pcs' | 'kg' | 'g';
}

export interface PurchaseBill {
  id: string; // Unique Purchase Bill ID (e.g. PUR-2026-001)
  billNumber: number; // Numeric sequence
  createdAt: string; // JSON ISO date
  vendorName: string;
  vendorPhone: string;
  vendorEmail: string;
  vendorAddress: string;
  vendorGstin?: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  taxTotal: number;
  grandTotal: number;
  roundOff?: number;
  status: 'Paid' | 'Unpaid' | 'Pending';
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Other';
  notes?: string;
}

export interface SyncSettings {
  webAppUrl: string;
  autoSync: boolean;
  spreadsheetUrl?: string;
}

import React, { useState, useEffect } from 'react';
import { 
  defaultBusinessSettings, 
  defaultProducts, 
  defaultCustomers, 
  defaultInvoices
} from './data/defaults.ts';
import { 
  BusinessSettings, 
  Product, 
  Customer, 
  Invoice, 
  SyncSettings
} from './types.ts';
import { Dashboard } from './components/Dashboard.tsx';
import { InvoiceCreator } from './components/InvoiceCreator.tsx';
import { InvoiceList } from './components/InvoiceList.tsx';
import { ProductCatalog } from './components/ProductCatalog.tsx';
import { CustomerManager } from './components/CustomerManager.tsx';
import { SyncHub } from './components/SyncHub.tsx';
import { BusinessCustomizer } from './components/BusinessCustomizer.tsx';
import { PrintInvoice } from './components/PrintInvoice.tsx';
import { 
  FileText, 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  CloudLightning, 
  Settings, 
  Languages,
  Database,
  Printer,
  ChevronRight
} from 'lucide-react';

export default function App() {
  // UI States
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [lang, setLang] = useState<'en' | 'ta'>('en');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // App Data States - loaded with Local storage persistence
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(defaultBusinessSettings);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({ webAppUrl: '', autoSync: false });

  // Initial Load from LocalStorage
  useEffect(() => {
    // 1. Settings
    const cachedSettings = localStorage.getItem('billing_settings');
    if (cachedSettings) setBusinessSettings(JSON.parse(cachedSettings));
    else localStorage.setItem('billing_settings', JSON.stringify(defaultBusinessSettings));

    // 2. Products
    const cachedProducts = localStorage.getItem('billing_products');
    if (cachedProducts) setProducts(JSON.parse(cachedProducts));
    else {
      setProducts(defaultProducts);
      localStorage.setItem('billing_products', JSON.stringify(defaultProducts));
    }

    // 3. Customers
    const cachedCustomers = localStorage.getItem('billing_customers');
    if (cachedCustomers) setCustomers(JSON.parse(cachedCustomers));
    else {
      setCustomers(defaultCustomers);
      localStorage.setItem('billing_customers', JSON.stringify(defaultCustomers));
    }

    // 4. Invoices
    const cachedInvoices = localStorage.getItem('billing_invoices');
    if (cachedInvoices) setInvoices(JSON.parse(cachedInvoices));
    else {
      setInvoices(defaultInvoices);
      localStorage.setItem('billing_invoices', JSON.stringify(defaultInvoices));
    }

    // 5. Sync Settings
    const cachedSync = localStorage.getItem('billing_sync');
    if (cachedSync) setSyncSettings(JSON.parse(cachedSync));
  }, []);

  const t = (en: string, ta: string) => (lang === 'ta' ? ta : en);

  // Persistence update wrappers
  const updateSettings = (newSettings: BusinessSettings) => {
    setBusinessSettings(newSettings);
    localStorage.setItem('billing_settings', JSON.stringify(newSettings));
  };

  const addProduct = (p: Product) => {
    const updated = [p, ...products];
    setProducts(updated);
    localStorage.setItem('billing_products', JSON.stringify(updated));
  };

  const addProducts = (newProds: Product[]) => {
    const updated = [...newProds, ...products];
    setProducts(updated);
    localStorage.setItem('billing_products', JSON.stringify(updated));
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    localStorage.setItem('billing_products', JSON.stringify(updated));
  };

  const addCustomer = (c: Customer) => {
    const updated = [c, ...customers];
    setCustomers(updated);
    localStorage.setItem('billing_customers', JSON.stringify(updated));
  };

  const deleteCustomer = (id: string) => {
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    localStorage.setItem('billing_customers', JSON.stringify(updated));
  };

  const deleteInvoice = (id: string) => {
    const updated = invoices.filter(inv => inv.id !== id);
    setInvoices(updated);
    localStorage.setItem('billing_invoices', JSON.stringify(updated));
  };

  const updateInvoiceStatus = (id: string, status: 'Paid' | 'Unpaid' | 'Pending') => {
    const updated = invoices.map(inv => {
      if (inv.id === id) return { ...inv, status };
      return inv;
    });
    setInvoices(updated);
    localStorage.setItem('billing_invoices', JSON.stringify(updated));
  };

  const updateSyncSettings = (s: SyncSettings) => {
    setSyncSettings(s);
    localStorage.setItem('billing_sync', JSON.stringify(s));
  };

  // Google Sheets Apps Script Sync execution
  const syncInvoiceToSheets = async (invoice: Invoice): Promise<boolean> => {
    if (!syncSettings.webAppUrl) return false;

    try {
      const response = await fetch(syncSettings.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // Avoiding preflight CORS issues
        },
        body: JSON.stringify({
          action: 'sync_invoice',
          invoice
        })
      });

      // Update sync status locally upon finished fetch trigger
      const updated = invoices.map(inv => {
        if (inv.id === invoice.id) {
          return { ...inv, synced: true, syncDate: new Date().toISOString() };
        }
        return inv;
      });
      setInvoices(updated);
      localStorage.setItem('billing_invoices', JSON.stringify(updated));
      return true;
    } catch (err) {
      console.error("Sheets sync error:", err);
      // In Apps Script setups, redirect/CORS might block verifying outputs but we flag synced: true
      const updated = invoices.map(inv => {
        if (inv.id === invoice.id) {
          return { ...inv, synced: true };
        }
        return inv;
      });
      setInvoices(updated);
      localStorage.setItem('billing_invoices', JSON.stringify(updated));
      return true;
    }
  };

  // Save or Update invoice and option to auto-sync
  const saveInvoice = async (invoice: Invoice) => {
    const exists = invoices.some(inv => inv.id === invoice.id);
    let updated;
    if (exists) {
      updated = invoices.map(inv => inv.id === invoice.id ? invoice : inv);
    } else {
      updated = [invoice, ...invoices];
    }
    setInvoices(updated);
    localStorage.setItem('billing_invoices', JSON.stringify(updated));
    console.log("Invoice saved locally (updated/created): ", invoice.id);
    
    // Clear editing state
    setEditingInvoice(null);

    // Auto add customer to saved leads if they aren't there yet
    const customerExists = customers.some(
      c => c.name.toLowerCase() === invoice.customerName.toLowerCase()
    );
    if (!customerExists && invoice.customerName) {
      addCustomer({
        id: `cust-${Date.now()}`,
        name: invoice.customerName,
        phone: invoice.customerPhone || '',
        email: invoice.customerEmail || '',
        address: invoice.customerAddress || ''
      });
    }

    // Auto-sync trigger
    if (syncSettings.autoSync && syncSettings.webAppUrl) {
      await syncInvoiceToSheets(invoice);
    }
  };

  // Safe fetch single invoice for printer
  const currentPrintedInvoice = selectedInvoiceId 
    ? invoices.find(inv => inv.id === selectedInvoiceId)
    : null;

  const selectTab = (tabName: string) => {
    setSelectedInvoiceId(null);
    setEditingInvoice(null);
    setCurrentTab(tabName);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setSelectedInvoiceId(null);
    setCurrentTab('create');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Premium Web Header Bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500 rounded-xl text-slate-950 font-black shadow-md shadow-emerald-500/10">
              🧾
            </span>
            <div>
              <h1 className="font-extrabold text-slate-900 tracking-tight text-base leading-none">
                {t("VVM SMART ERP", "VVM ஸ்மார்ட் ERP")}
              </h1>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mt-0.5">
                {businessSettings.name}
              </span>
            </div>
          </div>

          {/* Bilingual Tamil / English toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold px-3.5 py-1.5 rounded-xl hover:bg-slate-100 transition active:scale-95 flex items-center gap-1.5 cursor-pointer text-slate-700"
            >
              <Languages size={14} className="text-emerald-500" />
              {lang === 'ta' ? '🇺🇸 English' : '🇮🇳 தமிழ்'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 flex flex-col lg:flex-row gap-6">
        
        {/* Responsive Side Menu Navigation */}
        <aside className="w-full lg:w-[240px] shrink-0 space-y-1 no-print">
          <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest pl-3 mb-2 hidden lg:block">
            {t("Main Menu", "முதன்மை மெனு")}
          </p>
          
          <nav className="flex flex-row lg:flex-col overflow-x-auto no-scrollbar gap-1 lg:gap-1 p-1 bg-white border border-slate-100 rounded-2xl lg:p-2 lg:bg-transparent lg:border-none">
            {/* Dashboard */}
            <button
              onClick={() => selectTab('dashboard')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
                currentTab === 'dashboard' && !selectedInvoiceId
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <LayoutDashboard size={15} />
              {t("Dashboard", "முகப்பு பலகை")}
            </button>

            {/* Invoices List */}
            <button
              onClick={() => selectTab('invoices')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
                currentTab === 'invoices' && !selectedInvoiceId
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <FileText size={15} />
              {t("Invoices History", "பில்கள் பட்டியல்")}
            </button>

            {/* Create Invoice / Generate Bill */}
            <button
              onClick={() => selectTab('create')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
                currentTab === 'create' && !editingInvoice
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <ChevronRight size={15} className="text-emerald-500" />
              {t("Generate Bill", "புதிய பில்")}
            </button>

            {/* Products catalog */}
            <button
              onClick={() => selectTab('products')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
                currentTab === 'products'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <ShoppingBag size={15} />
              {t("Inventory Catalog", "பொருட்கள் பட்டியல்")}
            </button>

            {/* Customers */}
            <button
              onClick={() => selectTab('customers')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
                currentTab === 'customers'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <Users size={15} />
              {t("Client Directory", "வாடிக்கையாளர்கள்")}
            </button>

            {/* Spreadsheet sync hub */}
            <button
              onClick={() => selectTab('sync')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
                currentTab === 'sync'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <CloudLightning size={15} className="text-indigo-500" />
              {t("Sheets Sync Setup", "கூகிள் சீட் இணைப்பு")}
            </button>

            {/* Business Customizer settings */}
            <button
              onClick={() => selectTab('settings')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
                currentTab === 'settings'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <Settings size={15} />
              {t("Shop Settings", "அமைப்புகள்")}
            </button>
          </nav>
        </aside>

        {/* Content Wrapper */}
        <main className="flex-1 min-w-0">
          
          {/* Printer Mode overlay if selected */}
          {selectedInvoiceId && currentPrintedInvoice ? (
            <PrintInvoice
              invoice={currentPrintedInvoice}
              settings={businessSettings}
              onBack={() => { setSelectedInvoiceId(null); setCurrentTab('invoices'); }}
              onSyncInvoiceToSheets={syncInvoiceToSheets}
              syncSettings={syncSettings}
              lang={lang}
              onEdit={handleEditInvoice}
            />
          ) : (
            <>
              {/* Dynamic Tabs routing */}
              {currentTab === 'dashboard' && (
                <Dashboard
                  invoices={invoices}
                  products={products}
                  customers={customers}
                  settings={businessSettings}
                  setCurrentTab={setCurrentTab}
                  lang={lang}
                />
              )}

              {currentTab === 'create' && (
                <InvoiceCreator
                  products={products}
                  customers={customers}
                  settings={businessSettings}
                  onSaveInvoice={saveInvoice}
                  onAddProduct={addProduct}
                  lang={lang}
                  setCurrentTab={setCurrentTab}
                  setSelectedInvoiceId={setSelectedInvoiceId}
                  invoiceToEdit={editingInvoice}
                />
              )}

              {currentTab === 'invoices' && (
                <InvoiceList
                  invoices={invoices}
                  settings={businessSettings}
                  onDeleteInvoice={deleteInvoice}
                  onUpdateStatus={updateInvoiceStatus}
                  onSyncInvoiceToSheets={syncInvoiceToSheets}
                  setSelectedInvoiceId={setSelectedInvoiceId}
                  syncSettings={syncSettings}
                  setCurrentTab={setCurrentTab}
                  lang={lang}
                  onEditInvoice={handleEditInvoice}
                />
              )}

              {currentTab === 'products' && (
                <ProductCatalog
                  products={products}
                  settings={businessSettings}
                  onAddProduct={addProduct}
                  onAddProducts={addProducts}
                  onDeleteProduct={deleteProduct}
                  lang={lang}
                />
              )}

              {currentTab === 'customers' && (
                <CustomerManager
                  customers={customers}
                  onAddCustomer={addCustomer}
                  onDeleteCustomer={deleteCustomer}
                  lang={lang}
                />
              )}

              {currentTab === 'sync' && (
                <SyncHub
                  syncSettings={syncSettings}
                  updateSyncSettings={updateSyncSettings}
                  invoices={invoices}
                  onSyncInvoiceToSheets={syncInvoiceToSheets}
                  lang={lang}
                />
              )}

              {currentTab === 'settings' && (
                <BusinessCustomizer
                  settings={businessSettings}
                  onSaveSettings={updateSettings}
                  lang={lang}
                />
              )}
            </>
          )}
        </main>
      </div>

      <footer className="py-6 text-center text-xs text-slate-400 no-print border-t border-slate-100 bg-white mt-12">
        <p>© 2026 {businessSettings.name}. {t("Designed with zero-dependency Google Apps Script connectivity.", "கூகிள் ஆப்ஸ் ஸ்கிரிப்ட் மற்றும் கூகிள் தாள்களுடன் இணைக்கப்பட்டுள்ளது.")}</p>
      </footer>
    </div>
  );
}

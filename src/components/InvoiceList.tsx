import React, { useState } from 'react';
import { Invoice, BusinessSettings } from '../types.ts';
import { Search, MapPin, Phone, Database, CloudLightning, Printer, Eye, Trash2, Calendar, FileText, CheckCircle2, AlertCircle, RefreshCw, Edit } from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  settings: BusinessSettings;
  onDeleteInvoice: (id: string) => void;
  onUpdateStatus: (id: string, status: 'Paid' | 'Unpaid' | 'Pending') => void;
  onSyncInvoiceToSheets: (invoice: Invoice) => Promise<boolean>;
  lang: 'en' | 'ta';
  setSelectedInvoiceId: (id: string | null) => void;
  syncSettings: { webAppUrl: string };
  setCurrentTab: (tab: string) => void;
  onEditInvoice: (invoice: Invoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  settings,
  onDeleteInvoice,
  onUpdateStatus,
  onSyncInvoiceToSheets,
  lang,
  setSelectedInvoiceId,
  syncSettings,
  setCurrentTab,
  onEditInvoice
}) => {
  const t = (en: string, ta: string) => (lang === 'ta' ? ta : en);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [syncFilter, setSyncFilter] = useState<string>('all');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Filter logic
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerPhone.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    
    const matchesSync = 
      syncFilter === 'all' || 
      (syncFilter === 'synced' && inv.synced) || 
      (syncFilter === 'unsynced' && !inv.synced);

    return matchesSearch && matchesStatus && matchesSync;
  });

  const handleSyncClick = async (invoice: Invoice) => {
    if (!syncSettings.webAppUrl) {
      alert(t(
        "Please configure your Google Apps Script URL first in the Google Sheets Sync hub tab!",
        "தயவுசெய்து முதலில் 'கூகிள் சீட் ஒத்திசைவு' பக்கத்தில் உங்கள் ஆப்ஸ் ஸ்கிரிப்ட் முகவரியை உள்ளிடவும்!"
      ));
      setCurrentTab('sync');
      return;
    }
    
    setSyncingId(invoice.id);
    try {
      const ok = await onSyncInvoiceToSheets(invoice);
      if (ok) {
        // Handled securely
      } else {
        alert(t("Sync failed! Check your connection or Web App status.", "ஒத்திசைவு தோல்வியடைந்தது! உங்கள் இணைய இணைப்பைச் சரிபார்க்கவும்."));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingId(null);
    }
  };

  const confirmDelete = (id: string) => {
    const yes = window.confirm(t(
      `Are you sure you want to delete invoice ${id}? This cannot be undone.`,
      `பில் ${id}-ஐ நிரந்தரமாக நீக்க வேண்டுமா? இதை மாற்ற முடியாது.`
    ));
    if (yes) {
      onDeleteInvoice(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Header */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 md:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("Search by customer name, bill number, or phone...", "தேடல்: வாடிக்கையாளர் பெயர், பில் எண் அல்லது தொலைபேசி...")}
            className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl pl-11 pr-4 py-2 text-sm outline-none transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">{t("Status:", "நிலை:")}</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs px-3 py-1.5 rounded-xl outline-none"
            >
              <option value="all">{t("All Status", "அனைத்து நிலை")}</option>
              <option value="Paid">{t("Paid Only", "கட்டணம் செலுத்தியது")}</option>
              <option value="Pending">{t("Pending Only", "நிலுவையில் உள்ளது")}</option>
              <option value="Unpaid">{t("Unpaid Only", "செலுத்தப்படாதது")}</option>
            </select>
          </div>

          {/* Sync status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">{t("Sheets:", "கூகிள் சீட்:")}</span>
            <select
              value={syncFilter}
              onChange={(e) => setSyncFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs px-3 py-1.5 rounded-xl outline-none"
            >
              <option value="all">{t("All Syncs", "அனைத்து பில்கள்")}</option>
              <option value="synced">{t("Synced", "சீட்டில் உள்ளது")}</option>
              <option value="unsynced">{t("Local Drafts", "உள்ளூர் வரைவுகள்")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List Display */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl py-16 text-center text-slate-400 shadow-xs">
          <FileText size={48} className="mx-auto text-slate-200 mb-3" />
          <p className="text-sm font-medium mb-1">{t("No invoices found matching current filters.", "நிபந்தனைகளுக்கு உட்பட்ட பில்கள் எதுவும் இல்லை.")}</p>
          <p className="text-xs text-slate-400">{t("Try clearing your search terms or generate a new invoice.", "தேடல் சொற்களை மாற்றவும் அல்லது புதிய பில்லை உருவாக்கவும்.")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl shadow-xs p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Left Column: Number, Customer, Date, Address */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900 px-2.5 py-0.5 bg-slate-50 border border-slate-150 rounded-lg">
                    {inv.id}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(inv.createdAt).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  
                  {/* Synced Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      inv.synced
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    <Database size={10} />
                    {inv.synced ? t("SYNCED", "சீட்டில் உள்ளது") : t("LOCAL ONLY", "உள்ளூர் வரம்பு")}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-base">{inv.customerName}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {inv.customerPhone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} />
                        {inv.customerPhone}
                      </span>
                    )}
                    {inv.customerAddress && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        <span className="truncate max-w-[250px]" title={inv.customerAddress}>{inv.customerAddress}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle Column: Pricing list and status */}
              <div className="flex flex-wrap md:flex-col items-start md:items-end gap-3 md:gap-1.5 min-w-[140px]">
                <div className="text-xs text-slate-400 font-medium">
                  {inv.items.length} {inv.items.length === 1 ? t("Item", "பொருள்") : t("Items", "பொருட்கள்")}
                </div>
                <div className="font-mono text-lg font-black text-slate-900">
                  {settings.currency}{inv.grandTotal.toFixed(2)}
                </div>

                {/* Dropdown status update */}
                <select
                  value={inv.status}
                  onChange={(e) => onUpdateStatus(inv.id, e.target.value as any)}
                  className={`text-[11px] font-bold px-2 py-1 rounded-full outline-none border cursor-pointer ${
                    inv.status === 'Paid'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : inv.status === 'Pending'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  <option value="Paid">{t("Paid", "செலுத்தியது")}</option>
                  <option value="Pending">{t("Pending", "நிலுவையில்")}</option>
                  <option value="Unpaid">{t("Unpaid", "செலுத்தவில்லை")}</option>
                </select>
              </div>

              {/* Right Column: Actions block */}
              <div className="flex items-center justify-end gap-2 shrink-0 md:border-l md:border-slate-100 md:pl-5">
                {/* View/Print details */}
                <button
                  onClick={() => setSelectedInvoiceId(inv.id)}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition cursor-pointer"
                  title={t("View & Print / Download PDF", "விவரங்களை அச்சிடு")}
                >
                  <Eye size={16} />
                </button>

                {/* Edit invoice */}
                <button
                  onClick={() => onEditInvoice(inv)}
                  className="p-2.5 rounded-xl border border-slate-200 text-amber-600 hover:bg-amber-50 hover:border-amber-100 active:scale-95 transition cursor-pointer"
                  title={t("Edit Invoice", "பில்லைத் திருத்துக")}
                >
                  <Edit size={16} />
                </button>

                {/* Apps Script Google sheets direct sync */}
                <button
                  onClick={() => handleSyncClick(inv)}
                  disabled={syncingId === inv.id}
                  className={`p-2.5 rounded-xl border cursor-pointer active:scale-95 transition flex items-center justify-center ${
                    inv.synced
                      ? 'border-indigo-200 text-indigo-600 bg-indigo-50/40 hover:bg-indigo-50 hover:text-indigo-700'
                      : 'border-slate-200 text-slate-500 bg-white hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                  title={t("Sync to Google Sheets", "கூகிள் சீட்டுக்கு அனுப்பு")}
                >
                  {syncingId === inv.id ? (
                    <RefreshCw size={16} className="animate-spin text-indigo-500" />
                  ) : (
                    <CloudLightning size={16} />
                  )}
                </button>

                {/* Delete invoice copy */}
                <button
                  onClick={() => confirmDelete(inv.id)}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 active:scale-95 transition cursor-pointer"
                  title={t("Delete invoice copy", "நீக்கு")}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

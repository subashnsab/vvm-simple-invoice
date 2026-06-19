import React, { useState } from 'react';
import { Customer } from '../types.ts';
import { Users, Plus, Trash2, Mail, Phone, MapPin, Search } from 'lucide-react';

interface CustomerManagerProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  lang: 'en' | 'ta';
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({
  customers,
  onAddCustomer,
  onDeleteCustomer,
  lang
}) => {
  const t = (en: string, ta: string) => (lang === 'ta' ? ta : en);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name,
      phone,
      email,
      address
    };

    onAddCustomer(newCustomer);

    // Reset Form
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Add customer form */}
      <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs h-fit space-y-4">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
          <Users className="text-emerald-500" size={18} />
          {t("Add New Customer", "புது வாடிக்கையாளர் விவரம்")}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t("Customer Name*", "விலையாளர் பெயர்*")}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("e.g. Subash Chandran", "உம். சுபாஷ் சந்திரன்")}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t("Phone Number", "தொலைபேசி எண்")}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9845612347"
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t("Email ID", "மின்னஞ்சல்")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. subashnsab@gmail.com"
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t("Permanent Address", "வீட்டு முகவரி")}
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("Billing / Delivery Address", "பில் வரிசை முகவரி")}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-xs active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus size={14} />
            {t("Save Contact", "வாடிக்கையாளரைச் சேமி")}
          </button>
        </form>
      </div>

      {/* Verified directory lists */}
      <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Search header inside card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-slate-800 text-base">
            {t("Database Customer Directory", "பதிவுசெய்யப்பட்ட வாடிக்கையாளர்கள்")} ({filteredCustomers.length})
          </h3>
          <div className="relative max-w-[240px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("Filter list...", "தேடு...")}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg pl-8 pr-3 py-1 text-xs outline-none transition"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="mx-auto text-slate-200 mb-2" size={40} />
            <p className="text-sm">{t("No customer profile found. Insert using the left panel.", "வாடிக்கையாளர்கள் பட்டியல் காலியாக உள்ளது.")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredCustomers.map((cust) => (
              <div
                key={cust.id}
                className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-2xs transition flex items-start justify-between gap-3"
              >
                <div className="space-y-1 text-xs text-slate-550 flex-1">
                  <h4 className="font-bold text-slate-800 text-sm">{cust.name}</h4>
                  {cust.phone && (
                    <p className="flex items-center gap-1.5 text-slate-500">
                      <Phone size={12} className="text-slate-400 shrink-0" />
                      {cust.phone}
                    </p>
                  )}
                  {cust.email && (
                    <p className="flex items-center gap-1.5 text-slate-500">
                      <Mail size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate max-w-[170px]" title={cust.email}>{cust.email}</span>
                    </p>
                  )}
                  {cust.address && (
                    <p className="flex items-start gap-1.5 text-slate-500 mt-1">
                      <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed text-[11px] text-slate-400">{cust.address}</span>
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => onDeleteCustomer(cust.id)}
                  className="p-1 px-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                  title={t("Delete customer", "நீக்கு")}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { BusinessSettings } from '../types.ts';
import { Settings, ShieldCheck, HeartPulse, Building2, CreditCard, Save } from 'lucide-react';

interface BusinessCustomizerProps {
  settings: BusinessSettings;
  onSaveSettings: (settings: BusinessSettings) => void;
  lang: 'en' | 'ta';
}

export const BusinessCustomizer: React.FC<BusinessCustomizerProps> = ({
  settings,
  onSaveSettings,
  lang
}) => {
  const t = (en: string, ta: string) => (lang === 'ta' ? ta : en);

  const [name, setName] = useState(settings.name);
  const [gstin, setGstin] = useState(settings.gstin);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [bankName, setBankName] = useState(settings.bankName);
  const [accountNumber, setAccountNumber] = useState(settings.accountNumber);
  const [ifscCode, setIfscCode] = useState(settings.ifscCode);
  const [upiId, setUpiId] = useState(settings.upiId);
  const [currency, setCurrency] = useState(settings.currency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      name,
      gstin,
      address,
      phone,
      email,
      bankName,
      accountNumber,
      ifscCode,
      upiId,
      currency
    });
    alert(t("Company details updated successfully!", "நிறுவனத்தின் விவரங்கள் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!"));
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center gap-3">
        <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
          <Settings size={20} />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 text-lg">
            {t("Business Details Customizer", "நிறுவன அமைப்புகள்")}
          </h2>
          <p className="text-xs text-slate-500">
            {t("Details here populate headers and payment sections of your printed invoices.", "இங்கு நீங்கள் பதிவிடும் தகவல்களே இன்வாய்ஸ் மற்றும் பில்களின் மேல் பகுதியில் அச்சிடப்படும்.")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-6 text-sm text-slate-705">
        {/* Company profile */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 size={14} />
            {t("1. General Profile & Contacts", "1. பொது விவரங்கள் & தொடர்புகள்")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {t("Business / Shop Name*", "நிறுவனம் / கடையின் பெயர்*")}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Saravana Stores"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {t("GSTIN / Tax ID Number", "ஜி.எஸ்.டி / வரி பதிவு எண்")}
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="e.g. 33AAAAA1111A1Z1"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 font-mono text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {t("Contact Phone*", "தொலைபேசி எண்*")}
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {t("Company Email ID*", "மின்னஞ்சல் முகவரி*")}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm outline-none transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {t("Shop Address*", "கடை கடையின் முகவரி*")}
              </label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {t("Default Currency Symbol (e.g. ₹, $)*", "சின்னம் (உம். ₹, $)*")}
              </label>
              <input
                type="text"
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Bank and payments customize */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard size={14} />
            {t("2. Settlement Bank & Digital UPI details", "2. தீர்வு வங்கி கணக்கு & UPI விபரங்கள்")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {t("Settlement Bank Name", "வங்கியின் பெயர்")}
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. State Bank of India"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {t("Bank Account Number", "வங்கி கணக்கு எண்")}
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 1234567890"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {t("Bank IFSC Code", "வங்கி IFSC குறியீடு")}
              </label>
              <input
                type="text"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value)}
                placeholder="e.g. SBIN0000800"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-mono outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {t("Digital UPI ID (for QR payment generation)", "UPI முகவரி (QR குறியீட்டுக்காக)")}
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. saravana@upi"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-mono outline-none transition"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {t("Providing a UPI ID creates an instant payment QR code directly onto your invoices!", "பில்லின் அடியிலேயே ஸ்கேன் செய்து பணம் செலுத்த QR குறியீடு அச்சிடப்படும்!")}
              </span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-sm active:scale-95 transition shadow-sm cursor-pointer flex items-center gap-2"
          >
            <Save size={16} />
            {t("Save Company Settings", "விவரங்களைச் சேமி")}
          </button>
        </div>
      </form>
    </div>
  );
};

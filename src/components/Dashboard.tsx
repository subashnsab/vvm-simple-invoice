import React from 'react';
import { Invoice, Product, Customer, BusinessSettings } from '../types.ts';
import { FileText, Users, ShoppingBag, ArrowUpRight, TrendingUp, AlertCircle, Database, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  invoices: Invoice[];
  products: Product[];
  customers: Customer[];
  settings: BusinessSettings;
  setCurrentTab: (tab: string) => void;
  lang: 'en' | 'ta';
}

export const Dashboard: React.FC<DashboardProps> = ({ invoices, products, customers, settings, setCurrentTab, lang }) => {
  // Tamil Translation Helper
  const t = (en: string, ta: string) => (lang === 'ta' ? ta : en);

  // Math Calculations
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.status === 'Paid' ? inv.grandTotal : 0), 0);
  const pendingRevenue = invoices.reduce((sum, inv) => sum + (inv.status !== 'Paid' ? inv.grandTotal : 0), 0);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalPaidCount = invoices.filter(inv => inv.status === 'Paid').length;
  const totalPendingCount = invoices.filter(inv => inv.status !== 'Paid').length;
  const syncPercentage = invoices.length > 0
    ? Math.round((invoices.filter(inv => inv.synced).length / invoices.length) * 100)
    : 0;

  // Recent invoices - max 5
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12">
          <FileText size={240} className="text-emerald-400" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-3">
            {settings.name}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            {t("Welcome to VVM SMART ERP", "VVM ஸ்மார்ட் ERP-விற்கு வரவேற்கிறோம்")}
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
            {t(
              "Manage your invoices, products, and clients gracefully in one clean interface. Sync your billing records securely straight to your customized Google Sheet with a built-in Google Apps Script integration.",
              "உங்கள் இன்வாய்ஸ்கள், தயாரிப்புகள் மற்றும் வாடிக்கையாளர்களை ஒரே எளிமையான இடைமுகத்தில் நிர்வகிக்கவும். ஒருங்கிணைக்கப்பட்ட கூகிள் ஆப்ஸ் ஸ்கிரிப்ட் வழியாக உங்கள் பில்லிங் கோப்புகளை பாதுகாப்பாக கூகிள் சீட்டில் ஒத்திசைக்கவும்."
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setCurrentTab('create')}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition text-slate-950 text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-2"
            >
              <FileText size={16} />
              {t("Create New Bill", "புதிய பில் உருவாக்கவும்")}
            </button>
            <button
              onClick={() => setCurrentTab('sync')}
              className="bg-slate-800 hover:bg-slate-700 active:scale-95 transition text-white border border-slate-700 text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <Database size={16} />
              {t("Google Sheets Sync", "கூகிள் சீட் ஒத்திசைவு")}
            </button>
          </div>
        </div>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Paid Revenue */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              {t("Collected Revenue", "வசூலிக்கப்பட்ட தொகை")}
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              {settings.currency}{totalRevenue.toLocaleString()}
            </h3>
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1">
              <CheckCircle2 size={12} />
              {totalPaidCount} {t("Paid Invoices", "கட்டணப் பில்கள்")}
            </span>
          </div>
        </div>

        {/* Outstanding amount */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              {t("Outstanding Dues", "நிலுவையில் உள்ள தொகை")}
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              {settings.currency}{pendingRevenue.toLocaleString()}
            </h3>
            <span className="text-xs font-medium text-rose-600 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {totalPendingCount} {t("Pending Bills", "நிலுவைப் பில்கள்")}
            </span>
          </div>
        </div>

        {/* Sync Metric */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Database size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              {t("Cloud Sheets Sync", "சீட் ஒத்திசைவு நிலை")}
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              {syncPercentage}%
            </h3>
            <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${syncPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Directories Size */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-slate-50 text-slate-600 rounded-xl">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              {t("Catalog & Customers", "தயாரிப்புகள் & வாடிக்கையாளர்கள்")}
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              {products.length} / {customers.length}
            </h3>
            <span className="text-xs text-slate-500 inline-block mt-1">
              {t("Items / Saved Leads", "பொருட்கள் / தொடர்புகள்")}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Invoices & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table (Col Span 2) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-lg">
              {t("Recent Bills", "சமீபத்திய பில்கள்")}
            </h3>
            <button
              onClick={() => setCurrentTab('invoices')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              {t("View All Bills", "அனைத்தையும் காட்டு")}
              <ArrowUpRight size={14} />
            </button>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="mx-auto text-slate-300 mb-2" size={40} />
              <p className="text-sm">{t("No invoices found. Generate your first invoice!", "பில்கள் எதுவும் இல்லை. புதிய பில் ஒன்றை உருவாக்குங்கள்!")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-medium uppercase tracking-wider">
                    <th className="pb-3">{t("Bill No", "பில் எண்")}</th>
                    <th className="pb-3">{t("Client", "வாடிக்கையாளர்")}</th>
                    <th className="pb-3">{t("Date", "தேதி")}</th>
                    <th className="pb-3 text-right">{t("Amount", "தொகை")}</th>
                    <th className="pb-3 text-center">{t("Status", "நிலை")}</th>
                    <th className="pb-3 text-center">{t("Synced", "ஒத்திசைவு")}</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-50">
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 font-mono font-medium text-slate-900">{inv.id}</td>
                      <td className="py-3 font-medium text-slate-800">{inv.customerName}</td>
                      <td className="py-3 text-slate-500">
                        {new Date(inv.createdAt).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 text-right font-semibold text-slate-900">
                        {settings.currency}{inv.grandTotal.toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : inv.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {t(inv.status, inv.status === 'Paid' ? 'கைப்பற்றப்பட்டது' : inv.status === 'Pending' ? 'நிலுவையில்' : 'செலுத்தப்படாத')}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${
                            inv.synced ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                          }`}
                          title={inv.synced ? t("Synced to Google Sheets", "கூகிள் சீட்டில் ஒத்திசைக்கப்பட்டது") : t("Unsynced Local Draft", "ஒத்திசைக்கப்படாத உள்ளூர் வரைவு")}
                        >
                          <Database size={12} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Information / GST rates details (Col Span 1) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-xs">
          <h3 className="font-bold text-slate-800 text-lg mb-4">
            {t("Business Insights", "வணிக விவரங்கள்")}
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-2">
              <h4 className="font-semibold text-slate-800">{t("Your Registration", "பதிவு எண்")}</h4>
              <p className="flex justify-between"><span>{t("GSTIN / VAT ID", "வரி எண் (GSTIN)")}:</span> <span className="font-mono font-bold text-slate-800">{settings.gstin || 'None'}</span></p>
              <p className="flex justify-between"><span>{t("Billing Email", "மின்னஞ்சல்")}:</span> <span className="text-slate-800">{settings.email}</span></p>
              <p className="flex justify-between"><span>{t("Phone Number", "தொலைபேசி")}:</span> <span className="text-slate-800">{settings.phone}</span></p>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs text-slate-600 space-y-2">
              <h4 className="font-semibold text-emerald-800">{t("Google Sheets Sync Instructions", "கூகிள் சீட் இணைப்பு")}</h4>
              <p className="leading-relaxed">
                {t(
                  "This software saves invoices in your local cache automatically. Connect it to Google Sheets in our Sync hub to easily send them directly into a beautiful sheet on your personal cloud.",
                  "இந்த செயலி உங்கள் தகவல்களை பாதுகாப்பாக கணினியிலேயே சேமிக்கும். உங்கள் சொந்த கூகிள் சீட்டில் பில்களை ஒத்திசைக்க, மேலே உள்ள 'கூகிள் சீட் ஒத்திசைவு' பக்கத்திற்குச் சென்று எளிய வழிமுறைகளை பின்பற்றவும்."
                )}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>{t("Total Billing Value", "மத்திய பில்களின் மொத்த மதிப்பு")}</span>
                <span className="text-slate-800">{settings.currency}{totalInvoiced.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full" 
                  style={{ width: `${totalInvoiced > 0 ? (totalRevenue / totalInvoiced) * 100 : 0}%` }}
                />
                <div 
                  className="bg-rose-500 h-full" 
                  style={{ width: `${totalInvoiced > 0 ? (pendingRevenue / totalInvoiced) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block"></span>{t("Paid", "செலுத்தப்பட்டது")} ({totalInvoiced > 0 ? Math.round((totalRevenue/totalInvoiced)*100) : 0}%)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-sm inline-block"></span>{t("Outstanding", "நிலுவையில்")}({totalInvoiced > 0 ? Math.round((pendingRevenue/totalInvoiced)*100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

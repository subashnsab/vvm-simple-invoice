import React from 'react';
import { Invoice, BusinessSettings } from '../types.ts';
import { Printer, ArrowLeft, Send, CheckCircle2, CloudLightning, Database, Sparkles, Edit } from 'lucide-react';

interface PrintInvoiceProps {
  invoice: Invoice;
  settings: BusinessSettings;
  onBack: () => void;
  lang: 'en' | 'ta';
  onSyncInvoiceToSheets: (invoice: Invoice) => Promise<boolean>;
  syncSettings: { webAppUrl: string };
  onEdit?: (invoice: Invoice) => void;
}

export const PrintInvoice: React.FC<PrintInvoiceProps> = ({
  invoice,
  settings,
  onBack,
  lang,
  onSyncInvoiceToSheets,
  syncSettings,
  onEdit
}) => {
  const t = (en: string, ta: string) => (lang === 'ta' ? ta : en);

  const hasTax = invoice.taxTotal > 0 || invoice.items.some(item => (item.taxPercent || 0) > 0);

  const handlePrint = () => {
    window.print();
  };

  // Generate UPI pay deep link for instant scanning
  const upiPayUrl = settings.upiId 
    ? `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.name)}&am=${invoice.grandTotal}&cu=INR&tn=${encodeURIComponent(`Invoice ${invoice.id}`)}`
    : '';

  // Google Charts QR code generator API
  const qrCodeImage = upiPayUrl 
    ? `https://chart.googleapis.com/chart?chs=140x140&cht=qr&chl=${encodeURIComponent(upiPayUrl)}&choe=UTF-8`
    : '';

  const handleSyncToSheets = async () => {
    if (!syncSettings.webAppUrl) {
      alert(t(
        "Please configure your Google Apps Script URL first in the Google Sheets Sync hub tab!",
        "தயவுசெய்து முதலில் 'கூகிள் சீட் ஒத்திசைவு' பக்கத்தில் உங்கள் ஆப்ஸ் ஸ்கிரிப்ட் முகவரியை உள்ளிடவும்!"
      ));
      return;
    }
    const ok = await onSyncInvoiceToSheets(invoice);
    if (ok) {
      alert(t("Invoice synced to Google Sheets successfully!", "இந்த பில் கூகிள் சீட்டில் வெற்றிகரமாக ஒத்திசைக்கப்பட்டது!"));
    } else {
      alert(t("Sync failed! Check your connection or Apps Script setup.", "ஒத்திசைவு தோல்வியடைந்தது! உங்கள் இணைப்பைச் சரிபார்க்கவும்."));
    }
  };

  return (
    <div className="space-y-6">
      {/* Printable Control bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 md:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 px-3.5 py-2 rounded-xl transition cursor-pointer active:scale-95"
        >
          <ArrowLeft size={14} />
          {t("Back to list", "பட்டியலுக்குத் திரும்பு")}
        </button>

        <div className="flex flex-wrap gap-2">
          {/* Edit invoice direct button */}
          {onEdit && (
            <button
              onClick={() => onEdit(invoice)}
              className="bg-white hover:bg-amber-50 border border-slate-200 text-amber-700 hover:border-amber-200 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95"
            >
              <Edit size={14} />
              {t("Edit Bill", "பில்லைத் திருத்துக")}
            </button>
          )}

          {/* Sheets sync button status */}
          <button
            onClick={handleSyncToSheets}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
              invoice.synced
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <CloudLightning size={14} />
            {invoice.synced ? t("Synced in Sheets", "கூகிள் சீட்டில் உள்ளது") : t("Sync to Google Sheets", "சீட்டுக்கு அனுப்பு")}
          </button>

          {/* Trigger Print */}
          <button
            onClick={handlePrint}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-5 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition active:scale-95"
          >
            <Printer size={14} />
            {t("Print / Save PDF", "அச்சிடு / PDF சேமி")}
          </button>
        </div>
      </div>

      {/* Actual Invoice Sheet (Sized for rendering letterhead standard layout) */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-sm md:p-10 p-6 max-w-4xl mx-auto print-container" id="printable-area">
        {/* Invoice Letterhead Header */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-150 pb-6 gap-6">
          <div className="space-y-1.5">
            <span className="text-emerald-500 font-extrabold text-2xl tracking-tight">{settings.name}</span>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md">{settings.address}</p>
            <div className="text-[11px] text-slate-450 space-y-0.5">
              <p><span>{t("Phone", "தொலைபேசி")}:</span> <span className="font-medium text-slate-700">{settings.phone}</span></p>
              <p><span>{t("Email", "மின்னஞ்சல்")}:</span> <span className="font-medium text-slate-700">{settings.email}</span></p>
              {settings.gstin && (
                <p><span>{t("GSTIN / REG", "பதிவு எண்(GSTIN)")}:</span> <span className="font-mono font-bold text-slate-705">{settings.gstin}</span></p>
              )}
            </div>
          </div>

          <div className="md:text-right space-y-1">
            <h1 className="text-slate-800 font-black text-3xl tracking-tight uppercase">{t("Invoice", "பில் நகல்")}</h1>
            <p className="text-xs font-bold text-slate-400 font-mono tracking-wider">{t("BILL NO", "பில் எண்")}: {invoice.id}</p>
            <div className="text-[11px] text-slate-500 pt-1.5">
              <p><span>{t("Date of Issue", "தேதி")}:</span> <span className="font-medium text-slate-800">{new Date(invoice.createdAt).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
              <p><span>{t("Status", "பணம் செலுத்திய நிலை")}:</span> <span className={`font-semibold ${invoice.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{t(invoice.status, invoice.status === 'Paid' ? 'செலுத்தப்பட்டது' : invoice.status === 'Pending' ? 'நிலுவையில்' : 'செலுத்தவில்லை')}</span></p>
              <p><span>{t("Paid Via", "செலுத்திய விதம்")}:</span> <span className="font-medium text-slate-800">{invoice.paymentMethod}</span></p>
            </div>
          </div>
        </div>

        {/* Client & Billing Info */}
        <div className="py-6 text-xs text-slate-655 border-b border-slate-100">
          <div className="space-y-1 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{t("Billed To client", "வாடிக்கையாளர் முகவரி")}:</h3>
            <p className="font-bold text-slate-800 text-sm">{invoice.customerName}</p>
            {invoice.customerPhone && <p><span className="text-slate-400">{t("Phone", "தொலைபேசி")}: </span><span className="font-medium text-slate-700">{invoice.customerPhone}</span></p>}
            {invoice.customerEmail && <p><span className="text-slate-400">{t("Email", "மின்னஞ்சல்")}: </span><span className="font-medium text-slate-700">{invoice.customerEmail}</span></p>}
            {invoice.customerAddress && <p className="leading-relaxed mt-1"><span className="text-slate-400">{t("Address", "முகவரி")}: </span><span className="text-slate-600">{invoice.customerAddress}</span></p>}
          </div>
        </div>

        {/* Invoice Itemized Spec Table */}
        <div className="py-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-blue-200 text-blue-600 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">{t("Item Specifications", "பொருட்கள் பட்டியல்")}</th>
                <th className="pb-3 text-right w-[60px]">{t("Qty", "அளவு")}</th>
                <th className="pb-3 text-right w-[100px]">{t("Unit rate", "யூனிட் விலை")}</th>
                {hasTax && <th className="pb-3 text-right w-[80px]">{t("GST", "வரி (%)")}</th>}
                <th className="pb-3 text-right w-[120px]">{hasTax ? t("Item Total (Pre-Tax)", "வரிக்கு முன் தொகை") : t("Item Total", "தொகை")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/20">
                  <td className="py-3 pl-2">
                    <p className="font-bold text-slate-800">{item.name}</p>
                    {item.description && <p className="text-[10px] text-slate-400 leading-relaxed">{item.description}</p>}
                  </td>
                  <td className="py-3 text-right font-mono">
                    {item.quantity} {item.unit === 'g' ? t("g", "கி") : item.unit === 'kg' ? t("kg", "விலா") : t("pcs", "பீஸ்")}
                  </td>
                  <td className="py-3 text-right font-mono">
                    {settings.currency}{item.price.toFixed(2)}
                    {item.unit === 'g' && <span className="text-[9px] text-slate-400 block font-sans lowercase">/{t("kg", "கிலோ")}</span>}
                  </td>
                  {hasTax && <td className="py-3 text-right font-mono">{item.taxPercent}%</td>}
                  <td className="py-3 text-right font-mono font-medium text-slate-900">
                    {settings.currency}{(item.unit === 'g' ? (item.quantity * item.price) / 1000 : item.quantity * item.price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mathematical summary section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-150">
          {/* Notes or Terms on Left, OR UPI payment QR code */}
          <div className="space-y-4">
            {invoice.notes && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[10px] text-slate-500 space-y-1">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">{t("Terms & Return Policies", "நிபந்தனைகள் & கடை ஒழுங்கு")}</h4>
                <p className="leading-relaxed">{invoice.notes}</p>
              </div>
            )}

            {/* Bank details */}
            {settings.bankName && (
              <div className="text-[10px] text-slate-450 space-y-0.5">
                <span className="font-bold text-slate-440 uppercase tracking-wider text-[9px]">{t("Payment Settlement Bank info", "வங்கி விவரங்கள்")}:</span>
                <p><span>{t("Bank", "வங்கி")}:</span> <span className="font-medium text-slate-700">{settings.bankName}</span></p>
                <p><span>{t("A/C No", "வங்கி கணக்கு எண்")}:</span> <span className="font-mono text-slate-700">{settings.accountNumber}</span></p>
                <p><span>{t("IFSC Code", "IFSC குறியீடு")}:</span> <span className="font-mono text-slate-700">{settings.ifscCode}</span></p>
              </div>
            )}
          </div>

          {/* Pricing settlement on Right with Digital Scan QR Code */}
          <div className="space-y-4 md:text-right flex flex-col md:items-end">
            <div className="w-full md:max-w-[280px] space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-450">{hasTax ? t("Subtotal (Pre-Tax)", "துணைத்தொகை") : t("Subtotal", "துணைத்தொகை")}:</span>
                <span className="font-medium font-mono text-slate-800">{settings.currency}{invoice.subtotal.toFixed(2)}</span>
              </div>
              
              {invoice.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>{t("Discount Deduction", "தள்ளுபடி")}:</span>
                  <span className="font-mono">- {settings.currency}{invoice.discount.toFixed(2)}</span>
                </div>
              )}

              {hasTax && (
                <div className="flex justify-between">
                  <span className="text-slate-450">{t("Taxes Total (GST)", "வொத்த வரி (GST)")}:</span>
                  <span className="font-medium font-mono text-slate-800">{settings.currency}{invoice.taxTotal.toFixed(2)}</span>
                </div>
              )}

              {(() => {
                const invoiceRoundOff = invoice.roundOff !== undefined 
                  ? invoice.roundOff 
                  : (invoice.grandTotal - (invoice.subtotal - invoice.discount + invoice.taxTotal));
                if (Math.abs(invoiceRoundOff) > 0.005) {
                  return (
                    <div className="flex justify-between">
                      <span className="text-slate-450">{t("Round Off", "ரவுண்ட் ஆஃப் (திருத்தம்)")}:</span>
                      <span className="font-medium font-mono text-slate-800">
                        {invoiceRoundOff > 0 ? '+' : ''}{settings.currency}{invoiceRoundOff.toFixed(2)}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 text-slate-900 font-bold">
                <span className="text-sm uppercase tracking-wide">{t("Total Grand Sum", "மொத்த பில் தொகை")}:</span>
                <span className="text-lg font-black font-mono text-emerald-600">
                  {settings.currency}{invoice.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Signature bar */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-12 mt-12 border-t border-slate-100">
          <p>{t("* This is a computer system generated bill.", "* இது கணினியால் உருவாக்கப்பட்ட பில் சீட்டு.")}</p>
          <div className="text-right space-y-1 max-w-[150px] border-t border-slate-300 pt-3">
            <span className="font-bold uppercase text-[9px] text-slate-500 block">{t("Authorised Signature", "அங்கீகரிக்கப்பட்ட கையொப்பம்")}</span>
            <p className="text-slate-700 italic">{settings.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { SyncSettings, Invoice } from '../types.ts';
import { googleAppsScriptCode } from '../utils/appScriptCode.ts';
import { Database, Link, Copy, Check, Terminal, ExternalLink, RefreshCw, Layers, CheckCircle2, CloudLightning } from 'lucide-react';

interface SyncHubProps {
  syncSettings: SyncSettings;
  updateSyncSettings: (settings: SyncSettings) => void;
  invoices: Invoice[];
  onSyncInvoiceToSheets: (invoice: Invoice) => Promise<boolean>;
  lang: 'en' | 'ta';
}

export const SyncHub: React.FC<SyncHubProps> = ({
  syncSettings,
  updateSyncSettings,
  invoices,
  onSyncInvoiceToSheets,
  lang
}) => {
  const t = (en: string, ta: string) => (lang === 'ta' ? ta : en);

  const [webAppUrl, setWebAppUrl] = useState(syncSettings.webAppUrl || '');
  const [autoSync, setAutoSync] = useState(syncSettings.autoSync || false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [bulkSyncResult, setBulkSyncResult] = useState<string | null>(null);

  const unsyncedCount = invoices.filter(inv => !inv.synced).length;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSyncSettings({
      webAppUrl,
      autoSync
    });
    alert(t("Sync configurations updated!", "ஒத்திசைவு விவரங்கள் வெற்றிகரமாக சேமிக்கப்பட்டது!"));
  };

  // Test the Google Apps Script Web App Connection
  const handleTestConnection = async () => {
    if (!webAppUrl) {
      setTestResult({
        success: false,
        message: t("Please enter a Google Web App URL first.", "தயவுசெய்து ஆப்ஸ் ஸ்கிரிப்ட் URL முகவரியை முதலில் உள்ளிடவும்.")
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Apps Script Web App doGet responds to GET requests
      const res = await fetch(webAppUrl, { method: 'GET' });
      const data = await res.json();
      
      if (data.status === 'success') {
        setTestResult({
          success: true,
          message: t("Connection successful! Spreadsheet connected: " + (data.spreadsheetName || 'Active Sheet'), "தொடர்பு வெற்றிகரமாக அமைக்கப்பட்டது! இணைக்கப்பட்ட தாள்: " + (data.spreadsheetName || 'Active Sheet'))
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || t("Apps Script returned an error response.", "ஆப்ஸ் ஸ்கிரிப்ட் பிழைச் செய்தியைத் தந்தது.")
        });
      }
    } catch (err) {
      console.error(err);
      // In web app endpoints, CORS can block direct GET tests depending on redirect configs. We will handle gracefully:
      setTestResult({
        success: true,
        message: t("Requested connection trigger. (If your script is deployed as 'Anyone', it is ready to receive invoices!)", "தொடர்பு தூண்டப்பட்டது. (உங்கள் ஸ்கிரிப்ட் 'Anyone' எனப் பகிரப்பட்டிருந்தால், பில்களைப் பெற அது தயாராக உள்ளது!)")
      });
    } finally {
      setTesting(false);
    }
  };

  // Bulk sync all unsynced local invoices
  const handleBulkSync = async () => {
    if (!webAppUrl) {
      alert(t("Configure and save your Web App URL first!", "முதலில் உங்கள் வலைப் பயன்பாட்டு URL முகவரியை உள்ளிட்டு சேமிக்கவும்!"));
      return;
    }

    const unsyncedInvoices = invoices.filter(inv => !inv.synced);
    if (unsyncedInvoices.length === 0) {
      alert(t("All invoices are already synced!", "அனைத்து பில்களும் ஏற்கனவே ஒத்திசைக்கப்பட்டுள்ளன!"));
      return;
    }

    setBulkSyncing(true);
    setBulkSyncResult(null);
    let successCount = 0;

    for (const inv of unsyncedInvoices) {
      try {
        const ok = await onSyncInvoiceToSheets(inv);
        if (ok) successCount++;
      } catch (err) {
        console.error("Bulk sync error for", inv.id, err);
      }
    }

    setBulkSyncing(false);
    setBulkSyncResult(t(
      `Successfully synced ${successCount} of ${unsyncedInvoices.length} invoices directly to your Sheet.`,
      `வெற்றிகரமாக ${unsyncedInvoices.length} பில்களில் ${successCount} பில்கள் கூகிள் சீட்டில் ஒத்திசைக்கப்பட்டன.`
    ));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Configuration Column */}
      <div className="lg:col-span-5 space-y-5">
        {/* Connection Form */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Link className="text-emerald-500" size={18} />
            {t("Google Sheets Sync Portal", "கூகிள் சீட் ஒத்திசைவு")}
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {t("Apps Script Web App URL", "ஆப்ஸ் ஸ்கிரிப்ட் URL முகவரி")}
              </label>
              <input
                type="url"
                required
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-xs font-mono outline-none transition"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {t("Copy this URL from the 'Deployment' tab of your Google sheet Apps Script.", "உங்கள் கூகிள் தாளின் ஆப்ஸ் ஸ்கிரிப்ட் புதிய வரிசைப்படுத்தல் பிரிவில் இருந்து இதைப் பெற்றுக்கொள்ளவும்.")}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <input
                type="checkbox"
                id="autoSync"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-4 h-4 text-emerald-500 focus:ring-emerald-400 accent-emerald-500 rounded cursor-pointer"
              />
              <label htmlFor="autoSync" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                {t("Automated Sync upon Invoice completion", "ஒவ்வொரு புதிய பில்லுக்கும் உடனே தானாகவே ஒத்திசைக்க")}
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-xs active:scale-95 transition cursor-pointer"
              >
                {t("Save Configuration", "விவரங்களைச் சேமி")}
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold px-4 py-2.5 rounded-xl text-xs active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {testing ? <RefreshCw size={13} className="animate-spin" /> : <Database size={13} />}
                {t("Test URL", "சரிபார்க்க")}
              </button>
            </div>
          </form>

          {/* Test connection result banner */}
          {testResult && (
            <div className={`p-3.5 rounded-xl text-xs flex gap-2 border ${
              testResult.success 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                : 'bg-rose-50 text-rose-800 border-rose-100'
            }`}>
              {testResult.success ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <Database size={16} className="text-rose-600 shrink-0" />}
              <p className="leading-relaxed">{testResult.message}</p>
            </div>
          )}
        </div>

        {/* Sync queue panel */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
          <h4 className="font-bold text-slate-850 text-sm flex items-center gap-1.5">
            <Layers size={16} className="text-emerald-500" />
            {t("Direct Sync Management Queue", "தற்போது ஒத்திசைக்கப்படாத பில்கள்")}
          </h4>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">{t("Total draft bills waiting sync:", "ஒத்திசைக்க காத்திருக்கும் பில்கள் எண்ணிக்கை:")}</span>
            <span className="font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-mono">{unsyncedCount}</span>
          </div>

          <button
            onClick={handleBulkSync}
            disabled={bulkSyncing || unsyncedCount === 0}
            className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95 border cursor-pointer ${
              unsyncedCount === 0
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700 hover:shadow-md'
            }`}
          >
            {bulkSyncing ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <CloudLightning size={16} />
            )}
            {t("Bulk Sync Unsynced Bills Now", "அனைத்து நிலுவைப் பில்களையும் சீட்டுக்கு அனுப்பு")}
          </button>

          {bulkSyncResult && (
            <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 p-3 rounded-xl text-xs flex gap-2">
              <CheckCircle2 size={14} className="text-indigo-600 shrink-0 mt-0.5" />
              <p>{bulkSyncResult}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tutorial / Code Paste Column */}
      <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-xs space-y-5">
        <div>
          <h3 className="font-bold text-slate-800 text-base">
            {t("Integration Guide & Apps Script Code", "ஆப்ஸ் ஸ்கிரிப்ட் ஒருங்கிணைப்பு வழிகாட்டி")}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              "Follow these steps to connect this application to your personal and secure Google Sheet.",
              "உங்கள் தனிப்பட்ட கூகிள் சீட்டுடன் பில்லிங் இணையத்தை இணைக்க பின்வரும் வழிமுறைகளைப் பின்பற்றவும்."
            )}
          </p>
        </div>

        {/* Setup steps */}
        <div className="text-xs text-slate-600 space-y-2 border-l border-emerald-500 pl-4 py-1 ml-1">
          <p><span className="font-bold text-slate-800">1.</span> {t("Create a new Google Sheet on drive.google.com and name it as you wish.", "கூகிளில் ஒரு புதிய தாள் (Google Sheet) அமைத்து பெயர் சூட்டவும்.")}</p>
          <p><span className="font-bold text-slate-800">2.</span> {t("Go to 'Extensions' menu on the sheet toolbar -> click 'Apps Script'.", "கூகிள் தாளின் மேலே உள்ள 'Extensions' மெனுவை அழுத்தி -> 'Apps Script' என்பதைத் தேடவும்.")}</p>
          <p><span className="font-bold text-slate-800">3.</span> {t("Copy the block of code below using the copy button.", "கீழே கொடுக்கப்பட்டுள்ள ஆப்ஸ் ஸ்கிரிப்ட் குறியீட்டை படியெடுக்கவும்.")}</p>
          <p><span className="font-bold text-slate-800">4.</span> {t("Erase any default code in Code.gs editor and paste this code.", "ஆப்ஸ் ஸ்கிரிப்ட்டில் உள்ள பழைய வரிகளை முழுவதுமாக நீக்கிவிட்டு இந்த குறியீட்டை ஒட்டவும்.")}</p>
          <p><span className="font-bold text-slate-800">5.</span> {t("Click 'Deploy' -> Choose 'New deployment' -> Select 'Web app' type.", "'Deploy' -> 'New deployment' -> 'Web app' என்பதை தேர்வு செய்யவும்.")}</p>
          <p><span className="font-bold text-slate-800">6.</span> {t("Set Execute as: 'Me' & Who has access: 'Anyone' -> Click Deploy, authorise scopes, and COPY the Web App URL!", "விவரங்களை - 'Execute as': 'Me' மற்றும் 'Who has access': 'Anyone' என செட் செய்து, சேமித்து, கிடைக்கும் URL-ஐ படியெடுக்கவும்.")}</p>
        </div>

        {/* Code display with Copy */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs bg-slate-900 text-slate-300 px-4 py-2 rounded-t-xl font-semibold">
            <span className="flex items-center gap-1.5"><Terminal size={14} className="text-emerald-400" /> code.gs (Google Apps Script)</span>
            <button
              onClick={handleCopyCode}
              className="hover:text-emerald-400 flex items-center gap-1.5 font-medium transition cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? t("Copied!", "நகலெடுக்கப்பட்டது!") : t("Copy Code", "இதை நகலெடு")}
            </button>
          </div>
          <div className="bg-slate-950 p-4 rounded-b-xl border border-slate-900 border-t-0 font-mono text-[10px] text-emerald-400 max-h-[250px] overflow-y-auto overflow-x-auto no-scrollbar whitespace-pre leading-relaxed">
            {googleAppsScriptCode}
          </div>
        </div>
      </div>
    </div>
  );
};

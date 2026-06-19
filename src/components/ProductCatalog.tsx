import React, { useState, useEffect } from 'react';
import { Product, BusinessSettings } from '../types.ts';
import { Plus, Trash2, ShoppingBag, Check, AlertCircle, Upload, CheckCircle2, FileSpreadsheet, Info, X, FileUp } from 'lucide-react';
import { read, utils } from 'xlsx';

interface ProductCatalogProps {
  products: Product[];
  settings: BusinessSettings;
  onAddProduct: (product: Product) => void;
  onAddProducts?: (listOfProducts: Product[]) => void;
  onDeleteProduct: (id: string) => void;
  lang: 'en' | 'ta';
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  settings,
  onAddProduct,
  onAddProducts,
  onDeleteProduct,
  lang
}) => {
  const t = (en: string, ta: string) => (lang === 'ta' ? ta : en);

  // Switch between 'single' and 'bulk' import mode
  const [activeMode, setActiveMode] = useState<'single' | 'bulk'>('single');

  // Single Product Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [taxPercent, setTaxPercent] = useState<number>(18);

  // Bulk Product States
  const [bulkText, setBulkText] = useState('');
  const [parsedProducts, setParsedProducts] = useState<Omit<Product, 'id'>[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isSuccessfullyImported, setIsSuccessfullyImported] = useState(false);

  // File drag & drop and manual selection states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const parseUploadedFile = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Get rows of array data
          const rows = utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          
          if (rows.length === 0) {
            setParseErrors([t("Excel sheet is empty", "எக்செல் தாளில் விவரங்கள் ஏதுமில்லை")]);
            return;
          }

          // Map each row to a TSV/comma representation, preserving structure
          const formattedLines = rows.map((row) => {
            if (!Array.isArray(row)) return '';
            return row.map(cell => {
              if (typeof cell === 'string') {
                return cell.replace(/[\t\r\n]/g, ' ');
              }
              return cell !== null && cell !== undefined ? String(cell) : '';
            }).join('\t');
          }).filter(line => line.trim() !== '').join('\n');

          setBulkText(formattedLines);
          setUploadedFileName(file.name);
          setIsSuccessfullyImported(false);
        } catch (err: any) {
          console.error(err);
          setParseErrors([t(`Failed to parse Excel file: ${err.message || err}`, `எக்செல் கோப்பை பகுப்பாய்வு செய்வதில் தோல்வி: ${err.message || err}`)]);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (fileExtension === 'csv' || fileExtension === 'tsv' || fileExtension === 'txt') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          if (!text || !text.trim()) {
            setParseErrors([t("The selected file is empty", "தேர்ந்தெடுக்கப்பட்ட கோப்பு காலியாக உள்ளது")]);
            return;
          }
          setBulkText(text);
          setUploadedFileName(file.name);
          setIsSuccessfullyImported(false);
        } catch (err: any) {
          console.error(err);
          setParseErrors([t(`Failed to read file: ${err.message || err}`, `கோப்பை வாசிப்பதில் தோல்வி: ${err.message || err}`)]);
        }
      };
      reader.readAsText(file);
    } else {
      alert(t("Unsupported file format. Please upload .xlsx, .xls, .csv, or .txt", "ஆதரிக்கப்படாத கோப்பு வடிவம். .xlsx, .xls, .csv, அல்லது .txt கோப்பை பதிவேற்றவும்"));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      parseUploadedFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      parseUploadedFile(files[0]);
    }
  };

  const handleClearFile = () => {
    setBulkText('');
    setUploadedFileName('');
    setParsedProducts([]);
    setParseErrors([]);
  };

  // Handle single product submit
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name,
      description,
      price: Number(price),
      taxPercent: Number(taxPercent)
    };

    onAddProduct(newProduct);

    // Reset single form
    setName('');
    setDescription('');
    setPrice('');
    setTaxPercent(18);
  };

  // Live parser for the raw bulk input text
  useEffect(() => {
    if (!bulkText.trim()) {
      setParsedProducts([]);
      setParseErrors([]);
      return;
    }

    const lines = bulkText.split(/\r?\n/);
    const validRows: Omit<Product, 'id'>[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return; // skip completely empty rows

      // Header row check - ignore if they copy header line e.g. "Name, Price, ..."
      const isHeader = index === 0 && (
        trimmedLine.toLowerCase().includes('name') || 
        trimmedLine.toLowerCase().includes('price') || 
        trimmedLine.toLowerCase().includes('gst') ||
        trimmedLine.toLowerCase().includes('பெயர்')
      );
      if (isHeader) return;

      // Determine separator: Tab (from Excel/Sheets copy-paste) takes precedence, then comma
      let parts: string[] = [];
      if (trimmedLine.includes('\t')) {
        parts = trimmedLine.split('\t');
      } else {
        parts = trimmedLine.split(',');
      }

      const rowName = parts[0]?.trim();
      if (!rowName) {
        errors.push(t(`Line ${index + 1}: Product name is missing or empty`, `வரி ${index + 1}: பொருள் பெயர் விடுபட்டுள்ளது`));
        return;
      }

      // Column 2: Price
      let rawPriceStr = parts[1] ? parts[1].trim() : '';
      // Clean string to keep only digits and floats
      rawPriceStr = rawPriceStr.replace(/[^0-9.]/g, '');
      const parsedPrice = parseFloat(rawPriceStr);

      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        errors.push(t(
          `Line ${index + 1} ("${rowName.substring(0, 15)}..."): Unit price "${parts[1] || ''}" must be a clear number above 0`,
          `வரி ${index + 1} ("${rowName.substring(0, 15)}..."): யூனிட் விலை "${parts[1] || ''}" பூஜ்ஜியத்திற்கு மேல் எண்ணாக இருக்கவேண்டும்`
        ));
        return;
      }

      // Column 3: Tax (GST %)
      let rawTaxStr = parts[2] ? parts[2].trim() : '';
      rawTaxStr = rawTaxStr.replace(/[^0-9]/g, '');
      let parsedTax = parseInt(rawTaxStr, 10);
      if (isNaN(parsedTax)) {
        parsedTax = 18; // Default fallback to standard 18% GST
      } else {
        // Force clamp to sensible GST tax rates if they entered roughly
        if (![0, 3, 5, 12, 18, 28].includes(parsedTax)) {
          // If they wrote something close, keep it or use 18
          if (parsedTax < 0) parsedTax = 0;
          if (parsedTax > 100) parsedTax = 18;
        }
      }

      // Column 4: Description (Optional)
      const parsedDesc = parts[3] ? parts[3].trim().replace(/^"|"$/g, '') : ''; // Strip optional quotes

      validRows.push({
        name: rowName.replace(/^"|"$/g, ''), // Strip possible quotes from excel
        price: parsedPrice,
        taxPercent: parsedTax,
        description: parsedDesc || undefined
      });
    });

    setParsedProducts(validRows);
    setParseErrors(errors);
  }, [bulkText, lang]);

  // Handle bulk add imports
  const handleBulkImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedProducts.length === 0) return;

    if (onAddProducts) {
      // Map temporary products to official Product directory format
      const timestamp = Date.now();
      const productObjects: Product[] = parsedProducts.map((p, idx) => ({
        ...p,
        id: `prod-${timestamp}-${idx}`
      }));
      onAddProducts(productObjects);
    } else {
      // Manual fallback if addProducts bulk prop is missing
      parsedProducts.forEach((p, idx) => {
        onAddProduct({
          ...p,
          id: `prod-${Date.now()}-${idx}`
        });
      });
    }

    // Done Success notification
    setIsSuccessfullyImported(true);
    setBulkText('');
    setUploadedFileName('');
    setParsedProducts([]);
    setParseErrors([]);

    setTimeout(() => {
      setIsSuccessfullyImported(false);
    }, 4000);
  };

  // Populate input box with clear templates
  const handleLoadDemoTemplate = () => {
    const demoCsv = t(
      "Product Name\tUnit Price\tGST%\tShort Description\nSilk Cotton Saree\t1450\t12\tPure south handloom printed\nPure Silver Anklet\t2400\t3\t92.5 stamped traditional weave\nExecutive Brass Lamp\t3200\t18\tAura style standard tall pooja kuthu vilakku\nSandalwood Soap Pack\t380\t18\tNatural essential oil pack of 3",
      "பொருள் விவரம்\tவிலை\tவரி%\tவிவரிப்பு\nபட்டு பருத்தி புடவை\t1450\t12\tநேர்த்தியான கைத்தறி வேலைப்பாடு\nவெள்ளி கொலுசு\t2400\t3\tபாரம்பரிய தரம் 92.5 முத்திரை பெற்றது\nசெம்பு குத்துவிளக்கு\t3200\t18\tபூஜை தட்டுகளுக்கான நேர்த்தியான விளக்கு\nசந்தன சோப்பு பேக்\t380\t18\tஇயற்கை அத்தியாவசிய எண்ணெய் 3-இன் பேக்"
    );
    setBulkText(demoCsv);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product creation control column */}
      <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs h-fit space-y-4">
        
        {/* Toggle Option Header Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-50 border border-slate-150 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveMode('single')}
            className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'single'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Plus size={13} />
            {t("Single Item", "ஒரு பொருள்")}
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('bulk')}
            className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'bulk'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Upload size={13} />
            {t("Bulk Import", "ஒட்டுமொத்த பதிவேற்றம்")}
          </button>
        </div>

        {/* MODE A: SINGLE PRODUCT FORM */}
        {activeMode === 'single' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <ShoppingBag className="text-emerald-500" size={18} />
              {t("Add New Product", "புதிய பொருளை பதிவேற்று")}
            </h3>
            
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  {t("Product Name*", "பொருள் பெயர்*")}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("e.g. Silk Shirt", "உம். பட்டு வேட்டி")}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  {t("Short Description", "விவரக் குறிப்பு")}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("e.g. Pure cotton, white", "உம். தூய பருத்தி, வெளிறிய நிறம்")}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {t("Unit Price*", "யூனிட் விலை*")}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{settings.currency}</span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl pl-6 pr-2 py-2 text-sm text-right outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {t("GST / Tax %", "வரி விகிதம்")}
                  </label>
                  <select
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-2 py-2 text-sm text-right outline-none transition"
                  >
                    <option value="0">GST 0%</option>
                    <option value="3">GST 3%</option>
                    <option value="5">GST 5%</option>
                    <option value="12">GST 12%</option>
                    <option value="18">GST 18%</option>
                    <option value="28">GST 28%</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-xs active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 "
              >
                <Plus size={14} />
                {t("Add to Inventory List", "பட்டியலில் சேமி")}
              </button>
            </form>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-slate-600 flex gap-2">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {t(
                  "Saving items to the catalog allows you to instantly search and autofill them when generating invoices, avoiding manual typing.",
                  "தயாரிப்புகளை இங்கு சேமிப்பதன் மூலம், நீங்கள் புதிய பில் தயாரிக்கும் போது அவற்றின் விலையையும் வரியையும் நேரடியாய் தட்டச்சு செய்யாமல் ஒரே கிளிக்கில் தேர்ந்தெடுக்க முடியும்."
                )}
              </p>
            </div>
          </div>
        )}

        {/* MODE B: BULK EXCEL/CSV DATA PASTER */}
        {activeMode === 'bulk' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <FileSpreadsheet className="text-indigo-500" size={18} />
                {t("Smart Bulk Portal", "ஒட்டுமொத்த பதிவேற்றம்")}
              </h3>
              
              <button
                type="button"
                onClick={handleLoadDemoTemplate}
                className="text-[10px] bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 font-bold px-2 py-1 rounded-md transition"
              >
                {t("Load Example", "உதாரணத்தை காட்டு")}
              </button>
            </div>

            <form onSubmit={handleBulkImportSubmit} className="space-y-3">
              {/* Drag and Drop Zone / File Info */}
              {!uploadedFileName ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-indigo-200 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/20'
                  }`}
                  onClick={() => document.getElementById('excel-file-input')?.click()}
                >
                  <input
                    id="excel-file-input"
                    type="file"
                    accept=".xlsx,.xls,.csv,.tsv,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <FileUp className={`h-6 w-6 ${isDragging ? 'text-indigo-600 animate-bounce' : 'text-indigo-400'}`} />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700">
                      {t("Upload Excel (.xlsx/.xls) or CSV", "எக்செல் அல்லது சிஎஸ்வி கோப்பை பதிவேற்றவும்")}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {t("Drag & drop here, or click to browse", "இங்கே இழுத்துவிடவும் அல்லது கோப்பைத் தேர்ந்தெடுக்கவும்")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-150 rounded-xl animate-fade">
                  <div className="flex items-center gap-2 truncate">
                    <FileSpreadsheet className="text-emerald-600 shrink-0" size={16} />
                    <span className="text-xs font-semibold text-emerald-900 truncate max-w-[200px]" title={uploadedFileName}>
                      {uploadedFileName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="p-1 hover:bg-emerald-100 rounded-md text-emerald-600 hover:text-emerald-800 transition cursor-pointer"
                    title={t("Clear file", "கோப்பை நீக்கு")}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  {t("Data Preview Grid & Editor", "தயாரிப்புகள் விவரங்கள் & எடிட்டர்")}
                </label>
                <textarea
                  rows={4}
                  required
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={t(
                    `Format of each copied row:\nItem Name [tab] Price [tab] GST% [tab] Description\n\ne.g.\nSilk Cotton Saree\t1450\t12\tPure south handloom\nPooja Lamp\t320\t18\tPure solid brass`,
                    `வடிவமைப்பு:\nபொருள் பெயர் [tab/comma] விலை [tab/comma] வரி% [tab/comma] விவரிப்பு\n\nஎ.கா.\nபட்டு பருத்தி சேலை\t1450\t12\tகைத்தறி புடவை\nகுத்து விளக்கு\t320\t18\tசெம்பு வடிவமைப்பு`
                  )}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2 text-xs font-mono outline-none transition"
                />
              </div>

              {/* Status Indicators & Parse Results */}
              {parsedProducts.length > 0 && (
                <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl space-y-1.5">
                  <p className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-indigo-600" />
                    {t(
                      `Ready to Import ${parsedProducts.length} clean products!`,
                      `வெற்றிகரமாக ${parsedProducts.length} தயாரிப்புகள் கண்டறியப்பட்டுள்ளன!`
                    )}
                  </p>
                  <p className="text-[10px] text-indigo-700 leading-normal">
                    {t(
                      "Review the live parsed grid table on the right-hand panel, then click IMPORT below.",
                      "வலதுபுறம் கொடுக்கப்பட்டுள்ள பட்டியலில் இவற்றை சரிபார்த்துவிட்டு, கீழே உள்ள 'இறக்குமதி செய்' பொத்தானை அழுத்தவும்."
                    )}
                  </p>
                </div>
              )}

              {parseErrors.length > 0 && (
                <div className="p-3 bg-amber-50/90 border border-amber-100 rounded-xl space-y-1 max-h-[140px] overflow-y-auto font-sans">
                  <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
                    <Info size={13} className="text-amber-600" />
                    {t("Warnings / Skipping Issues:", "கண்டறியப்பட்ட பிழைகள் / தவிர்க்கப்பட்டவை:")}
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 font-mono text-[9px] text-slate-500">
                    {parseErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="submit"
                disabled={parsedProducts.length === 0}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 ${
                  parsedProducts.length === 0
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 cursor-pointer'
                }`}
              >
                <Plus size={14} />
                {t(`Import Products (${parsedProducts.length} items)`, `இறக்குமதி செய் (${parsedProducts.length} பொருட்கள்)`)}
              </button>
            </form>

            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[10px] text-slate-500 flex gap-2">
              <Info size={14} className="text-indigo-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-slate-700">{t("Pro Excel Copying Tip:", "முக்கிய குறிப்பு (Excel / Google Sheets):")}</p>
                <p className="leading-relaxed">
                  {t(
                    "You can select columns in your Microsoft Excel or Google Sheet, copy them (Ctrl+C / Cmd+C) and simply paste (Ctrl+V) directly inside the text box above!",
                    "உங்கள் எக்செல் அல்லது கூகிள் தாளில் உள்ள வரிகளை அப்படியே செலக்ட் செய்து, காப்பி செய்து (Ctrl+C) இந்த பெட்டியில் நேரடியாக பேஸ்ட் (Ctrl+V) செய்ய முடியும்!"
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sync Saved Success Notification Toast */}
        {isSuccessfullyImported && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs flex gap-2 animate-pulse mt-2">
            <Check className="text-emerald-600 shrink-0 mt-0.5" size={14} />
            <p className="font-semibold leading-relaxed">
              {t("Bulk Products successfully imported to inventory!", "அனைத்து தயாரிப்புகளும் வெற்றிகரமாக சேமிக்கப்பட்டன!")}
            </p>
          </div>
        )}
      </div>

      {/* Product List Inventory Grid */}
      <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
        
        {/* If bulk import has parsed items in buffer, show preview layout */}
        {activeMode === 'bulk' && parsedProducts.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-50 pb-2">
              <div className="space-y-0.5">
                <h3 className="font-black text-indigo-700 text-sm tracking-wide uppercase flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  {t("Draft Bulk Preview Table", "பதிவேற்றப்படும் பொருட்களின் விவரங்கள்")}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {t("Validate details before committing to your official company list.", "தயாரிப்புகள் பட்டியலை சேமிக்கும் முன் அவற்றின் விலை, வரியை சரிபார்க்கவும்.")}
                </p>
              </div>
              <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded text-[10px]">
                {parsedProducts.length} {t("Draft items ready", "பொருட்கள் தயார்")}
              </span>
            </div>

            <div className="overflow-x-auto border border-dashed border-indigo-200 rounded-xl bg-indigo-50/10 p-2 max-h-[350px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-indigo-900 font-bold">
                    <th className="pb-2 pl-2 w-[40%]">{t("Product Name", "பொருள் விவரம்")}</th>
                    <th className="pb-2 text-right w-[20%]">{t("Unit rate", "விலை")}</th>
                    <th className="pb-2 text-center w-[15%]">{t("GST", "வரி")}</th>
                    <th className="pb-2 pl-3 w-[25%]">{t("Short Description", "விளக்கம்")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-indigo-50/20 text-slate-700">
                      <td className="py-2 pl-2 font-semibold text-slate-800 truncate max-w-[120px]">{p.name}</td>
                      <td className="py-2 text-right font-mono font-bold text-slate-900">{settings.currency}{p.price.toFixed(2)}</td>
                      <td className="py-2 text-center">
                        <span className="bg-indigo-50/80 text-indigo-750 font-bold px-1.5 py-0.5 rounded text-[9px]">
                          GST {p.taxPercent}%
                        </span>
                      </td>
                      <td className="py-2 pl-3 text-slate-400 truncate max-w-[120px]">{p.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-1">
          <h3 className="font-bold text-slate-800 text-base">
            {t("Stored Inventory List", "சேமிக்கப்பட்ட பொருட்கள் பட்டியல்")} ({products.length})
          </h3>
        </div>

        {products.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ShoppingBag className="mx-auto text-slate-200 mb-2" size={40} />
            <p className="text-sm">{t("No products in list. Insert items using the left form.", "பொருட்கள் பட்டியல் காலியாக உள்ளது. இடது பக்க படிவத்தை பயன்படுத்தி புதியவற்றை சேர்க்கவும்.")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="pb-3 pl-2">{t("Item Specifications", "விவரங்கள்")}</th>
                  <th className="pb-3 text-right">{t("Rate / Price", "வாடிக்கையாளர் விலை")}</th>
                  <th className="pb-3 text-center w-[100px]">{t("Tax Code", "GST வரி")}</th>
                  <th className="pb-3 text-center w-[60px]"></th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 pl-2 max-w-[200px]">
                      <h4 className="font-bold text-slate-800 text-sm">{prod.name}</h4>
                      {prod.description && <p className="text-xs text-slate-400 truncate" title={prod.description}>{prod.description}</p>}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">
                      {settings.currency}{prod.price.toFixed(2)}
                    </td>
                    <td className="py-3 text-center">
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block">
                        GST {prod.taxPercent}%
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => onDeleteProduct(prod.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title={t("Delete item", "நீக்கு")}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

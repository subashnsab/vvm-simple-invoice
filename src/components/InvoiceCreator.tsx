import React, { useState, useEffect } from 'react';
import { Product, Customer, InvoiceItem, Invoice, BusinessSettings } from '../types.ts';
import { Plus, Trash2, Save, ShoppingBag, Eye, UserPlus, Calculator, Minimize2, Check, AlertCircle } from 'lucide-react';

interface InvoiceCreatorProps {
  products: Product[];
  customers: Customer[];
  settings: BusinessSettings;
  onSaveInvoice: (invoice: Invoice) => void;
  onAddProduct?: (p: Product) => void;
  lang: 'en' | 'ta';
  setCurrentTab: (tab: string) => void;
  setSelectedInvoiceId: (id: string | null) => void;
  invoiceToEdit?: Invoice | null;
}

export const InvoiceCreator: React.FC<InvoiceCreatorProps> = ({
  products,
  customers,
  settings,
  onSaveInvoice,
  onAddProduct,
  lang,
  setCurrentTab,
  setSelectedInvoiceId,
  invoiceToEdit
}) => {
  const t = (en: string, ta: string) => (lang === 'ta' ? ta : en);

  // Form States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | 'Other'>('UPI');
  const [status, setStatus] = useState<'Paid' | 'Unpaid' | 'Pending'>('Paid');
  const [notes, setNotes] = useState(t("Thank you for your business! Standard returns/replacements allowed within 7 days with this bill copy.", "எங்கள் கடையில் பொருட்கள் வாங்கியமைக்கு மனமார்ந்த நன்றி! இந்த பில் நகலுடன் 7 நாட்களுக்குள் மாற்றி வாங்கிக்கொள்ளலாம்."));
  
  // Custom states for Autocomplete Product Search & Creation
  const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);
  const [successStatus, setSuccessStatus] = useState<string>('');

  // Invoice items state
  const [items, setItems] = useState<any[]>([
    { id: '1', name: '', description: '', quantity: 1, price: 0, taxPercent: 0, unit: 'pcs' }
  ]);
  const [discount, setDiscount] = useState<number>(0);

  // Autofill from customer select list
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    if (!id) {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      return;
    }
    const c = customers.find(cust => cust.id === id);
    if (c) {
      setCustomerName(c.name);
      setCustomerPhone(c.phone);
      setCustomerEmail(c.email);
      setCustomerAddress(c.address);
    }
  };

  // Pre-load from invoiceToEdit if provided
  useEffect(() => {
    if (invoiceToEdit) {
      setCustomerName(invoiceToEdit.customerName);
      setCustomerPhone(invoiceToEdit.customerPhone || '');
      setCustomerEmail(invoiceToEdit.customerEmail || '');
      setCustomerAddress(invoiceToEdit.customerAddress || '');
      setPaymentMethod(invoiceToEdit.paymentMethod);
      setStatus(invoiceToEdit.status);
      setNotes(invoiceToEdit.notes || '');
      setItems(invoiceToEdit.items);
      setDiscount(invoiceToEdit.discount || 0);
      
      // Try to find matching customer ID from name
      const foundCust = customers.find(c => c.name.toLowerCase() === invoiceToEdit.customerName.toLowerCase());
      if (foundCust) {
        setSelectedCustomerId(foundCust.id);
      } else {
        setSelectedCustomerId('');
      }
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      setPaymentMethod('UPI');
      setStatus('Paid');
      setNotes(t("Thank you for your business! Standard returns/replacements allowed within 7 days with this bill copy.", "எங்கள் கடையில் பொருட்கள் வாங்கியமைக்கு மனமார்ந்த நன்றி! இந்த பில் நகலுடன் 7 நாட்களுக்குள் மாற்றி வாங்கிக்கொள்ளலாம்."));
      setItems([
        { id: '1', name: '', description: '', quantity: 1, price: 0, taxPercent: 0, unit: 'pcs' }
      ]);
      setDiscount(0);
      setSelectedCustomerId('');
    }
  }, [invoiceToEdit, customers]);

  // Pre-load customer directory details if any
  useEffect(() => {
    if (customers.length > 0 && !customerName) {
      // Don't auto-fill unless they select, keeping form flexible
    }
  }, [customers]);

  // Handle adding product line item from dropdown
  const handleProductSelect = (index: number, productId: string) => {
    if (!productId) return;
    const p = products.find(prod => prod.id === productId);
    if (p) {
      const updated = [...items];
      updated[index] = {
        ...updated[index],
        name: p.name,
        description: p.description || '',
        price: p.price,
        taxPercent: 0
      };
      setItems(updated);
    }
  };

  const getItemPreTaxTotal = (item: any) => {
    const qty = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0;
    const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
    if (item.unit === 'g') {
      return (qty * price) / 1000;
    }
    return qty * price;
  };

  const handleAddItem = () => {
    const nextIdx = items.length;
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      name: '',
      description: '',
      quantity: 1,
      price: 0,
      taxPercent: 0,
      unit: 'pcs'
    };
    setItems([...items, newItem]);
    
    setTimeout(() => {
      const el = document.getElementById(`item-name-${nextIdx}`);
      if (el) {
        el.focus();
      }
    }, 100);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length === 1) return; // Need at least one item
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setItems(updated);
  };

  // Math totals calculation
  const subtotal = items.reduce((sum, item) => sum + getItemPreTaxTotal(item), 0);
  
  // Tax totals calculates tax for each item based on price after sharing discount proportionally (or simple tax calculations)
  // Standard billing performs calculation: Sum of (item qty * item price) * (item tax / 100)
  const taxDetails = items.map(item => {
    const itemSubtotal = getItemPreTaxTotal(item);
    const applicableTax = itemSubtotal * (item.taxPercent / 100);
    return {
      taxRate: item.taxPercent,
      taxAmount: applicableTax
    };
  });

  const taxTotal = taxDetails.reduce((sum, t) => sum + t.taxAmount, 0);
  const rawTotal = Math.max(0, subtotal - discount + taxTotal);
  const grandTotal = Math.round(rawTotal);
  const roundOff = grandTotal - rawTotal;

  // Group Tax by Percentage for premium GST display
  const taxSummary: { [rate: number]: number } = {};
  items.forEach(item => {
    const rate = item.taxPercent;
    const amount = getItemPreTaxTotal(item) * (rate / 100);
    taxSummary[rate] = (taxSummary[rate] || 0) + amount;
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON') {
        e.preventDefault();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName) {
      alert(t("Please enter a customer name.", "தயவுசெய்து வாடிக்கையாளர் பெயரை உள்ளிடவும்."));
      return;
    }

    const parsedItems: InvoiceItem[] = items.map(item => ({
      ...item,
      quantity: typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0,
      price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
      taxPercent: typeof item.taxPercent === 'number' ? item.taxPercent : parseFloat(item.taxPercent) || 0,
    }));

    if (parsedItems.some(item => !item.name || item.price <= 0 || item.quantity <= 0)) {
      alert(t("Please fill all item names, prices, and quantities above 0.", "தயவுசெய்து அனைத்து பொருட்களின் பெயர், விலை மற்றும் அளவுகளைச் சேர்க்கவும்."));
      return;
    }

    let generatedId = '';
    let invoiceNumber = 0;
    let createdAt = '';

    if (invoiceToEdit) {
      generatedId = invoiceToEdit.id;
      invoiceNumber = invoiceToEdit.invoiceNumber;
      createdAt = invoiceToEdit.createdAt;
    } else {
      // Auto-generate unique invoice code
      const timestamp = Date.now().toString().slice(-4);
      invoiceNumber = Math.floor(1000 + Math.random() * 9000);
      const dateCode = new Date().toISOString().split('T')[0].replace(/-/g, '').slice(2, 6); // YYMM
      generatedId = `INV-${dateCode}-${timestamp}`;
      createdAt = new Date().toISOString();
    }

    const newInvoice: Invoice = {
      id: generatedId,
      invoiceNumber: invoiceNumber,
      createdAt: createdAt,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      items: parsedItems,
      subtotal,
      discount,
      taxTotal: Number(taxTotal.toFixed(2)),
      grandTotal: grandTotal,
      roundOff: Number(roundOff.toFixed(2)),
      status,
      paymentMethod,
      notes,
      synced: false
    };

    onSaveInvoice(newInvoice);
    
    // Redirect to invoice viewer/printer instantly with beautiful flow
    setSelectedInvoiceId(generatedId);
    setCurrentTab('invoices');
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
      {/* Form Header */}
      <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <Calculator size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">
              {invoiceToEdit 
                ? `${t("Edit Invoice / Bill", "பில்லைத் திருத்துக / மாற்றுக")} (${invoiceToEdit.id})`
                : t("Generate Invoice / Bill", "புதிய பில் / இன்வாய்ஸ் கோப்பு")}
            </h2>
            <p className="text-xs text-slate-500">
              {invoiceToEdit 
                ? t("Modify existing products, prices, and client details below", "பொருட்களின் விலை, அளவு மற்றும் வாடிக்கையாளர் விவரங்களைத் திருத்தவும்")
                : t("Input products, tax rates, and client info to prepare bills", "பொருட்களின் விலை, வரி மற்றும் வாடிக்கையாளர் விவரங்களை உள்ளிட்டு புதிய பில் தயார் செய்க")}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="p-5 md:p-6 space-y-6">
        {/* Customer Section */}
        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-12 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus size={14} className="text-slate-400" />
              {t("1. Client's Details", "1. வாடிக்கையாளர் விவரங்கள்")}
            </h3>
            
            {/* Quick customer selection drops */}
            {customers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{t("Or Saved Customer:", "மின்னஞ்சல் / முன்பதிவு:")}</span>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="bg-white border border-slate-200 text-xs px-2.5 py-1 rounded-lg outline-none max-w-[200px]"
                >
                  <option value="">-- {t("Select Saved Contact", "தேர்ந்தெடுங்கள்")} --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Customer Input Fields */}
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {t("Customer Name*", "வாடிக்கையாளர் பெயர்*")}
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t("e.g. Subash NS", "உம். சுபாஷ் என் எஸ்")}
              className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm outline-none transition"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {t("Contact Phone", "தொலைபேசி எண்")}
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. 9845612347"
              className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm outline-none transition"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {t("Email ID", "மின்னஞ்சல் முகவரி")}
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="e.g. subashnsab@gmail.com"
              className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm outline-none transition"
            />
          </div>

          <div className="md:col-span-12">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {t("Billing Address", "வாடிக்கையாளர் முகவரி")}
            </label>
            <textarea
              rows={2}
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder={t("e.g. Apt 4B, Ruby Vista, Chennai", "உம். கதவு எண்: 14, மடா தெரு, மயிலாப்பூர், சென்னை")}
              className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm outline-none transition"
            />
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag size={14} className="text-slate-400" />
              {t("2. Products / Items purchased", "2. பொருள்களின் விவரங்கள் (பில் வரிசை)")}
            </h3>
            
            <button
               type="button"
               id="add-item-btn"
               onClick={handleAddItem}
               className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition active:scale-95"
            >
              <Plus size={14} />
              {t("Add Item Row", "பொருட்கள் வரிசையைச் சேர்")}
            </button>
          </div>

          {successStatus && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 animate-pulse">
              <Check size={14} className="text-emerald-600" />
              <span>{successStatus}</span>
            </div>
          )}

          {/* Desktop Items Table Headers */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-100">
                    <th className="p-3 pl-4 w-[280px]">{t("Product / Service Name", "பொருள் பெயர் / பட்டியல்")}</th>
                    <th className="p-3 w-[100px] text-right">{t("Quantity", "அளவு")}</th>
                    <th className="p-3 w-[140px] text-right">{t("Unit Price", "யூனிட் விலை")}</th>
                    <th className="p-3 text-right">{t("Total Amount", "மொத்த தொகை")}</th>
                    <th className="p-3 text-center w-[50px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition">
                      {/* Product Selector / Typable */}
                      <td className="p-3 pl-4 space-y-1 relative">
                        <input
                          type="text"
                          required
                          id={"item-name-" + idx}
                          value={item.name}
                          onChange={(e) => {
                            handleItemChange(idx, 'name', e.target.value);
                            setActiveSearchIdx(idx);
                          }}
                          onFocus={() => setActiveSearchIdx(idx)}
                          placeholder={t("Enter item name", "பொருள் பெயரை உள்ளிடவும்")}
                          className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-sm outline-none transition"
                        />
                        
                        {/* Auto-suggest dropdown floating container */}
                        {activeSearchIdx === idx && (
                          <>
                            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setActiveSearchIdx(null)} />
                            <div className="absolute z-50 left-3 right-3 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-[220px] overflow-y-auto divide-y divide-slate-100">
                              <div className="bg-slate-50 px-3 py-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex justify-between items-center">
                                <span>{t("Select or Search Product", "பொருளைத் தேடுங்கள்")}</span>
                                <button type="button" tabIndex={-1} onClick={() => setActiveSearchIdx(null)} className="text-slate-500 hover:text-slate-700">✕</button>
                              </div>

                              {/* Filtered Matches */}
                              {products
                                .filter(p => !item.name || p.name.toLowerCase().includes(item.name.toLowerCase()))
                                .map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => {
                                      const updated = [...items];
                                      updated[idx] = {
                                        ...updated[idx],
                                        name: p.name,
                                        price: p.price,
                                        taxPercent: p.taxPercent
                                      };
                                      setItems(updated);
                                      setActiveSearchIdx(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between text-slate-700 transition"
                                  >
                                    <div className="truncate pr-2">
                                      <p className="font-semibold text-slate-950 truncate">{p.name}</p>
                                      {p.description && <p className="text-[10px] text-slate-400 truncate">{p.description}</p>}
                                    </div>
                                    <span className="shrink-0 font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                      {settings.currency}{p.price}
                                    </span>
                                  </button>
                                ))
                              }

                              {/* Create option if typed name is not completely matched and not empty */}
                              {item.name && !products.some(p => p.name.toLowerCase() === item.name.trim().toLowerCase()) && (
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  onClick={() => {
                                    const trimmedName = item.name.trim();
                                    const tempProd: Product = {
                                      id: 'prod_' + Date.now(),
                                      name: trimmedName,
                                      price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
                                      taxPercent: 0,
                                      description: item.description || ''
                                    };
                                    if (onAddProduct) {
                                      onAddProduct(tempProd);
                                      setSuccessStatus(t(`Added "${trimmedName}" to Inventory Catalog!`, `"${trimmedName}" சரக்கு பட்டியலில் சேர்க்கப்பட்டது!`));
                                      setTimeout(() => setSuccessStatus(''), 4000);
                                    }
                                    const updated = [...items];
                                    updated[idx] = {
                                      ...updated[idx],
                                      name: trimmedName
                                    };
                                    setItems(updated);
                                    setActiveSearchIdx(null);
                                  }}
                                  className="w-full text-left px-3 py-2.5 text-xs text-indigo-600 hover:bg-indigo-50/50 bg-indigo-50/25 font-bold flex items-center gap-1.5 transition"
                                >
                                  <Plus size={14} className="text-indigo-600 stroke-[3]" />
                                  <span className="truncate">
                                    {t(`Create "${item.name}" & Save to Catalog`, `"${item.name}" ஐப் சரக்கு பட்டியலில் சேர்க்கவும்`)}
                                  </span>
                                </button>
                              )}

                              {products.filter(p => !item.name || p.name.toLowerCase().includes(item.name.toLowerCase())).length === 0 && !item.name && (
                                <div className="px-3 py-4 text-center text-xs text-slate-400">
                                  {t("No products found in catalog", "சரக்கு பட்டியலில் எந்த பொருட்களும் இல்லை")}
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        <input
                          type="text"
                          tabIndex={-1}
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          placeholder={t("Short description (optional)", "விளக்கக் குறிப்புகள் (விருப்பப்படி)")}
                          className="w-full bg-transparent text-xs text-slate-500 outline-none border-b border-transparent hover:border-slate-100 focus:border-slate-200 py-0.5"
                        />
                      </td>

                      {/* Quantity */}
                      <td className="p-3">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              required
                              id={"item-qty-" + idx}
                              min="0.001"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              className="w-[75px] bg-white border border-slate-200 focus:border-emerald-500 rounded-lg px-2 py-1.5 text-sm text-right outline-none transition animate-fade"
                            />
                            <select
                              value={item.unit || 'pcs'}
                              tabIndex={-1}
                              onChange={(e) => handleItemChange(idx, 'unit', e.target.value as any)}
                              className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg px-2 py-1.5 text-xs outline-none cursor-pointer text-slate-700 font-medium hover:bg-slate-100 transition"
                            >
                              <option value="pcs">{t("Pcs", "பீஸ்")}</option>
                              <option value="kg">{t("Kg", "கிலோ")}</option>
                              <option value="g">{t("Gram", "கிராம்")}</option>
                            </select>
                          </div>
                          {item.unit === 'g' && (
                            <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wide mr-1 leading-none">
                              {t("Gram: Price per Kg", "கிராம்: கிலோவின் விலை")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="p-3">
                        <div className="flex justify-end relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{settings.currency}</span>
                          <input
                            type="number"
                            required
                            id={"item-price-" + idx}
                            min="0"
                            step="any"
                            value={item.price}
                            onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg pl-6 pr-2.5 py-1.5 text-sm text-right outline-none transition"
                          />
                        </div>
                        {item.unit === 'g' && (
                          <div className="text-right text-[9px] text-slate-400 mt-0.5 mr-1 font-medium">
                            {t("Rate per Kg", "1 கிலோவின் விலை")}
                          </div>
                        )}
                      </td>

                      {/* Row total (pre tax) */}
                      <td className="p-3 text-right font-medium text-slate-700 font-mono">
                        {settings.currency}{getItemPreTaxTotal(item).toFixed(2)}
                      </td>

                      {/* Delete Action */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          tabIndex={-1}
                          id={"item-delete-" + idx}
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length === 1}
                          className={`p-1.5 rounded-lg transition ${
                            items.length === 1
                              ? 'text-slate-200 cursor-not-allowed'
                              : 'text-slate-400 hover:bg-rose-50 hover:text-rose-500 cursor-pointer'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {activeSearchIdx !== null && (
                    <tr style={{ height: '200px' }} className="transition-all duration-300">
                      <td colSpan={5} className="p-0 border-none bg-transparent" />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Add Item Button */}
          <div className="flex justify-end pt-1">
            <button
               type="button"
               id="add-item-btn-bottom"
               onClick={handleAddItem}
               className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border border-emerald-200 transition hover:scale-[1.01] active:scale-95 duration-150"
            >
              <Plus size={16} className="stroke-[3]" />
              {t("Add Item Row", "பொருட்கள் வரிசையைச் சேர்")}
            </button>
          </div>
        </div>

        {/* Invoice Footer Grid : Settings Left, Math calculations Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Note & Settings (Col Span 7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {t("Payment Method", "கட்டண முறை")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'Cash', 'Card', 'Bank Transfer', 'Other'] as const).slice(0,3).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                        paymentMethod === method
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t(method === 'Bank Transfer' ? 'Bank' : method, method === 'Cash' ? 'ரொக்கம்' : method === 'Card' ? 'அட்டை' : method === 'UPI' ? 'UPI' : 'மற்றவை')}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(['UPI', 'Cash', 'Card', 'Bank Transfer', 'Other'] as const).slice(3).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                        paymentMethod === method
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t(method === 'Bank Transfer' ? 'Bank Transfer' : method, method === 'Bank Transfer' ? 'வங்கி பரிமாற்றம்' : 'மற்றவை')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {t("Invoice Status", "விலைப்பட்டியல் நிலை")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Paid', 'Pending', 'Unpaid'] as const).map(itemStatus => (
                    <button
                      key={itemStatus}
                      type="button"
                      onClick={() => setStatus(itemStatus)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                        status === itemStatus
                          ? itemStatus === 'Paid'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                            : itemStatus === 'Pending'
                            ? 'bg-amber-50 border-amber-500 text-amber-800'
                            : 'bg-rose-50 border-rose-500 text-rose-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t(itemStatus, itemStatus === 'Paid' ? 'செலுத்தியது' : itemStatus === 'Pending' ? 'நிலுவையில்' : 'செலுத்தவில்லை')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {t("Invoice Terms / Notes", "பில் நிபந்தனைகள் / குறிப்புகள்")}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("Notes, greetings, return policies...", "உங்கள் கடைக் கொள்கை, வாழ்த்துக்கள், குறிப்புகள்...")}
                className="w-full bg-slate-50/50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs outline-none transition text-slate-600"
              />
            </div>
          </div>

          {/* Math Calculations Display (Col Span 5) */}
          <div className="lg:col-span-5 bg-slate-50/70 rounded-2xl border border-slate-100 p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t("3. Order Settlement Summary", "3. பில் கணக்கீடு விவரம்")}
            </h4>

            <div className="space-y-2 text-sm text-slate-600">
              {/* Subtotal */}
              <div className="flex justify-between">
                <span>{t("Subtotal", "துணைத்தொகை")}:</span>
                <span className="font-semibold text-slate-900">{settings.currency}{subtotal.toFixed(2)}</span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span>{t("Discounts / Deductions", "தள்ளுபடி தொகை")}:</span>
                <div className="flex items-center relative max-w-[120px]">
                  <span className="absolute left-2 text-xs text-rose-500 font-semibold">- {settings.currency}</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-6 pr-2 py-1 text-xs text-right outline-none transition focus:border-rose-300 font-semibold text-rose-600"
                  />
                </div>
              </div>

              {/* Taxes Detailed Breakdown */}
              {taxTotal > 0 && Object.keys(taxSummary).length > 0 && (
                <div className="space-y-1 bg-white/50 border border-dashed border-slate-150 p-2.5 rounded-xl text-xs">
                  <span className="font-semibold text-slate-500 block mb-1">{t("GST Tax Details", "ஜி.எஸ்.டி / வரி பிரிப்பு")}:</span>
                  {Object.entries(taxSummary).map(([rate, amt]) => {
                    const parsedAmt = Number(amt);
                    if (parsedAmt <= 0) return null;
                    return (
                      <div key={rate} className="flex justify-between text-slate-500 font-mono">
                        {/* For Indian GST context, we usually slice GST into 50% CGST + 50% SGST */}
                        <span>GST @ {rate}% (CGST {Number(rate)/2}% + SGST {Number(rate)/2}%):</span>
                        <span>{settings.currency}{parsedAmt.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total Tax */}
              {taxTotal > 0 && (
                <div className="flex justify-between text-xs pt-1.5 border-t border-slate-100">
                  <span>{t("Total GST / Tax Amount", "மொத்த வரித் தொகை")}:</span>
                  <span className="font-semibold text-slate-800">{settings.currency}{taxTotal.toFixed(2)}</span>
                </div>
              )}

              {/* Round Off */}
              {roundOff !== 0 && (
                <div className="flex justify-between text-xs pt-1.5 border-t border-slate-100">
                  <span>{t("Round Off", "ரவுண்ட் ஆஃப் (திருத்தம்)")}:</span>
                  <span className={`font-mono font-semibold ${roundOff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {roundOff > 0 ? '+' : ''}{settings.currency}{roundOff.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-center bg-slate-900 text-white rounded-xl p-3.5 mt-2.5">
                <span className="font-bold text-sm tracking-wide uppercase">{t("Grand Total", "மொத்த பில் தொகை")}:</span>
                <span className="text-xl font-extrabold text-emerald-400 font-mono">
                  {settings.currency}{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Print/Preview notice */}
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-2 bg-white p-2.5 rounded-lg border border-slate-100/60">
              <AlertCircle size={12} className="text-emerald-500 shrink-0" />
              <p>
                {invoiceToEdit ? t(
                  "Upon saving, this invoice is updated in your local bills inventory and you will be redirected to view, print or sync it straight to your cloud spreadsheet.",
                  "பில்லைத் திருத்தியவுடன், மாற்றங்கள் உங்கள் உள்ளூர் சேமிப்பகத்தில் புதுப்பிக்கப்பட்டு, நீங்கள் பார்க்க, அச்சிட அல்லது கூகிள் சீட்டில் ஒத்திசைக்க தயாராகிவிடும்."
                ) : t(
                  "Upon saving, this invoice is added to your local bills inventory and you will be redirected to view, print or sync it straight to your cloud spreadsheet.",
                  "பில்லைச் சேமித்தவுடன், அது உங்கள் உள்ளூர் சேமிப்பகத்தில் சேமிக்கப்பட்டு, நீங்கள் பார்க்க, அச்சிட அல்லது கூகிள் சீட்டில் ஒத்திசைக்க தயாராகிவிடும்."
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-150">
          <button
            type="button"
            onClick={() => setCurrentTab('invoices')}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold active:scale-95 transition cursor-pointer"
          >
            {t("Cancel", "இரத்து செய்")}
          </button>
          
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-sm active:scale-95 transition shadow-md shadow-emerald-500/10 cursor-pointer flex items-center gap-2"
          >
            <Save size={16} />
            {invoiceToEdit ? t("Save & Update Bill", "மாற்றங்களைச் சேமி") : t("Save & Complete Bill", "பில்லைச் சேமி")}
          </button>
        </div>
      </form>
    </div>
  );
};

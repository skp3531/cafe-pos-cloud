const fs = require('fs');

const code = `
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db/db';
import { Printer, Search, Plus, Save, RotateCcw, ChevronDown, ChevronRight, Check } from 'lucide-react';
import clsx from 'clsx';

const DEFAULT_SETTINGS = {
  // A. Printer
  printerModule: 'browser', paperWidth: '300px', fontSize: '13px', invoiceFormat: 'standard', autoPrint: false, printDuplicate: false, compactMode: false,
  // B. Header
  storeHeader: true, storeLogo: false, businessName: true, headerAddress: false, headerPhone: false, headerEmail: false, headerGstin: false, headerFssai: false, branchName: false,
  // C. Customer
  customerName: true, customerMobile: false, customerAddress: false, customerGstin: false,
  // D. Staff & Order
  cashierName: true, billingStaff: false, orderType: true, tableNumber: false, tokenNumber: false,
  // E. Item
  itemSku: false, itemHsn: false, itemUnit: false, itemQuantity: true, itemRate: true, itemDiscount: false, itemTaxPct: false, itemTaxAmt: false, itemNotes: false,
  // F. Bill Summary
  summarySubtotal: true, summaryDiscount: true, summaryGst: true, summaryRoundOff: false, summaryTotal: true, summarySavings: false,
  // G. Payment
  paymentMethod: true, paymentCashRecv: false, paymentChange: false, paymentTxnId: false, splitPayments: false,
  // H. QR
  qrUpi: true, qrFeedback: false, qrVerify: false, qrLoyalty: false,
  // I. Footer
  customFooterText: 'Thank you! Visit again.', footerMessage: true, footerTerms: false, footerReturn: false, footerRefund: false,
  // J. Advanced
  advWhatsapp: false, advSms: false, advEmail: false, advCustGst: false, advTaxMode: false, advEstimate: false, advDelivery: false, advGift: false, advReprintTrack: true, advPrintCount: false, advVoidWatermark: false, advDupWatermark: false, advAudit: false,
};

const SECTIONS = [
  { id: 'printer', label: 'A. Printer Settings', fields: [
      { id: 'printerModule', label: 'Printer Connection', type: 'select', options: [{v:'browser',l:'Standard Browser Print'}, {v:'thermal_escpos',l:'ESC/POS Network'}, {v:'thermal_usb',l:'WebUSB Direct'}, {v:'thermal_bt',l:'Bluetooth Thermal'}] },
      { id: 'paperWidth', label: 'Paper Width', type: 'select', options: [{v:'200px',l:'2 inch (58mm)'}, {v:'300px',l:'3 inch (80mm)'}, {v:'100%',l:'A4 / Full Width'}] },
      { id: 'fontSize', label: 'Font Size', type: 'select', options: [{v:'11px',l:'Small'}, {v:'13px',l:'Medium'}, {v:'16px',l:'Large'}] },
      { id: 'invoiceFormat', label: 'Invoice Format', type: 'select', options: [{v:'standard',l:'Standard'}, {v:'short',l:'Short'}, {v:'minimal',l:'Minimal'}] },
      { id: 'autoPrint', label: 'Auto Print After Billing', type: 'toggle' },
      { id: 'printDuplicate', label: 'Print Duplicate Copy', type: 'toggle' },
      { id: 'compactMode', label: 'Compact Mode', type: 'toggle' }
  ]},
  { id: 'header', label: 'B. Header Settings', fields: [
      { id: 'storeHeader', label: 'Store Header', type: 'toggle' }, { id: 'storeLogo', label: 'Store Logo', type: 'toggle' }, { id: 'businessName', label: 'Business Name', type: 'toggle' }, { id: 'headerAddress', label: 'Address', type: 'toggle' }, { id: 'headerPhone', label: 'Phone Number', type: 'toggle' }, { id: 'headerEmail', label: 'Email', type: 'toggle' }, { id: 'headerGstin', label: 'GSTIN', type: 'toggle' }, { id: 'headerFssai', label: 'FSSAI Number', type: 'toggle' }, { id: 'branchName', label: 'Branch Name', type: 'toggle' }
  ]},
  { id: 'customer', label: 'C. Customer Information', fields: [
      { id: 'customerName', label: 'Customer Name', type: 'toggle' }, { id: 'customerMobile', label: 'Customer Mobile', type: 'toggle' }, { id: 'customerAddress', label: 'Customer Address', type: 'toggle' }, { id: 'customerGstin', label: 'Customer GSTIN', type: 'toggle' }
  ]},
  { id: 'staff', label: 'D. Staff & Order Info', fields: [
      { id: 'cashierName', label: 'Cashier Name', type: 'toggle' }, { id: 'billingStaff', label: 'Billing Staff Name', type: 'toggle' }, { id: 'orderType', label: 'Order Type', type: 'toggle' }, { id: 'tableNumber', label: 'Table Number', type: 'toggle' }, { id: 'tokenNumber', label: 'Token Number', type: 'toggle' }
  ]},
  { id: 'item', label: 'E. Item Information', fields: [
      { id: 'itemSku', label: 'SKU', type: 'toggle' }, { id: 'itemHsn', label: 'HSN Code', type: 'toggle' }, { id: 'itemUnit', label: 'Unit', type: 'toggle' }, { id: 'itemQuantity', label: 'Quantity', type: 'toggle' }, { id: 'itemRate', label: 'Rate', type: 'toggle' }, { id: 'itemDiscount', label: 'Item Discount', type: 'toggle' }, { id: 'itemTaxPct', label: 'Tax Percentage', type: 'toggle' }, { id: 'itemTaxAmt', label: 'Tax Amount', type: 'toggle' }, { id: 'itemNotes', label: 'Item Notes', type: 'toggle' }
  ]},
  { id: 'summary', label: 'F. Bill Summary', fields: [
      { id: 'summarySubtotal', label: 'Subtotal', type: 'toggle' }, { id: 'summaryDiscount', label: 'Discount', type: 'toggle' }, { id: 'summaryGst', label: 'GST Summary', type: 'toggle' }, { id: 'summaryRoundOff', label: 'Round Off', type: 'toggle' }, { id: 'summaryTotal', label: 'Grand Total', type: 'toggle' }, { id: 'summarySavings', label: 'Savings Amount', type: 'toggle' }
  ]},
  { id: 'payment', label: 'G. Payment Information', fields: [
      { id: 'paymentMethod', label: 'Payment Method', type: 'toggle' }, { id: 'paymentCashRecv', label: 'Cash Received', type: 'toggle' }, { id: 'paymentChange', label: 'Change Returned', type: 'toggle' }, { id: 'paymentTxnId', label: 'Transaction ID', type: 'toggle' }, { id: 'splitPayments', label: 'Split Payments', type: 'toggle' }
  ]},
  { id: 'qr', label: 'H. QR & Digital Features', fields: [
      { id: 'qrUpi', label: 'UPI Payment QR', type: 'toggle' }, { id: 'qrFeedback', label: 'Feedback QR', type: 'toggle' }, { id: 'qrVerify', label: 'Invoice Verification QR', type: 'toggle' }, { id: 'qrLoyalty', label: 'Loyalty QR', type: 'toggle' }
  ]},
  { id: 'footer', label: 'I. Footer Settings', fields: [
      { id: 'customFooterText', label: 'Custom Footer Message', type: 'text' }, { id: 'footerMessage', label: 'Footer Message', type: 'toggle' }, { id: 'footerTerms', label: 'Terms & Conditions', type: 'toggle' }, { id: 'footerReturn', label: 'Return Policy', type: 'toggle' }, { id: 'footerRefund', label: 'Refund Policy', type: 'toggle' }
  ]},
  { id: 'advanced', label: 'J. Advanced Features', fields: [
      { id: 'advWhatsapp', label: 'WhatsApp Invoice', type: 'toggle' }, { id: 'advSms', label: 'SMS Invoice', type: 'toggle' }, { id: 'advEmail', label: 'Email Invoice', type: 'toggle' }, { id: 'advCustGst', label: 'Customer GST Invoice', type: 'toggle' }, { id: 'advTaxMode', label: 'Tax Invoice Mode', type: 'toggle' }, { id: 'advEstimate', label: 'Estimate Mode', type: 'toggle' }, { id: 'advDelivery', label: 'Delivery Slip Mode', type: 'toggle' }, { id: 'advGift', label: 'Gift Receipt Mode', type: 'toggle' }, { id: 'advReprintTrack', label: 'Reprint Tracking', type: 'toggle' }, { id: 'advPrintCount', label: 'Print Count Tracking', type: 'toggle' }, { id: 'advVoidWatermark', label: 'Voided Invoice Watermark', type: 'toggle' }, { id: 'advDupWatermark', label: 'Duplicate Invoice Watermark', type: 'toggle' }, { id: 'advAudit', label: 'Audit Trail', type: 'toggle' }
  ]}
];

const ToggleSwitch = ({ checked, onChange }) => (
  <button type="button" onClick={() => onChange(!checked)} className={clsx("w-10 h-6 rounded-full p-1 transition-colors relative flex items-center shadow-inner", checked ? 'bg-brand-primary' : 'bg-ui-border')}>
    <div className={clsx("w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200", checked ? 'translate-x-4' : 'translate-x-0')} />
  </button>
);

export default function PrintLayoutSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [search, setSearch] = useState('');
  const [openSections, setOpenSections] = useState({ printer: true, header: true });
  
  useEffect(() => {
    const load = async () => {
      const dbSettings = await db.settings.get('printAdvanced');
      if (dbSettings) {
        setSettings(prev => ({ ...prev, ...dbSettings.data }));
      } else {
        // Migration from old print settings
        const oldPrint = await db.settings.get('print');
        if (oldPrint) {
           setSettings(prev => ({ 
             ...prev, 
             fontSize: oldPrint.fontSize || prev.fontSize,
             paperWidth: oldPrint.paperWidth || prev.paperWidth,
             storeHeader: oldPrint.showHeader ?? prev.storeHeader,
             footerMessage: oldPrint.showFooter ?? prev.footerMessage,
             customerName: oldPrint.showCustomer ?? prev.customerName,
             cashierName: oldPrint.showCashier ?? prev.cashierName,
             printerModule: oldPrint.printerModule || prev.printerModule,
             customFooterText: oldPrint.customFooter || prev.customFooterText,
             invoiceFormat: oldPrint.invoiceFormat || prev.invoiceFormat
           }));
        }
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    await db.settings.put({ id: 'printAdvanced', data: settings });
    alert('Invoice layout settings saved securely.');
  };

  const handleReset = () => {
    if (window.confirm("Reset to default layout?")) {
      setSettings(DEFAULT_SETTINGS);
    }
  };

  const toggleSection = (id) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  const filteredSections = useMemo(() => {
    if (!search) return SECTIONS;
    const q = search.toLowerCase();
    return SECTIONS.map(s => {
      const matches = s.fields.filter(f => f.label.toLowerCase().includes(q));
      return { ...s, fields: matches };
    }).filter(s => s.fields.length > 0);
  }, [search]);

  return (
    <div className="bg-ui-card rounded-3xl border border-ui-border shadow-sm flex flex-col xl:flex-row overflow-hidden min-h-[800px]">
      
      {/* LEFT: Configuration */}
      <div className="flex-1 flex flex-col border-b xl:border-b-0 xl:border-r border-ui-border">
        <div className="p-6 border-b border-ui-border bg-ui-bg flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-ui-text">Invoice Configuration</h2>
            <p className="text-xs font-medium text-ui-muted mt-1">Enterprise Print Settings</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="p-2.5 rounded-xl bg-ui-card border border-ui-border text-ui-muted hover:text-ui-text shadow-sm transition-all"><RotateCcw size={18}/></button>
            <button onClick={handleSave} className="px-4 py-2.5 rounded-xl bg-brand-primary text-white font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"><Save size={18}/> Save</button>
          </div>
        </div>

        <div className="p-4 bg-ui-card border-b border-ui-border">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ui-muted" />
            <input type="text" placeholder="Search settings..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 p-3 rounded-xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-medium text-ui-text text-sm" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
          {filteredSections.map(sec => (
            <div key={sec.id} className="bg-ui-bg border border-ui-border rounded-2xl overflow-hidden">
              <button onClick={() => toggleSection(sec.id)} className="w-full flex items-center justify-between p-4 bg-ui-card hover:bg-ui-border/30 transition-colors">
                <span className="font-bold text-ui-text text-sm">{sec.label}</span>
                {openSections[sec.id] || search ? <ChevronDown size={18} className="text-ui-muted"/> : <ChevronRight size={18} className="text-ui-muted"/>}
              </button>
              {(openSections[sec.id] || search) && (
                <div className="p-4 space-y-4 border-t border-ui-border">
                  {sec.fields.map(f => (
                    <div key={f.id} className={clsx("flex justify-between items-center", f.type==='text' || f.type==='select' ? 'flex-col items-start gap-2' : '')}>
                      <span className="text-sm font-medium text-ui-text">{f.label}</span>
                      {f.type === 'toggle' && <ToggleSwitch checked={settings[f.id]} onChange={v => setSettings({...settings, [f.id]: v})} />}
                      {f.type === 'select' && (
                        <select value={settings[f.id]} onChange={e=>setSettings({...settings, [f.id]: e.target.value})} className="w-full p-2.5 rounded-lg bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-sm font-bold text-ui-text">
                          {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      )}
                      {f.type === 'text' && (
                        <input type="text" value={settings[f.id]} onChange={e=>setSettings({...settings, [f.id]: e.target.value})} className="w-full p-2.5 rounded-lg bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-sm font-bold text-ui-text" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="pt-4">
             <button className="w-full border-2 border-dashed border-brand-primary/30 text-brand-primary p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-primary/5 transition-colors"><Plus size={18}/> Create Template</button>
          </div>
        </div>
      </div>

      {/* RIGHT: Live Preview */}
      <div className="w-full xl:w-[450px] bg-ui-bg p-6 flex flex-col">
        <h3 className="font-bold text-ui-text mb-4 text-center">Live Receipt Preview</h3>
        <div className="flex-1 overflow-y-auto flex justify-center hide-scrollbar">
          <div className="bg-white shadow-lg p-6 w-full max-w-[350px] min-h-[500px] border-t-8 border-ui-border relative" style={{ fontFamily: 'monospace', fontSize: settings.fontSize }}>
            
            {settings.storeHeader && (
               <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3 text-black">
                 {settings.storeLogo && <div className="mx-auto w-12 h-12 bg-gray-200 border border-gray-400 flex items-center justify-center font-black text-xs mb-2">LOGO</div>}
                 {settings.businessName && <div className="font-bold text-lg leading-tight uppercase">The Vitamin Bar</div>}
                 {settings.headerAddress && <div className="text-[0.8em] mt-1">123 Cafe Street, Food City</div>}
                 {settings.headerPhone && <div className="text-[0.8em]">Ph: +91 9876543210</div>}
                 {settings.headerEmail && <div className="text-[0.8em]">hello@vitaminbar.com</div>}
                 {settings.headerGstin && <div className="text-[0.8em] mt-1">GSTIN: 29ABCDE1234F1Z5</div>}
                 {settings.headerFssai && <div className="text-[0.8em]">FSSAI: 12345678901234</div>}
                 {settings.branchName && <div className="text-[0.8em] font-bold mt-1">Branch: Downtown</div>}
               </div>
            )}
            
            {settings.advTaxMode && <div className="text-center font-bold mb-2 text-black underline">TAX INVOICE</div>}
            {settings.advEstimate && <div className="text-center font-bold mb-2 text-black underline">ESTIMATE ONLY</div>}
            
            <div className="text-[0.8em] mb-3 text-black">
              <div className="flex justify-between">
                <span>Date: 23/09/2026</span>
                <span>Time: 21:50</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Inv: {settings.invoiceFormat==='standard' ? 'T1-20260923-0001' : settings.invoiceFormat==='short' ? 'T1-0001' : '0001'}</span>
                {settings.orderType && <span>Dine-In</span>}
              </div>
              
              {(settings.customerName || settings.customerMobile || settings.customerAddress || settings.customerGstin) && (
                <div className="mt-2 pt-2 border-t border-dashed border-gray-300">
                  {settings.customerName && <div>To: John Doe</div>}
                  {settings.customerMobile && <div>Ph: +91 9998887776</div>}
                  {settings.customerAddress && <div>Add: 45 Tech Park Road</div>}
                  {settings.customerGstin && <div>GSTIN: 29XYZDE1234F1Z5</div>}
                </div>
              )}
              
              {(settings.cashierName || settings.billingStaff || settings.tableNumber || settings.tokenNumber) && (
                <div className="mt-2 pt-2 border-t border-dashed border-gray-300 grid grid-cols-2 gap-x-2">
                  {settings.cashierName && <div>Cashier: Owner</div>}
                  {settings.billingStaff && <div>Billed By: Shambu</div>}
                  {settings.tableNumber && <div>Table: T-04</div>}
                  {settings.tokenNumber && <div>Token: #45</div>}
                </div>
              )}
            </div>

            <div className="border-t border-b border-dashed border-gray-400 py-2 mb-2 text-black">
              <div className="flex justify-between font-bold text-[0.8em] mb-1">
                <span className="flex-1">Item</span>
                {settings.itemQuantity && <span className="w-8 text-center">Qty</span>}
                {settings.itemRate && <span className="w-12 text-right">Rate</span>}
                <span className="w-14 text-right">Amt</span>
              </div>
              
              <div className="flex justify-between text-[0.8em] mb-1">
                <div className="flex-1">
                  <div>Classic Burger</div>
                  {settings.itemSku && <div className="text-[0.7em] text-gray-600">SKU: BURG-01</div>}
                  {settings.itemHsn && <div className="text-[0.7em] text-gray-600">HSN: 2106</div>}
                  {settings.itemNotes && <div className="text-[0.7em] italic text-gray-600">No onions</div>}
                </div>
                {settings.itemQuantity && <span className="w-8 text-center">2{settings.itemUnit ? 'pc' : ''}</span>}
                {settings.itemRate && <span className="w-12 text-right">99.00</span>}
                <span className="w-14 text-right">198.00</span>
              </div>
              
              {settings.itemDiscount && <div className="text-[0.75em] text-right text-gray-600">- Disc: 10.00</div>}
              {settings.itemTaxPct && <div className="text-[0.75em] text-right text-gray-600">+ 5% GST</div>}
              {settings.itemTaxAmt && <div className="text-[0.75em] text-right text-gray-600">+ Tax: 9.90</div>}
            </div>

            <div className="flex flex-col gap-1 text-[0.85em] text-black border-b border-dashed border-gray-400 pb-2 mb-2">
              {settings.summarySubtotal && <div className="flex justify-between"><span>Subtotal:</span><span>198.00</span></div>}
              {settings.summaryDiscount && <div className="flex justify-between"><span>Discount:</span><span>0.00</span></div>}
              {settings.summaryGst && <div className="flex justify-between"><span>CGST 2.5%:</span><span>4.95</span></div>}
              {settings.summaryGst && <div className="flex justify-between"><span>SGST 2.5%:</span><span>4.95</span></div>}
              {settings.summaryRoundOff && <div className="flex justify-between"><span>Round Off:</span><span>0.10</span></div>}
              {settings.summaryTotal && <div className="flex justify-between font-bold text-base mt-1"><span>TOTAL:</span><span>₹208.00</span></div>}
              {settings.summarySavings && <div className="flex justify-between text-[0.8em] italic mt-1"><span>You Saved:</span><span>₹15.00</span></div>}
            </div>
            
            <div className="text-[0.8em] text-black mb-3">
              {settings.paymentMethod && <div className="flex justify-between"><span>Paid via:</span><span>UPI</span></div>}
              {settings.paymentCashRecv && <div className="flex justify-between"><span>Cash Recv:</span><span>500.00</span></div>}
              {settings.paymentChange && <div className="flex justify-between"><span>Change:</span><span>292.00</span></div>}
              {settings.paymentTxnId && <div className="flex justify-between"><span>Txn ID:</span><span>UPI123456789</span></div>}
              {settings.splitPayments && <div className="flex justify-between mt-1 text-[0.9em]"><span>Split: Cash ₹100, UPI ₹108</span></div>}
            </div>

            <div className="flex flex-col items-center gap-3 text-black mb-4">
              {settings.qrUpi && (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-200 border border-black flex items-center justify-center font-bold text-[10px]">UPI QR</div>
                  <span className="text-[8px] mt-1">Scan to Pay</span>
                </div>
              )}
              {settings.qrFeedback && <div className="text-[0.7em] border border-black px-2 py-1">Scan QR for Feedback</div>}
              {settings.qrVerify && <div className="text-[0.7em] border border-black px-2 py-1">Scan to Verify Invoice</div>}
            </div>

            {settings.footerMessage && (
               <div className="text-center text-[0.8em] text-black border-t border-dashed border-gray-400 pt-3">
                 <div className="font-bold">{settings.customFooterText || 'Thank you!'}</div>
                 {settings.footerTerms && <div className="text-[0.7em] mt-1">T&C Apply. E&OE.</div>}
                 {settings.footerReturn && <div className="text-[0.7em]">No returns after 7 days.</div>}
                 {settings.footerRefund && <div className="text-[0.7em]">Refunds processed in 3-5 working days.</div>}
                 
                 {settings.advReprintTrack && <div className="text-[0.6em] mt-3">Reprint: No</div>}
                 {settings.advPrintCount && <div className="text-[0.6em]">Print Count: 1</div>}
               </div>
            )}
            
            {settings.advVoidWatermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="text-6xl font-black rotate-[-45deg] text-red-600 border-4 border-red-600 p-2 uppercase">VOID</div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
`
fs.writeFileSync('src/components/PrintLayoutSettings.jsx', code);

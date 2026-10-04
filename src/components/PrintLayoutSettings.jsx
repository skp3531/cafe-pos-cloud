import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '../db/db';
import {
  Printer, Search, Save, RotateCcw, ChevronDown, ChevronRight,
  Bluetooth, Wifi, Usb, Globe, CheckCircle2, XCircle, AlertCircle,
  Loader2, ScanLine, Plug, PlugZap, Zap, Info, Terminal, Clock, Image as ImageIcon
} from 'lucide-react';
import clsx from 'clsx';
import {
  bluetoothDriver, usbDriver, networkDriver, browserDriver
} from '../utils/printerDrivers.js';
import { buildReceiptHTML, sampleOrder } from '../utils/printUtils.js';
import { buildESCPOSBytes } from '../utils/printerDrivers.js';

// ─── Default Settings ────────────────────────────────────────
const DEFAULT_SETTINGS = {
  printerModule: 'browser',
  theme: 'standard', fontFamily: 'monospace', receiptPadding: '10px', lineSpacing: 'normal', storeLogoUrl: '',
  paperWidth: '300px', fontSize: '13px', invoiceFormat: 'standard',
  customInvoiceStart: 1, autoPrint: false, printDuplicate: false, compactMode: false,
  networkIp: '', networkPort: 9100, autoReconnect: false,
  storeHeader: true, storeLogo: false, businessName: true, headerAddress: false,
  headerPhone: false, headerEmail: false, headerGstin: false, headerFssai: false, branchName: false,
  customerName: true, customerMobile: false, customerAddress: false, customerGstin: false,
  cashierName: true, billingStaff: false, orderType: true, tableNumber: false, tokenNumber: false,
  itemSku: false, itemHsn: false, itemUnit: false, itemQuantity: true, itemRate: true,
  itemDiscount: false, itemTaxPct: false, itemTaxAmt: false, itemNotes: false,
  summarySubtotal: true, summaryDiscount: true, summaryGst: true, summaryRoundOff: false,
  summaryTotal: true, summarySavings: false,
  paymentMethod: true, paymentCashRecv: false, paymentChange: false, paymentTxnId: false, splitPayments: false,
  qrUpi: true, qrFeedback: false, qrVerify: false, qrLoyalty: false,
  customFooterText: 'Thank you! Visit again.', footerMessage: true,
  footerTerms: false, footerReturn: false, footerRefund: false,
  advTaxMode: false, advEstimate: false, advReprintTrack: true, advPrintCount: false,
  advVoidWatermark: false, advDupWatermark: false,
};

const RECEIPT_SECTIONS = [
  { id: 'header', label: 'B. Header Settings', fields: [
    { id: 'storeHeader', label: 'Store Header', type: 'toggle' },
    { id: 'storeLogo', label: 'Store Logo', type: 'toggle' },
    { id: 'businessName', label: 'Business Name', type: 'toggle' },
    { id: 'headerAddress', label: 'Address', type: 'toggle' },
    { id: 'headerPhone', label: 'Phone Number', type: 'toggle' },
    { id: 'headerEmail', label: 'Email', type: 'toggle' },
    { id: 'headerGstin', label: 'GSTIN', type: 'toggle' },
    { id: 'headerFssai', label: 'FSSAI Number', type: 'toggle' },
    { id: 'branchName', label: 'Branch Name', type: 'toggle' },
  ]},
  { id: 'customer', label: 'C. Customer Information', fields: [
    { id: 'customerName', label: 'Customer Name', type: 'toggle' },
    { id: 'customerMobile', label: 'Customer Mobile', type: 'toggle' },
    { id: 'customerAddress', label: 'Customer Address', type: 'toggle' },
    { id: 'customerGstin', label: 'Customer GSTIN', type: 'toggle' },
  ]},
  { id: 'staff', label: 'D. Staff & Order Info', fields: [
    { id: 'cashierName', label: 'Cashier Name', type: 'toggle' },
    { id: 'billingStaff', label: 'Billing Staff Name', type: 'toggle' },
    { id: 'orderType', label: 'Order Type', type: 'toggle' },
    { id: 'tableNumber', label: 'Table Number', type: 'toggle' },
    { id: 'tokenNumber', label: 'Token Number', type: 'toggle' },
  ]},
  { id: 'item', label: 'E. Item Information', fields: [
    { id: 'itemSku', label: 'SKU', type: 'toggle' },
    { id: 'itemHsn', label: 'HSN Code', type: 'toggle' },
    { id: 'itemUnit', label: 'Unit', type: 'toggle' },
    { id: 'itemQuantity', label: 'Quantity', type: 'toggle' },
    { id: 'itemRate', label: 'Rate', type: 'toggle' },
    { id: 'itemDiscount', label: 'Item Discount', type: 'toggle' },
    { id: 'itemTaxPct', label: 'Tax Percentage', type: 'toggle' },
    { id: 'itemTaxAmt', label: 'Tax Amount', type: 'toggle' },
    { id: 'itemNotes', label: 'Item Notes', type: 'toggle' },
  ]},
  { id: 'summary', label: 'F. Bill Summary', fields: [
    { id: 'summarySubtotal', label: 'Subtotal', type: 'toggle' },
    { id: 'summaryDiscount', label: 'Discount', type: 'toggle' },
    { id: 'summaryGst', label: 'GST Summary', type: 'toggle' },
    { id: 'summaryRoundOff', label: 'Round Off', type: 'toggle' },
    { id: 'summaryTotal', label: 'Grand Total', type: 'toggle' },
    { id: 'summarySavings', label: 'Savings Amount', type: 'toggle' },
  ]},
  { id: 'payment', label: 'G. Payment Information', fields: [
    { id: 'paymentMethod', label: 'Payment Method', type: 'toggle' },
    { id: 'paymentCashRecv', label: 'Cash Received', type: 'toggle' },
    { id: 'paymentChange', label: 'Change Returned', type: 'toggle' },
    { id: 'paymentTxnId', label: 'Transaction ID', type: 'toggle' },
    { id: 'splitPayments', label: 'Split Payments', type: 'toggle' },
  ]},
  { id: 'qr', label: 'H. QR & Digital Features', fields: [
    { id: 'qrUpi', label: 'UPI Payment QR', type: 'toggle' },
    { id: 'qrFeedback', label: 'Feedback QR', type: 'toggle' },
    { id: 'qrVerify', label: 'Invoice Verification QR', type: 'toggle' },
    { id: 'qrLoyalty', label: 'Loyalty QR', type: 'toggle' },
  ]},
  { id: 'footer', label: 'I. Footer Settings', fields: [
    { id: 'customFooterText', label: 'Custom Footer Message', type: 'text' },
    { id: 'footerMessage', label: 'Footer Message', type: 'toggle' },
    { id: 'footerTerms', label: 'Terms & Conditions', type: 'toggle' },
    { id: 'footerReturn', label: 'Return Policy', type: 'toggle' },
    { id: 'footerRefund', label: 'Refund Policy', type: 'toggle' },
  ]},
  { id: 'advanced', label: 'J. Advanced Features', fields: [
    { id: 'advTaxMode', label: 'Tax Invoice Mode', type: 'toggle' },
    { id: 'advEstimate', label: 'Estimate Mode', type: 'toggle' },
    { id: 'advReprintTrack', label: 'Track Reprints', type: 'toggle' },
    { id: 'advPrintCount', label: 'Show Print Count', type: 'toggle' },
    { id: 'advVoidWatermark', label: 'VOID Watermark on Canceled', type: 'toggle' },
    { id: 'advDupWatermark', label: 'DUPLICATE Watermark', type: 'toggle' },
  ]},
];

// ─── Helpers ────────────────────────────────────────────────────────
const ToggleSwitch = ({ checked, onChange }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className={clsx(
      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
      checked ? 'bg-brand-primary' : 'bg-gray-200'
    )}
  >
    <span className={clsx(
      'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
      checked ? 'translate-x-4' : 'translate-x-0'
    )} />
  </button>
);

// ─── Connection Panels ────────────────────────────────────────────────

function BrowserPanel({ settings, onChange, profileSettings }) {
  return (
    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3">
      <div className="flex gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <Globe size={16} className="text-blue-600" />
        </div>
        <div>
          <div className="text-sm font-bold text-blue-900">Standard Browser Print</div>
          <div className="text-xs text-blue-700 mt-0.5">Uses the device's native print dialog. Best for standard A4 or desktop thermal printers.</div>
        </div>
      </div>
      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100">
        <div>
          <div className="text-sm font-bold text-ui-text">Auto-Print on Checkout</div>
          <div className="text-xs text-ui-muted">Skip preview and print directly (kiosk mode)</div>
        </div>
        <ToggleSwitch checked={!!settings.autoPrint} onChange={v => onChange('autoPrint', v)} />
      </div>
    </div>
  );
}

function BluetoothPanel({ settings, onChange }) {
  const [status, setStatus] = useState('disconnected');
  const [device, setDevice] = useState(null);

  useEffect(() => {
    const check = setInterval(() => {
      setStatus(bluetoothDriver.isConnected() ? 'connected' : 'disconnected');
      setDevice(bluetoothDriver.device);
    }, 1000);
    return () => clearInterval(check);
  }, []);

  const handleConnect = async () => {
    setStatus('connecting');
    try {
      const device = await bluetoothDriver.scan();
      await bluetoothDriver.connect(device);
      bluetoothDriver.savePreferred();
      setStatus('connected');
    } catch (e) {
      alert('Bluetooth connection failed: ' + e.message);
      setStatus('disconnected');
    }
  };

  return (
    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3">
      <div className="flex gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
          <Bluetooth size={16} className="text-indigo-600" />
        </div>
        <div>
          <div className="text-sm font-bold text-indigo-900">Bluetooth Thermal Printer</div>
          <div className="text-xs text-indigo-700 mt-0.5">Directly connect to nearby Bluetooth POS printers (Chrome/Android only).</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-indigo-100 overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-indigo-50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Printer size={20} className={status === 'connected' ? 'text-green-600' : 'text-gray-400'} />
              {status === 'connected' && <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>}
            </div>
            <div>
              <div className="text-sm font-bold text-ui-text">{device?.name || 'No Printer Connected'}</div>
              <div className="text-xs text-ui-muted flex items-center gap-1">
                Status: <span className={clsx('font-bold', status === 'connected' ? 'text-green-600' : status === 'connecting' ? 'text-yellow-600' : 'text-gray-500')}>{status.toUpperCase()}</span>
              </div>
            </div>
          </div>
          {status === 'connected' ? (
            <button onClick={() => bluetoothDriver.disconnect()} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100">Disconnect</button>
          ) : (
            <button onClick={handleConnect} disabled={status === 'connecting'} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-2">
              {status === 'connecting' ? <Loader2 size={12} className="animate-spin" /> : <ScanLine size={12} />}
              {status === 'connecting' ? 'Pairing...' : 'Scan & Pair'}
            </button>
          )}
        </div>
        
        <div className="p-3 bg-gray-50 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-ui-text">Auto-Reconnect</div>
            <div className="text-[10px] text-ui-muted">Try connecting on app start</div>
          </div>
          <ToggleSwitch checked={!!settings.autoReconnect} onChange={v => onChange('autoReconnect', v)} />
        </div>
      </div>
    </div>
  );
}

function USBPanel({ settings }) {
  const [status, setStatus] = useState('disconnected');
  const [device, setDevice] = useState(null);

  useEffect(() => {
    const check = setInterval(() => {
      setStatus(usbDriver.isConnected() ? 'connected' : 'disconnected');
      setDevice(usbDriver.device);
    }, 1000);
    return () => clearInterval(check);
  }, []);

  const handleConnect = async () => {
    setStatus('connecting');
    try {
      await usbDriver.connect();
      setStatus('connected');
    } catch (e) {
      alert('USB connection failed: ' + e.message);
      setStatus('disconnected');
    }
  };

  return (
    <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-3">
      <div className="flex gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
          <Usb size={16} className="text-purple-600" />
        </div>
        <div>
          <div className="text-sm font-bold text-purple-900">WebUSB Direct</div>
          <div className="text-xs text-purple-700 mt-0.5">Wired connection to USB receipt printers without drivers (Chrome/Edge desktop).</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-purple-100 overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Plug size={20} className={status === 'connected' ? 'text-green-600' : 'text-gray-400'} />
            <div>
              <div className="text-sm font-bold text-ui-text">{device?.productName || 'No USB Printer'}</div>
              <div className="text-xs text-ui-muted">Status: <span className={clsx('font-bold', status === 'connected' ? 'text-green-600' : 'text-gray-500')}>{status.toUpperCase()}</span></div>
            </div>
          </div>
          {status === 'connected' ? (
            <button onClick={() => usbDriver.disconnect()} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100">Disconnect</button>
          ) : (
            <button onClick={handleConnect} disabled={status === 'connecting'} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 flex items-center gap-2">
              {status === 'connecting' ? <Loader2 size={12} className="animate-spin" /> : <PlugZap size={12} />}
              Connect USB
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NetworkPanel({ settings, onChange }) {
  const [testing, setTesting] = useState(false);

  return (
    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3">
      <div className="flex gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <Wifi size={16} className="text-emerald-600" />
        </div>
        <div>
          <div className="text-sm font-bold text-emerald-900">ESC/POS Network Printer</div>
          <div className="text-xs text-emerald-700 mt-0.5">Print over LAN via local relay server.</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-emerald-100 p-4 space-y-3">
        <div>
          <label className="text-xs font-bold text-ui-text block mb-1">Printer IP Address</label>
          <input type="text" value={settings.networkIp || ''} onChange={e => onChange('networkIp', e.target.value)}
            placeholder="e.g., 192.168.1.100"
            className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold text-ui-text block mb-1">Port</label>
          <input type="number" value={settings.networkPort || 9100} onChange={e => onChange('networkPort', parseInt(e.target.value))}
            className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
        </div>
        <div className="pt-2">
          <div className="text-xs bg-emerald-50 text-emerald-700 p-2 rounded flex items-start gap-2">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>Requires running the local relay on the cashier's machine: <code className="font-bold">npx escpos-relay-server --port 6001</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiagnosticsPanel({ settings }) {
  const [errorLog, setErrorLog] = useState([]);
  
  useEffect(() => {
    try {
      const logs = JSON.parse(localStorage.getItem('pos_print_error_log') || '[]');
      setErrorLog(logs);
    } catch (e) {}
  }, []);

  return (
    <div className="border border-ui-border rounded-2xl overflow-hidden bg-ui-card">
      <div className="p-4 bg-gray-50 flex items-center justify-between border-b border-ui-border">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-gray-500" />
          <span className="text-xs font-bold text-ui-text uppercase tracking-wider">Printer Status & Diagnostics</span>
        </div>
        <button onClick={() => { localStorage.removeItem('pos_print_error_log'); setErrorLog([]); }} className="text-xs text-ui-muted hover:text-red-500">Clear Logs</button>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] text-ui-muted font-bold uppercase mb-1">Active Driver</div>
            <div className="text-sm font-medium text-ui-text flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-green-500" />
              {settings.printerModule || 'browser'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-ui-muted font-bold uppercase mb-1">Last Print</div>
            <div className="text-sm font-medium text-ui-text flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400" />
              {localStorage.getItem('pos_last_print_time') ? new Date(localStorage.getItem('pos_last_print_time')).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>

        {errorLog.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-bold text-ui-muted">Recent Error Log</div>
            {errorLog.map((e, i) => (
              <div key={i} className="text-xs bg-red-50 border border-red-100 rounded-lg p-2 text-red-700 font-mono">
                {e.time} — {e.msg}
              </div>
            ))}
          </div>
        )}
        {errorLog.length === 0 && <div className="text-xs text-ui-muted text-center py-2">No errors logged.</div>}
      </div>
    </div>
  );
}

// ─── Live Receipt Preview ────────────────────────────────────────────────────────────
function LiveReceiptPreview({ settings, profileSettings }) {
  const html = buildReceiptHTML(sampleOrder, 'Test Customer', settings, profileSettings);
  return (
    <div className="bg-white shadow-lg w-full relative overflow-hidden flex flex-col mx-auto" style={{ height: '70vh', minHeight: '500px', maxWidth: '340px' }}>
      <div className="bg-gray-200 border-b border-gray-300 h-8 flex items-center px-3 justify-between shrink-0">
         <div className="flex gap-1.5">
           <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
           <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
           <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
         </div>
         <div className="text-[10px] text-gray-500 font-mono">Printed Output</div>
      </div>
      <iframe srcDoc={html} style={{ width: '100%', height: '100%', border: 'none' }} title="Receipt Preview" className="bg-white flex-1" />
    </div>
  );
}

// ─── Logo Uploader ───────────────────────────────────────────────────────────
const LogoUploader = ({ settings, onChange }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert('Logo file is too large (max 500KB).');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange('storeLogoUrl', reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-ui-card border border-ui-border rounded-xl">
      <div className="flex items-center gap-3">
         <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden shrink-0">
           {settings.storeLogoUrl ? (
             <img src={settings.storeLogoUrl} alt="Logo" className="w-full h-full object-contain" />
           ) : (
             <ImageIcon size={18} className="text-gray-400" />
           )}
         </div>
        <div>
          <span className="text-sm font-bold text-ui-text">Store Logo Image</span>
          <div className="text-[10px] text-ui-muted leading-tight">Max 500KB. Transparent PNG recommended.</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {settings.storeLogoUrl && (
          <button onClick={() => onChange('storeLogoUrl', '')} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg text-xs font-bold transition-colors">Clear</button>
        )}
        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">
          Upload
        </button>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────
export default function PrintLayoutSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [profileSettings, setProfileSettings] = useState({});
  const [search, setSearch] = useState('');
  const [openSections, setOpenSections] = useState({ header: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const dbSettings = await db.settings.get('printAdvanced');
      if (dbSettings) setSettings(prev => ({ ...prev, ...dbSettings.data }));
      else {
        const old = await db.settings.get('print');
        if (old) setSettings(prev => ({
          ...prev,
          fontSize: old.fontSize || prev.fontSize,
          paperWidth: old.paperWidth || prev.paperWidth,
          storeHeader: old.showHeader ?? prev.storeHeader,
          footerMessage: old.showFooter ?? prev.footerMessage,
          customerName: old.showCustomer ?? prev.customerName,
          cashierName: old.showCashier ?? prev.cashierName,
          printerModule: old.printerModule || prev.printerModule,
          customFooterText: old.customFooter || prev.customFooterText,
        }));
      }
      const profile = await db.settings.get('profile');
      if (profile) setProfileSettings(profile);
    };
    load();
  }, []);

  const handleChange = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await db.settings.put({ id: 'printAdvanced', data: settings });
      alert('Print settings saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset to default layout?')) setSettings(DEFAULT_SETTINGS);
  };

  const toggleSection = (id) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  const filteredSections = useMemo(() => {
    if (!search) return RECEIPT_SECTIONS;
    const q = search.toLowerCase();
    return RECEIPT_SECTIONS.map(s => ({
      ...s,
      fields: s.fields.filter(f => f.label.toLowerCase().includes(q)),
    })).filter(s => s.fields.length > 0);
  }, [search]);

  const printerTypes = [
    { id: 'browser',        label: 'Browser',   icon: Globe },
    { id: 'thermal_bt',     label: 'Bluetooth', icon: Bluetooth },
    { id: 'thermal_usb',    label: 'USB',       icon: Usb },
    { id: 'thermal_escpos', label: 'Network',   icon: Wifi },
  ];
  
  const layoutThemes = [
    { id: 'standard', label: 'Standard', desc: 'Classic dashed lines' },
    { id: 'modern', label: 'Modern', desc: 'Clean solid lines' },
    { id: 'minimal', label: 'Minimal', desc: 'No borders, spacious' },
    { id: 'bold', label: 'Bold', desc: 'Heavy borders & text' },
    { id: 'elegant', label: 'Elegant', desc: 'Double lined borders' }
  ];

  const handleTestPrint = async () => {
    try {
      const mod = settings.printerModule || 'browser';
      if (mod === 'browser') {
        const html = buildReceiptHTML(sampleOrder, 'Test Customer', settings, profileSettings);
        await browserDriver.print(html);
      } else if (mod === 'thermal_bt') {
        if (!bluetoothDriver.isConnected()) throw new Error('Bluetooth not connected. Connect it in Printer Settings above.');
        await bluetoothDriver.print(buildESCPOSBytes(sampleOrder, settings, profileSettings));
      } else if (mod === 'thermal_usb') {
        if (!usbDriver.isConnected()) throw new Error('USB printer not connected. Detect it in Printer Settings above.');
        await usbDriver.print(buildESCPOSBytes(sampleOrder, settings, profileSettings));
      } else if (mod === 'thermal_escpos') {
        if (!settings.networkIp) throw new Error('Network printer IP not set. Enter it in Printer Settings above.');
        await networkDriver.print(buildESCPOSBytes(sampleOrder, settings, profileSettings), settings.networkIp, settings.networkPort);
      }
      localStorage.setItem('pos_last_print_time', new Date().toISOString());
    } catch (e) {
      alert('Test Print Error: ' + e.message);
      const log = JSON.parse(localStorage.getItem('pos_print_error_log') || '[]');
      log.push({ time: new Date().toLocaleTimeString(), msg: e.message });
      localStorage.setItem('pos_print_error_log', JSON.stringify(log.slice(-20)));
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">

      {/* ═══════════════════════════════════════════════
          SECTION 1 — PRINTER SETTINGS
      ═══════════════════════════════════════════════ */}
      <div className="bg-ui-card rounded-3xl border border-ui-border shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="px-5 py-4 border-b border-ui-border bg-ui-bg flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
            <Printer size={16} className="text-brand-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-ui-text">Printer Settings</h2>
            <p className="text-xs text-ui-muted">Connection type, paper size & diagnostics</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Connection Type */}
          <div>
            <p className="text-[11px] font-bold text-ui-muted uppercase tracking-wider mb-2">Connection Type</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {printerTypes.map(pt => {
                const Icon = pt.icon;
                const active = settings.printerModule === pt.id;
                return (
                  <button key={pt.id} onClick={() => handleChange('printerModule', pt.id)}
                    className={clsx(
                      'flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-bold transition-all border-2',
                      active
                        ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                        : 'border-transparent bg-ui-bg text-ui-muted hover:text-ui-text hover:bg-ui-border/20'
                    )}>
                    <Icon size={18} />
                    {pt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Connection Panel */}
          <div>
            <p className="text-[11px] font-bold text-ui-muted uppercase tracking-wider mb-2">Connection Panel</p>
            {settings.printerModule === 'browser' && <BrowserPanel settings={settings} onChange={handleChange} profileSettings={profileSettings} />}
            {settings.printerModule === 'thermal_bt' && <BluetoothPanel settings={settings} onChange={handleChange} />}
            {settings.printerModule === 'thermal_usb' && <USBPanel settings={settings} />}
            {settings.printerModule === 'thermal_escpos' && <NetworkPanel settings={settings} onChange={handleChange} />}
          </div>

          {/* Diagnostics */}
          <div>
            <DiagnosticsPanel settings={settings} />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          SECTION 2 — PRINT LAYOUT & THEMES
      ═══════════════════════════════════════════════ */}
      <div className="bg-ui-card rounded-3xl border border-ui-border shadow-sm overflow-hidden flex-1 flex flex-col">
        {/* Header row */}
        <div className="px-5 py-4 border-b border-ui-border bg-ui-bg flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <Search size={15} className="text-green-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ui-text">Print Layout & Themes</h2>
              <p className="text-[11px] text-ui-muted hidden md:block">Design your receipt with live preview</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleTestPrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all">
              <Zap size={13} /> Test Print
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 disabled:opacity-70 transition-all">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save
            </button>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex flex-col xl:flex-row flex-1 overflow-hidden min-h-0">

          {/* LEFT — Toggle Settings */}
          <div className="flex-1 border-b xl:border-b-0 xl:border-r border-ui-border flex flex-col overflow-y-auto hide-scrollbar bg-gray-50/30">
            
            {/* Design & Theme Panel */}
            <div className="p-5 border-b border-ui-border">
               <h3 className="text-[11px] font-bold text-ui-muted uppercase tracking-wider mb-3">1. Select Layout Theme</h3>
               
               <div className="flex overflow-x-auto gap-3 pb-3 hide-scrollbar snap-x">
                 {layoutThemes.map(t => {
                   const active = settings.theme === t.id || (!settings.theme && t.id === 'standard');
                   return (
                     <button key={t.id} onClick={() => handleChange('theme', t.id)}
                       className={clsx(
                         'shrink-0 snap-start w-32 p-3 text-left rounded-2xl border-2 transition-all',
                         active ? 'border-brand-primary bg-brand-primary/10 shadow-sm' : 'border-ui-border bg-white hover:border-gray-300'
                       )}>
                       <div className={clsx('font-bold text-sm', active ? 'text-brand-primary' : 'text-ui-text')}>{t.label}</div>
                       <div className="text-[10px] text-ui-muted mt-1 leading-tight">{t.desc}</div>
                     </button>
                   );
                 })}
               </div>

               <h3 className="text-[11px] font-bold text-ui-muted uppercase tracking-wider mb-3 mt-4">2. Typography & Spacing</h3>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-ui-text">Paper Width</label>
                    <select value={settings.paperWidth || '300px'} onChange={e => handleChange('paperWidth', e.target.value)}
                      className="p-2.5 rounded-xl bg-white border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-xs font-bold text-ui-text">
                      <option value="200px">2 inch (58mm)</option>
                      <option value="300px">3 inch (80mm)</option>
                      <option value="100%">A4 / Full Width</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-ui-text">Font Family</label>
                    <select value={settings.fontFamily || 'monospace'} onChange={e => handleChange('fontFamily', e.target.value)}
                      className="p-2.5 rounded-xl bg-white border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-xs font-bold text-ui-text">
                      <option value="monospace">Monospace (Thermal)</option>
                      <option value="'Inter', sans-serif">Sans-serif (Modern)</option>
                      <option value="Georgia, serif">Serif (Elegant)</option>
                      <option value="system-ui">System Default</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-ui-text">Font Size</label>
                    <select value={settings.fontSize || '13px'} onChange={e => handleChange('fontSize', e.target.value)}
                      className="p-2.5 rounded-xl bg-white border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-xs font-bold text-ui-text">
                      <option value="11px">Small (11px)</option>
                      <option value="13px">Medium (13px)</option>
                      <option value="16px">Large (16px)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-ui-text">Line Spacing</label>
                    <select value={settings.lineSpacing || 'normal'} onChange={e => handleChange('lineSpacing', e.target.value)}
                      className="p-2.5 rounded-xl bg-white border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-xs font-bold text-ui-text">
                      <option value="compact">Compact (Tight)</option>
                      <option value="normal">Normal</option>
                      <option value="relaxed">Relaxed (Loose)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-ui-text">Receipt Padding</label>
                    <select value={settings.receiptPadding || '10px'} onChange={e => handleChange('receiptPadding', e.target.value)}
                      className="p-2.5 rounded-xl bg-white border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-xs font-bold text-ui-text">
                      <option value="0px">None (0px)</option>
                      <option value="10px">Standard (10px)</option>
                      <option value="20px">Wide (20px)</option>
                    </select>
                  </div>
               </div>
               
               <LogoUploader settings={settings} onChange={handleChange} />
            </div>

            {/* Content Toggles Search */}
            <div className="p-4 border-b border-ui-border bg-white sticky top-0 z-10 shadow-sm">
              <h3 className="text-[11px] font-bold text-ui-muted uppercase tracking-wider mb-2">3. Content Fields</h3>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-muted" />
                <input type="text" placeholder="Search layout settings…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium text-ui-text" />
              </div>
            </div>

            {/* Accordions */}
            <div className="p-5 space-y-3 pb-20">
              {filteredSections.map(sec => (
                <div key={sec.id} className="bg-white border border-ui-border rounded-2xl overflow-hidden shadow-sm">
                  <button onClick={() => toggleSection(sec.id)}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-gray-50 transition-colors">
                    <span className="font-bold text-ui-text text-sm">{sec.label}</span>
                    {openSections[sec.id] || search
                      ? <ChevronDown size={16} className="text-ui-muted" />
                      : <ChevronRight size={16} className="text-ui-muted" />}
                  </button>
                  {(openSections[sec.id] || search) && (
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-ui-border">
                      {sec.fields.map(f => (
                        <div key={f.id} className={clsx(
                          'flex justify-between items-center',
                          (f.type === 'text' || f.type === 'number') ? 'flex-col items-start gap-1.5' : ''
                        )}>
                          <span className="text-sm font-medium text-gray-700">{f.label}</span>
                          {f.type === 'toggle' && (
                            <ToggleSwitch checked={!!settings[f.id]} onChange={v => handleChange(f.id, v)} />
                          )}
                          {(f.type === 'text' || f.type === 'number') && (
                            <input type={f.type} value={settings[f.id] || ''}
                              onChange={e => handleChange(f.id, f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
                              className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-primary outline-none text-sm font-bold text-ui-text" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Sticky Live Preview */}
          <div className="w-full xl:w-[420px] shrink-0 bg-[#e5e7eb] flex flex-col relative border-t xl:border-t-0">
            <div className="px-5 py-3 border-b border-gray-300 bg-gray-100 flex items-center justify-between shadow-sm z-10">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Live Preview</span>
              <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1.5 border border-green-200">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" />
                Real-time output
              </span>
            </div>
            
            {/* The preview container */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start hide-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
              <div className="shadow-2xl ring-1 ring-black/5 rounded-sm transition-all duration-300 transform hover:scale-[1.02]">
                <LiveReceiptPreview settings={settings} profileSettings={profileSettings} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from '../db/db';
import { db, hashPin } from '../db/db';
import { Download, Upload, Cloud, Heart, Store, FileText, Users, Plus, Trash2, Printer, Pencil, ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import PrintLayoutSettings from '../components/PrintLayoutSettings';


const PERMISSION_GROUPS = [
  { name: 'Billing', permissions: [
    { id: 'billing_access', label: 'Access Billing' }, { id: 'billing_create', label: 'Create Bill' }, { id: 'billing_edit', label: 'Edit Bill' }, { id: 'billing_delete_item', label: 'Delete Item' }, { id: 'billing_change_price', label: 'Change Item Price' }, { id: 'billing_discount', label: 'Apply Discount' }, { id: 'billing_custom_discount', label: 'Apply Custom Discount' }, { id: 'billing_hold', label: 'Hold Order' }, { id: 'billing_recall', label: 'Recall Order' }, { id: 'billing_split', label: 'Split Bill' }, { id: 'billing_merge', label: 'Merge Bill' }, { id: 'billing_reprint', label: 'Reprint Bill' }, { id: 'billing_void', label: 'Void Bill' }, { id: 'billing_refund', label: 'Refund Bill' }
  ]},
  { name: 'Orders', permissions: [
    { id: 'orders_view', label: 'View Orders' }, { id: 'orders_edit', label: 'Edit Orders' }, { id: 'orders_cancel', label: 'Cancel Orders' }, { id: 'orders_void', label: 'Void Orders' }, { id: 'orders_history', label: 'Order History' }
  ]},
  { name: 'Menu', permissions: [
    { id: 'menu_view', label: 'View Menu' }, { id: 'menu_add', label: 'Add Menu Item' }, { id: 'menu_edit', label: 'Edit Menu Item' }, { id: 'menu_delete', label: 'Delete Menu Item' }, { id: 'menu_categories', label: 'Category Management' }
  ]},
  { name: 'Inventory', permissions: [
    { id: 'inventory_view', label: 'View Inventory' }, { id: 'inventory_adjust', label: 'Stock Adjustment' }, { id: 'inventory_add', label: 'Add Stock' }, { id: 'inventory_edit', label: 'Edit Stock' }, { id: 'inventory_physical', label: 'Physical Stock Count' }, { id: 'inventory_wastage', label: 'Wastage Entry' }
  ]},
  { name: 'Purchases', permissions: [
    { id: 'purchases_view', label: 'View Purchase' }, { id: 'purchases_create', label: 'Create Purchase' }, { id: 'purchases_edit', label: 'Edit Purchase' }, { id: 'purchases_delete', label: 'Delete Purchase' }, { id: 'purchases_payment', label: 'Supplier Payment' }
  ]},
  { name: 'Customers', permissions: [
    { id: 'customers_view', label: 'View Customers' }, { id: 'customers_add', label: 'Add Customers' }, { id: 'customers_edit', label: 'Edit Customers' }, { id: 'customers_delete', label: 'Delete Customers' }, { id: 'customers_loyalty', label: 'Loyalty Access' }
  ]},
  { name: 'Expenses', permissions: [
    { id: 'expenses_view', label: 'View Expense' }, { id: 'expenses_add', label: 'Add Expense' }, { id: 'expenses_edit', label: 'Edit Expense' }, { id: 'expenses_delete', label: 'Delete Expense' }
  ]},
  { name: 'Reports', permissions: [
    { id: 'reports_dashboard', label: 'Dashboard Access' }, { id: 'reports_sales', label: 'Sales Reports' }, { id: 'reports_items', label: 'Item Reports' }, { id: 'reports_inventory', label: 'Inventory Reports' }, { id: 'reports_expenses', label: 'Expense Reports' }, { id: 'reports_attendance', label: 'Attendance Reports' }, { id: 'reports_gst', label: 'GST Reports' }, { id: 'reports_export_excel', label: 'Export Excel' }, { id: 'reports_export_pdf', label: 'Export PDF' }
  ]},
  { name: 'Attendance', permissions: [
    { id: 'attendance_mark', label: 'Mark Attendance' }, { id: 'attendance_view_own', label: 'View Own Attendance' }, { id: 'attendance_view_all', label: 'View All Attendance' }, { id: 'attendance_edit', label: 'Edit Attendance' }, { id: 'attendance_gps_override', label: 'GPS Override' }
  ]},
  { name: 'Employees', permissions: [
    { id: 'employees_view', label: 'View Employees' }, { id: 'employees_add', label: 'Add Employees' }, { id: 'employees_edit', label: 'Edit Employees' }, { id: 'employees_delete', label: 'Delete Employees' }, { id: 'employees_salary', label: 'Salary Access' }
  ]},
  { name: 'Settings', permissions: [
    { id: 'settings_business', label: 'Business Profile' }, { id: 'settings_printing', label: 'Printing Settings' }, { id: 'settings_tax', label: 'Tax Settings' }, { id: 'settings_loyalty', label: 'Loyalty Settings' }, { id: 'settings_backup', label: 'Backup & Restore' }, { id: 'settings_staff', label: 'Staff Management' }, { id: 'settings_permissions', label: 'Permission Management' }
  ]},
  { name: 'Cash Management', permissions: [
    { id: 'cash_start_shift', label: 'Start Shift' }, { id: 'cash_end_shift', label: 'End Shift' }, { id: 'cash_open_drawer', label: 'Open Drawer' }, { id: 'cash_in', label: 'Cash In' }, { id: 'cash_out', label: 'Cash Out' }, { id: 'cash_view_summary', label: 'View Cash Summary' }
  ]}
];

const ROLE_TEMPLATES = {
  manager: [
    'billing_access', 'billing_create', 'billing_edit', 'billing_delete_item', 'billing_change_price', 'billing_discount', 'billing_custom_discount', 'billing_hold', 'billing_recall', 'billing_split', 'billing_merge', 'billing_reprint', 'billing_void', 'billing_refund',
    'orders_view', 'orders_edit', 'orders_cancel', 'orders_void', 'orders_history',
    'menu_view', 'menu_add', 'menu_edit', 'menu_delete', 'menu_categories',
    'inventory_view', 'inventory_adjust', 'inventory_add', 'inventory_edit', 'inventory_physical', 'inventory_wastage',
    'purchases_view', 'purchases_create', 'purchases_edit', 'purchases_delete', 'purchases_payment',
    'customers_view', 'customers_add', 'customers_edit', 'customers_delete', 'customers_loyalty',
    'expenses_view', 'expenses_add', 'expenses_edit', 'expenses_delete',
    'reports_dashboard', 'reports_sales', 'reports_items', 'reports_inventory', 'reports_expenses', 'reports_attendance', 'reports_gst', 'reports_export_excel', 'reports_export_pdf',
    'attendance_mark', 'attendance_view_own', 'attendance_view_all', 'attendance_edit', 'attendance_gps_override',
    'cash_start_shift', 'cash_end_shift', 'cash_open_drawer', 'cash_in', 'cash_out', 'cash_view_summary'
  ],
  cashier: [
    'billing_access', 'billing_create', 'billing_hold', 'billing_recall', 'billing_split', 'billing_reprint',
    'orders_view', 'orders_history',
    'customers_view', 'customers_add', 'customers_loyalty',
    'attendance_mark', 'attendance_view_own',
    'cash_start_shift', 'cash_end_shift'
  ],
  staff: [
    'attendance_mark', 'attendance_view_own'
  ]
};

function toggleGroup(groupPerms, currentPerms, setPerms) {
  const groupIds = groupPerms.map(p => p.id);
  const allSelected = groupIds.every(id => currentPerms.includes(id));
  if (allSelected) {
    setPerms(currentPerms.filter(id => !groupIds.includes(id)));
  } else {
    setPerms([...new Set([...currentPerms, ...groupIds])]);
  }
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  // Loyalty
  const [earnRatio, setEarnRatio] = useState(100);
  const [pointValue, setPointValue] = useState(1);
  
  // Business Profile
  const [bName, setBName] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bGstin, setBGstin] = useState('');
  const [bFooter, setBFooter] = useState('');
  const [terminalId, setTerminalId] = useState('T1');
  
  // GPS Attendance
  const [storeLat, setStoreLat] = useState('');
  const [storeLng, setStoreLng] = useState('');
  const [attendanceRadius, setAttendanceRadius] = useState(100);
  
  // Staff
  const [staffName, setStaffName] = useState('');
  const [staffPin, setStaffPin] = useState('');
  const [staffRole, setStaffRole] = useState('cashier');
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [staffPermissions, setStaffPermissions] = useState(['billing', 'orders', 'customers']);
  
  
  
  
  const loyaltySettings = useLiveQuery(() => db.settings.get('loyalty'));
  const profileSettings = useLiveQuery(() => db.settings.get('profile'));
  const printData = useLiveQuery(() => db.settings.get('print'));
  const users = useLiveQuery(() => db.users.toArray()) || [];

  


  const [fontSize, setFontSize] = useState('13px');
  const [paperWidth, setPaperWidth] = useState('300px');
  const [printHeader, setPrintHeader] = useState(true);
  const [printFooter, setPrintFooter] = useState(true);
  const [showCustomer, setShowCustomer] = useState(true);
  const [showCashier, setShowCashier] = useState(true);
  const [showTime, setShowTime] = useState(true);
  const [printerModule, setPrinterModule] = useState('browser');
  const [invoiceFormat, setInvoiceFormat] = useState('standard');
  const [customFooter, setCustomFooter] = useState('');


  
  useEffect(() => {
    if (printData) {
      setFontSize(printData.fontSize || '13px');
      setPaperWidth(printData.paperWidth || '300px');
      setPrintHeader(printData.showHeader ?? true);
      setPrintFooter(printData.showFooter ?? true);
      setShowCustomer(printData.showCustomer ?? true);
      setShowCashier(printData.showCashier ?? true);
      setShowTime(printData.showTime ?? true);
      setPrinterModule(printData.printerModule || 'browser');
      setInvoiceFormat(printData.invoiceFormat || 'standard');
      setCustomFooter(printData.customFooter || 'Thank you! Visit again.');
    }
  }, [printData]);

  useEffect(() => {
    if (loyaltySettings) {
      setEarnRatio(loyaltySettings.earnRatio || 100);
      setPointValue(loyaltySettings.pointValue ? (1 / loyaltySettings.pointValue).toFixed(0) : 1);
    }
    if (profileSettings) {
      setBName(profileSettings.name || '');
      setBPhone(profileSettings.phone || '');
      setBAddress(profileSettings.address || '');
      setBGstin(profileSettings.gstin || '');
      setBFooter(profileSettings.footer || '');
      setTerminalId(profileSettings.terminalId || 'T1');
      setStoreLat(profileSettings.storeLat || '');
      setStoreLng(profileSettings.storeLng || '');
      setAttendanceRadius(profileSettings.attendanceRadius || 100);
    }
  }, [loyaltySettings, profileSettings]);

  
  const savePrintSettings = async () => {
    await db.settings.put({ 
      id: 'print', fontSize, paperWidth, 
      showHeader: printHeader, showFooter: printFooter,
      showCustomer, showCashier, showTime, printerModule, customFooter, invoiceFormat
    });
    alert('Print settings saved!');
  };

  const saveLoyalty = async () => {
    await db.settings.put({ id: 'loyalty', earnRatio: parseFloat(earnRatio), pointValue: 1 / parseFloat(pointValue) });
    alert('Loyalty settings saved!');
  };

  const saveProfile = async () => {
    await db.settings.put({ 
      id: 'profile', 
      name: bName, phone: bPhone, address: bAddress, gstin: bGstin, footer: bFooter, terminalId, storeLat, storeLng, attendanceRadius
    });
    alert('Business profile saved!');
  };
  
  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!staffName || (!editingStaffId && (!staffPin || staffPin.length < 8))) {
      alert("Please provide a name and a PIN (at least 8 alphanumeric characters).");
      return;
    }
    
    let hashedPin = undefined;
    if (staffPin) {
      hashedPin = await hashPin(staffPin);
      const exists = await db.users.where('pin').equals(hashedPin).first();
      if (exists && exists.id !== editingStaffId) {
        alert("This PIN is already in use by another staff member.");
        return;
      }
    }
    
    if (editingStaffId) {
      const updateData = { name: staffName, role: staffRole, permissions: staffPermissions };
      if (hashedPin) updateData.pin = hashedPin;
      await db.users.update(editingStaffId, updateData);
    } else {
      await db.users.add({ name: staffName, pin: hashedPin, role: staffRole, permissions: staffPermissions });
    }
    setStaffName(''); setStaffPin(''); setStaffRole('cashier'); setStaffPermissions(['billing', 'orders', 'customers']); setEditingStaffId(null);
  };
  
  const startEditStaff = (u) => {
    setEditingStaffId(u.id);
    setStaffName(u.name);
    setStaffRole(u.role); setStaffPermissions(u.permissions || []);
    setStaffPermissions(u.permissions || []);
    setStaffPin(''); // Do not show existing PIN
  };
  
  const handleDeleteStaff = async (id) => {
    if (window.confirm("Remove this staff member?")) {
      await db.users.delete(id);
    }
  };

  
  const fileInputRef = useRef();
  
  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        for (const table of db.tables) {
          if (data[table.name]) {
            await table.bulkPut(data[table.name]);
          }
        }
        alert('Backup restored successfully!');
      } catch (err) {
        alert('Failed to restore backup. Invalid file.');
      }
    };
    reader.readAsText(file);
  };

  const downloadBackup = async () => {
    const data = {};
    for (const table of db.tables) {
      data[table.name] = await table.toArray();
    }
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    try {
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({ suggestedName: `pos_backup_${new Date().toISOString().split('T')[0]}.json`, types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }] });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        alert('Backup saved to your file system.');
        return;
      }
    } catch (e) { return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `pos_backup_${new Date().toISOString().split('T')[0]}.json`; a.click();
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8 overflow-hidden">
      <h1 className="text-3xl font-bold text-ui-text tracking-tight mb-6 shrink-0">Settings</h1>
      
      <div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border mb-8 w-full md:w-fit max-w-full shadow-sm shrink-0 overflow-x-auto hide-scrollbar">
        <button className={clsx("px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap", activeTab === 'profile' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('profile')}>Business Profile</button>
        <button className={clsx("px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap", activeTab === 'print' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('print')}>Print Layout</button>
        <button className={clsx("px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap", activeTab === 'loyalty' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('loyalty')}>Loyalty</button>
        <button className={clsx("px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap", activeTab === 'staff' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('staff')}>Staff & Access</button>
        <button className={clsx("px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap", activeTab === 'attendance' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('attendance')}>GPS Attendance</button>
        <button className={clsx("px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap", activeTab === 'backup' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('backup')}>Backup & Sync</button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-10">
        <div className="max-w-2xl">
          {activeTab === 'profile' && (
            <div className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mb-6"><Store size={24}/></div>
              <h2 className="text-xl font-bold mb-2 text-ui-text">Business Profile</h2>
              <p className="text-ui-muted text-sm font-medium mb-6">These details will be printed on your customer receipts.</p>
              
              <div className="space-y-4 mb-6">
                <input type="text" placeholder="Business Name" value={bName} onChange={e=>setBName(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
                <input type="tel" placeholder="Phone Number" value={bPhone} onChange={e=>setBPhone(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
                <textarea placeholder="Complete Address" value={bAddress} onChange={e=>setBAddress(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text resize-none h-24" />
                <div className="flex gap-4">
                  <input type="text" placeholder="GSTIN (Optional)" value={bGstin} onChange={e=>setBGstin(e.target.value)} className="flex-[2] p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text uppercase" />
                  <input type="text" placeholder="Terminal ID (e.g. T1)" value={terminalId} onChange={e=>setTerminalId(e.target.value)} className="flex-1 p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
                </div>
                
                <div className="pt-4 border-t border-ui-border">
                  <label className="text-sm font-bold text-ui-muted flex items-center gap-2 mb-2"><FileText size={16}/> Receipt Footer Message</label>
                  <input type="text" placeholder="e.g. Thank you for visiting!" value={bFooter} onChange={e=>setBFooter(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
                </div>
              </div>
              <button onClick={saveProfile} className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all">Save Profile</button>
            </div>
          )}




          
          

          {activeTab === 'loyalty' && (
            <div className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm">
              <div className="w-12 h-12 bg-ui-bg rounded-2xl flex items-center justify-center text-brand-primary mb-6"><Heart size={24}/></div>
              <h2 className="text-xl font-bold mb-2 text-ui-text">Loyalty Program</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Earn Ratio (Amount per Point)</label>
                  <input type="number" placeholder="e.g. 100" value={earnRatio} onChange={e=>setEarnRatio(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
                </div>
                <div>
                  <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Point Value (Points per Rupee)</label>
                  <input type="number" placeholder="e.g. 1" value={pointValue} onChange={e=>setPointValue(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
                </div>
              </div>
              <button onClick={saveLoyalty} className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all">Save Loyalty Rules</button>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm h-fit">
                 <div className="w-12 h-12 bg-ui-bg rounded-2xl flex items-center justify-center text-brand-primary mb-6"><Users size={24}/></div>
                 <h2 className="text-xl font-bold mb-2 text-ui-text">{editingStaffId ? 'Edit Staff' : 'Add Staff'}</h2>
                 <form onSubmit={handleAddStaff} className="space-y-4">
                   <div>
                     <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Full Name</label>
                     <input type="text" required value={staffName} onChange={e=>setStaffName(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Password {editingStaffId ? '(Leave blank to keep)' : ''}</label>
                     <input type="password" required={!editingStaffId} minLength={8} placeholder="e.g. admin123" value={staffPin} onChange={e=>setStaffPin(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Role</label>
                     <select value={staffRole} onChange={e=>{ const r = e.target.value; setStaffRole(r); if(ROLE_TEMPLATES[r]) setStaffPermissions([...ROLE_TEMPLATES[r]]); else if(r==='custom') setStaffPermissions([]); }} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text">
                       <option value="owner">Owner / Admin</option>
                       <option value="manager">Manager</option>
                       <option value="cashier">Cashier</option><option value="staff">Staff</option><option value="custom">Custom Role</option>
                     </select>
                   </div>
                   {staffRole !== 'owner' && (
                     <div className="mt-6 border border-ui-border rounded-2xl bg-ui-bg overflow-hidden">
                       <div className="p-4 bg-ui-card border-b border-ui-border flex justify-between items-center">
                         <label className="text-xs font-bold text-ui-muted uppercase tracking-widest">Module Access & Permissions</label>
                         <button type="button" onClick={() => {
                            const all = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p=>p.id));
                            setStaffPermissions(all);
                            setStaffRole('custom');
                         }} className="text-xs font-bold text-brand-primary">Select All</button>
                       </div>
                       
                       <div className="max-h-96 overflow-y-auto hide-scrollbar p-2">
                         {PERMISSION_GROUPS.map(group => {
                           const groupIds = group.permissions.map(p=>p.id);
                           const selectedCount = groupIds.filter(id => staffPermissions.includes(id)).length;
                           const allSelected = selectedCount === groupIds.length;
                           const isExpanded = expandedGroups[group.name];
                           
                           return (
                             <div key={group.name} className="mb-2 bg-ui-card rounded-xl border border-ui-border overflow-hidden">
                               <div className="flex items-center justify-between p-3 bg-ui-bg cursor-pointer hover:bg-ui-border/50 transition-colors" onClick={() => setExpandedGroups({...expandedGroups, [group.name]: !isExpanded})}>
                                 <div className="flex items-center gap-3">
                                   {isExpanded ? <ChevronDown size={16} className="text-ui-muted"/> : <ChevronRight size={16} className="text-ui-muted"/>}
                                   <span className="font-bold text-ui-text text-sm">{group.name}</span>
                                   {selectedCount > 0 && <span className="bg-brand-primary/10 text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{selectedCount}/{groupIds.length}</span>}
                                 </div>
                                 <button type="button" onClick={(e) => { e.stopPropagation(); setStaffRole('custom'); toggleGroup(group.permissions, staffPermissions, setStaffPermissions); }} className="text-xs font-bold text-ui-muted hover:text-ui-text p-1">
                                   {allSelected ? 'Deselect All' : 'Select All'}
                                 </button>
                               </div>
                               {isExpanded && (
                                 <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 border-t border-ui-border">
                                   {group.permissions.map(perm => (
                                     <label key={perm.id} className="flex items-start gap-3 text-sm font-semibold text-ui-text cursor-pointer hover:opacity-80 transition-opacity">
                                       <input type="checkbox" checked={staffPermissions.includes(perm.id)} onChange={(e) => {
                                         setStaffRole('custom');
                                         if (e.target.checked) setStaffPermissions([...staffPermissions, perm.id]);
                                         else setStaffPermissions(staffPermissions.filter(p => p !== perm.id));
                                       }} className="mt-1 w-4 h-4 text-brand-primary rounded border-ui-border focus:ring-brand-primary" />
                                       <span className="leading-tight">{perm.label}</span>
                                     </label>
                                   ))}
                                 </div>
                               )}
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   )}

                   <button type="submit" className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all mt-4">{editingStaffId ? 'Update Staff' : 'Create Staff'}</button>
                   {editingStaffId && <button type="button" onClick={() => {setEditingStaffId(null); setStaffName(''); setStaffPin(''); setStaffRole('cashier'); setStaffPermissions(['billing', 'orders', 'customers']);}} className="w-full bg-ui-bg text-ui-text p-4 rounded-2xl font-bold hover:bg-ui-border mt-2">Cancel Edit</button>}
                 </form>
              </div>
              <div className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm h-fit">
                <h2 className="text-xl font-bold mb-6 text-ui-text">Staff List</h2>
                <div className="space-y-3">
                  {users.map(u => (
                    <div key={u.id} className="p-4 bg-ui-bg rounded-2xl border border-ui-border flex justify-between items-center">
                      <div>
                        <div className="font-bold text-ui-text">{u.name}</div>
                        <div className="text-xs text-ui-muted uppercase font-bold mt-1">{u.role}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {setEditingStaffId(u.id); setStaffName(u.name); setStaffRole(u.role); setStaffPin('');}} className="p-2 bg-ui-card rounded-xl text-ui-text hover:bg-ui-border transition-colors"><Pencil size={16}/></button>
                        <button onClick={() => handleDeleteStaff(u.id)} className="p-2 bg-brand-danger/10 rounded-xl text-brand-danger hover:bg-brand-danger hover:text-white transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'attendance' && (
            <div className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm">
              <h2 className="text-xl font-bold mb-2 text-ui-text">GPS Attendance Settings</h2>
              <p className="text-sm text-ui-muted mb-6">Staff must be within this radius of the store coordinates to check in.</p>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Store Latitude</label>
                  <input type="text" placeholder="e.g. 28.7041" value={storeLat} onChange={e=>setStoreLat(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
                </div>
                <div>
                  <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Store Longitude</label>
                  <input type="text" placeholder="e.g. 77.1025" value={storeLng} onChange={e=>setStoreLng(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
                </div>
                <div>
                  <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Allowed Radius (meters)</label>
                  <input type="number" placeholder="e.g. 100" value={attendanceRadius} onChange={e=>setAttendanceRadius(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
                </div>
                <button type="button" onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((position) => {
                      setStoreLat(position.coords.latitude);
                      setStoreLng(position.coords.longitude);
                    });
                  }
                }} className="w-full bg-ui-bg text-ui-text p-4 rounded-2xl font-bold border border-ui-border hover:bg-ui-border transition-colors">Use Current Location</button>
              </div>
              <button onClick={saveProfile} className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all">Save Location Rules</button>
            </div>
          )}

          {activeTab === 'print' && (
            <div className="mt-4">
              <PrintLayoutSettings />
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm">
              <div className="w-12 h-12 bg-ui-bg rounded-2xl flex items-center justify-center text-ui-muted mb-6"><Cloud size={24}/></div>
              <h2 className="text-xl font-bold mb-2 text-ui-text">Auto Backup & Sync</h2>
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button onClick={downloadBackup} className="flex-1 bg-ui-text text-ui-bg p-4 rounded-2xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Download size={20} /> Export Backup
                </button>
                <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleRestore} />
                <button onClick={() => fileInputRef.current.click()} className="flex-1 bg-ui-bg text-ui-text border border-ui-border p-4 rounded-2xl font-bold hover:bg-ui-border active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Upload size={20} /> Restore
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

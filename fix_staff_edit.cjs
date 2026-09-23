const fs = require('fs');
let file = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

// Add editingStaffId state
file = file.replace(
  `const [staffRole, setStaffRole] = useState('cashier');`,
  `const [staffRole, setStaffRole] = useState('cashier');\n  const [editingStaffId, setEditingStaffId] = useState(null);`
);

// Update handleAddStaff to handle updates
const handleStaff = `
  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!staffName || (!editingStaffId && (!staffPin || staffPin.length < 4))) {
      alert("Please provide a name and a PIN (at least 4 digits).");
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
    setStaffRole(u.role);
    setStaffPermissions(u.permissions || []);
    setStaffPin(''); // Do not show existing PIN
  };
`;
file = file.replace(/const handleAddStaff = async \(e\) => \{[\s\S]*?setStaffPermissions\(\['billing', 'orders', 'customers'\]\);\n  \};/g, handleStaff.trim());

// Update UI
const staffActionReplace = `
                     <div className="flex gap-2">
                       <button onClick={() => startEditStaff(u)} className="text-ui-muted hover:text-brand-primary p-2 transition-colors"><Pencil size={18} /></button>
                       <button onClick={() => handleDeleteStaff(u.id)} className="text-brand-danger/70 hover:text-brand-danger p-2 transition-colors"><Trash2 size={18} /></button>
                     </div>
`;
file = file.replace(
  /<button onClick=\{\(\) => handleDeleteStaff\(u\.id\)\} className="text-brand-danger\/70 hover:text-brand-danger p-2 transition-colors"><Trash2 size=\{18\}\/><\/button>/,
  staffActionReplace.trim()
);

// Update button text to "Update" if editing
file = file.replace(
  /<button type="submit" className="flex-1 bg-ui-text text-ui-bg rounded-xl font-bold flex items-center justify-center gap-1 active:scale-95 transition-all text-sm"><Plus size=\{16\}\/> Add<\/button>/,
  `<button type="submit" className="flex-1 bg-ui-text text-ui-bg rounded-xl font-bold flex items-center justify-center gap-1 active:scale-95 transition-all text-sm"><Plus size={16}/> {editingStaffId ? 'Update' : 'Add'}</button>`
);

file = file.replace(
  `<h3 className="text-sm font-bold text-ui-text mb-3">Add New Staff</h3>`,
  `<h3 className="text-sm font-bold text-ui-text mb-3 flex justify-between items-center">
    {editingStaffId ? 'Edit Staff Member' : 'Add New Staff'}
    {editingStaffId && <button onClick={() => {setEditingStaffId(null); setStaffName(''); setStaffRole('cashier'); setStaffPermissions([]);}} className="text-xs text-brand-primary">Cancel</button>}
  </h3>`
);

fs.writeFileSync('src/pages/Settings.jsx', file);

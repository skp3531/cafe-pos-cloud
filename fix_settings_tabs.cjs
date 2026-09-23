const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.jsx', 'utf-8');

const missingTabs = `

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
                 <form onSubmit={e => { e.preventDefault(); saveStaff(); }} className="space-y-4">
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
                     <select value={staffRole} onChange={e=>setStaffRole(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text">
                       <option value="owner">Owner / Admin</option>
                       <option value="manager">Manager</option>
                       <option value="cashier">Cashier</option>
                     </select>
                   </div>
                   <button type="submit" className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all mt-4">{editingStaffId ? 'Update Staff' : 'Create Staff'}</button>
                   {editingStaffId && <button type="button" onClick={() => {setEditingStaffId(null); setStaffName(''); setStaffPin(''); setStaffRole('cashier');}} className="w-full bg-ui-bg text-ui-text p-4 rounded-2xl font-bold hover:bg-ui-border mt-2">Cancel Edit</button>}
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
`;

// Insert it right before `{activeTab === 'backup' && (`
code = code.replace("{activeTab === 'backup' && (", missingTabs + "\n          {activeTab === 'backup' && (");

// Remove the duplicated print blocks completely, leaving only the one PrintLayoutSettings
const p1 = `          {activeTab === 'print' && (
            <div className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm">
              <div className="w-12 h-12 bg-ui-bg rounded-2xl flex items-center justify-center text-brand-primary mb-6"><Printer size={24}/></div>
              <h2 className="text-xl font-bold mb-2 text-ui-text">Advanced Print & Thermal Layout</h2>`;

const badBlockRegex = /\{activeTab === 'print' && \([\s\S]*?Save Print Layout<\/button>\n            <\/div>\n          \)\}/g;
code = code.replace(badBlockRegex, '');

// Re-add the proper PrintLayoutSettings block if it was removed
if (!code.includes('<PrintLayoutSettings />')) {
  code = code.replace("{activeTab === 'backup' && (", "{activeTab === 'print' && (\n            <div className=\"mt-4\">\n              <PrintLayoutSettings />\n            </div>\n          )}\n\n          {activeTab === 'backup' && (");
}

fs.writeFileSync('src/pages/Settings.jsx', code);

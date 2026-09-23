const fs = require('fs');
let code = fs.readFileSync('src/pages/Inventory.jsx', 'utf-8');

if (!code.includes("useAuthStore")) {
  code = code.replace(
    "import { format } from 'date-fns';",
    "import { format } from 'date-fns';\nimport { useAuthStore } from '../store/useAuthStore';"
  );
  
  code = code.replace(
    "const [auditQuantities, setAuditQuantities] = useState({});",
    "const [auditQuantities, setAuditQuantities] = useState({});\n  const user = useAuthStore(state => state.user);\n  const canEdit = user?.role === 'owner' || user?.permissions?.includes('inventory_edit');"
  );
  
  // Hide Add Item Form
  code = code.replace(
    /<div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm col-span-1 md:col-span-1 h-fit">[\s\S]*?<\/div>\n      <\/div>/,
    `{canEdit && (<div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm col-span-1 md:col-span-1 h-fit">
            <h2 className="text-xl font-bold mb-6 text-ui-text">Add Item</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Item Name</label>
                <input type="text" required value={newItemName} onChange={e=>setNewItemName(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
              </div>
              <div className="flex gap-4">
                <div className="flex-[2]">
                  <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Min Stock Alert</label>
                  <input type="number" required min="0" step="0.01" value={minStock} onChange={e=>setMinStock(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Unit</label>
                  <select value={unit} onChange={e=>setUnit(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text">
                    <option value="L">L</option><option value="KG">KG</option><option value="PCS">PCS</option><option value="PKT">PKT</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all mt-4">Add Item</button>
            </form>
          </div>)}
      </div>`
  );
  
  // Disable Adjust buttons and Save Audit button
  code = code.replace(/<button onClick=\{\(\) => handleAdjust/g, "{canEdit && <button onClick={() => handleAdjust");
  code = code.replace(/<Minus size=\{16\}\/><\/button>/g, "<Minus size={16}/></button>}");
  code = code.replace(/<Plus size=\{16\}\/><\/button>/g, "<Plus size={16}/></button>}");
  
  code = code.replace(
    /<button onClick=\{saveAudit\} disabled=\{Object\.keys\(auditQuantities\)\.length === 0\}/,
    "{canEdit && <button onClick={saveAudit} disabled={Object.keys(auditQuantities).length === 0}"
  );
  code = code.replace(
    />Save Audit & Sync Stock<\/button>/,
    ">Save Audit & Sync Stock</button>}"
  );
  
  code = code.replace(
    /onChange=\{\(e\) => handleAuditInput/g,
    "disabled={!canEdit} onChange={(e) => handleAuditInput"
  );
}

fs.writeFileSync('src/pages/Inventory.jsx', code);

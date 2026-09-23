const fs = require('fs');
let settings = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

// Remove states from Settings
settings = settings.replace(/const \[syncFolder, setSyncFolder\] = useState\(null\);[\s\S]*?const disconnectSyncFolder = async \(\) => \{[\s\S]*?setSyncFolder\(null\);\n  \};/m, '');

// Restore Backup UI
const oldBackupUi = `
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
`;

const startIdx = settings.indexOf(`{activeTab === 'backup' && (`);
const endIdx = settings.indexOf(`</div>\n      </div>\n    </div>\n  );\n}`);
if (startIdx !== -1 && endIdx !== -1) {
  const toReplace = settings.substring(startIdx, endIdx);
  settings = settings.replace(toReplace, oldBackupUi.trim() + '\n        ');
  fs.writeFileSync('src/pages/Settings.jsx', settings);
}

// Remove autoBackup from Dashboard.jsx
let dashboard = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');
dashboard = dashboard.replace(/const runAutoBackup = async \(\) => \{[\s\S]*?console\.error\("Auto backup failed to sync:", e\);\n    \}\n  \};/m, '');
dashboard = dashboard.replace(/await runAutoBackup\(\);\n/g, '');
dashboard = dashboard.replace(/await runAutoBackup\(\);/g, '');

fs.writeFileSync('src/pages/Dashboard.jsx', dashboard);
console.log("Removed Google Drive Sync");

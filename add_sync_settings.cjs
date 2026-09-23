const fs = require('fs');

let file = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

const syncStateStr = `
  const [syncFolder, setSyncFolder] = useState(null);

  useEffect(() => {
    db.settings.get('sync_folder').then(res => {
      if (res && res.name) setSyncFolder(res.name);
    });
  }, []);

  const connectSyncFolder = async () => {
    try {
      if (!window.showDirectoryPicker) {
        alert("Your browser does not support the File System Access API. Please use Chrome or Edge on Desktop.");
        return;
      }
      const dirHandle = await window.showDirectoryPicker({
        id: 'pos-backup-sync',
        mode: 'readwrite',
      });
      await db.settings.put({ id: 'sync_folder', handle: dirHandle, name: dirHandle.name });
      setSyncFolder(dirHandle.name);
      alert("Folder connected! End of shift backups will be saved automatically.");
    } catch(e) {
      console.log("Folder selection cancelled or failed", e);
    }
  };

  const disconnectSyncFolder = async () => {
    await db.settings.delete('sync_folder');
    setSyncFolder(null);
  };
`;

// Insert the state before the export function ends or near other states
const usersQueryLine = `const users = useLiveQuery(() => db.users.toArray()) || [];`;
file = file.replace(usersQueryLine, usersQueryLine + '\n' + syncStateStr);

// Update Backup Tab UI
const oldBackupTab = `
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

const newBackupTab = `
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="w-12 h-12 bg-ui-bg rounded-2xl flex items-center justify-center text-ui-muted mb-4"><Cloud size={24}/></div>
                    <h2 className="text-xl font-bold mb-1 text-ui-text">Google Drive Sync</h2>
                    <p className="text-sm font-medium text-ui-muted max-w-sm">Automatically sync a complete backup file to your Google Drive Desktop folder at the end of every shift.</p>
                  </div>
                  {syncFolder && <div className="bg-brand-accent/10 text-brand-accent px-3 py-1 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-accent"></span> Connected</div>}
                </div>
                
                <div className="bg-ui-bg p-4 rounded-2xl border border-ui-border mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-ui-text text-sm mb-1">Target Sync Folder</p>
                      <p className="text-xs text-ui-muted font-medium">{syncFolder ? syncFolder : 'Not connected to any folder.'}</p>
                    </div>
                    {syncFolder ? (
                      <button onClick={disconnectSyncFolder} className="text-brand-danger font-bold text-sm bg-brand-danger/10 px-4 py-2 rounded-xl hover:bg-brand-danger/20 transition-colors">Disconnect</button>
                    ) : (
                      <button onClick={connectSyncFolder} className="text-brand-primary font-bold text-sm bg-brand-primary/10 px-4 py-2 rounded-xl hover:bg-brand-primary/20 transition-colors">Connect Folder</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm">
                <h2 className="text-lg font-bold mb-4 text-ui-text">Manual Backup</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={downloadBackup} className="flex-1 bg-ui-text text-ui-bg p-4 rounded-2xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                    <Download size={20} /> Export Backup
                  </button>
                  <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleRestore} />
                  <button onClick={() => fileInputRef.current.click()} className="flex-1 bg-ui-bg text-ui-text border border-ui-border p-4 rounded-2xl font-bold hover:bg-ui-border active:scale-95 transition-all flex items-center justify-center gap-2">
                    <Upload size={20} /> Restore
                  </button>
                </div>
              </div>
            </div>
          )}
`;

const startIdx = file.indexOf(`{activeTab === 'backup' && (`);
const endIdx = file.indexOf(`</div>\n      </div>\n    </div>\n  );\n}`);
if (startIdx !== -1 && endIdx !== -1) {
  const toReplace = file.substring(startIdx, endIdx);
  file = file.replace(toReplace, newBackupTab + '        ');
  fs.writeFileSync('src/pages/Settings.jsx', file);
  console.log("Settings.jsx updated successfully.");
} else {
  console.log("Could not replace Backup tab. startIdx:", startIdx, "endIdx:", endIdx);
}

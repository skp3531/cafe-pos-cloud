const fs = require('fs');
let file = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

const autoBackupFn = `
  const runAutoBackup = async () => {
    try {
      const driveSettings = await db.settings.get('sync_folder');
      if (driveSettings && driveSettings.handle) {
        const handle = driveSettings.handle;
        
        // Check permission without prompting first (if possible in this context)
        const options = { mode: 'readwrite' };
        if ((await handle.queryPermission(options)) !== 'granted') {
          // It might fail to request without a direct user gesture, but handleDayClose IS a user gesture!
          await handle.requestPermission(options); 
        }

        const data = {
           categories: await db.categories.toArray(), 
           items: await db.items.toArray(), 
           sales: await db.sales.toArray(), 
           inventory: await db.inventory.toArray(), 
           expenses: await db.expenses.toArray(), 
           customers: await db.customers.toArray(), 
           purchases: await db.purchases.toArray(), 
           suppliers: await db.suppliers.toArray(),
           day_closing: await db.day_closing.toArray()
        };
        
        const fileName = \`pos_backup_\${new Date().toISOString().split('T')[0]}.json\`;
        const fileHandle = await handle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data));
        await writable.close();
        console.log("Auto-backup synced successfully.");
      }
    } catch(e) {
       console.error("Auto backup failed to sync:", e);
    }
  };
`;

const handleDayCloseRegex = /await db\.day_closing\.add\(reportData\);/;
file = file.replace(handleDayCloseRegex, `await db.day_closing.add(reportData);\n    await runAutoBackup();`);

// Inject autoBackupFn before handleDayClose
file = file.replace('const handleDayClose = async () => {', autoBackupFn.trim() + '\n\n  const handleDayClose = async () => {');

fs.writeFileSync('src/pages/Dashboard.jsx', file);
console.log("Dashboard.jsx updated successfully.");

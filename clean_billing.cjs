const fs = require('fs');

let code = fs.readFileSync('src/pages/Billing.jsx', 'utf-8');

// Completely remove any reference to isDbReady or Loading Shift Data if any exist
code = code.replace(/const isLoadingShift = activeShift === undefined;\n\s*if \(isLoadingShift\) \{\n\s*\/\/[^\n]*\n\s*\}/g, "");
code = code.replace(/const \[isDbReady, setIsDbReady\] = useState\(false\);\n\s*useEffect\(\(\) => \{ const t = setTimeout\(\(\) => setIsDbReady\(true\), 1000\); return \(\) => clearTimeout\(t\); \}, \[\]\);\n/g, "");

// Ensure activeShift handles undefined cleanly
code = code.replace(
  "const activeShift = useLiveQuery(async () => {\n    try { return db.shifts ? await db.shifts.where('status').equals('active').first() : null; } catch (e) { return null; }\n  });",
  "const activeShift = useLiveQuery(async () => {\n    try { return db.shifts ? await db.shifts.where('status').equals('active').first() : null; } catch (e) { return null; }\n  }) || null;"
);

fs.writeFileSync('src/pages/Billing.jsx', code);

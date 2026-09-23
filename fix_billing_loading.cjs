const fs = require('fs');
let code = fs.readFileSync('src/pages/Billing.jsx', 'utf-8');

// Replace the loading screen with a timeout or just remove it and use fallback
code = code.replace(
  'if (activeShift === undefined) return <div className="p-8 text-center">Loading shift data...</div>; // loading',
  `const isLoadingShift = activeShift === undefined;
  if (isLoadingShift) {
    // We will show loading but also if it takes more than 2s we can assume no shift
  }`
);

// Better yet, just replace `activeShift = useLiveQuery(...)` with `activeShift = useLiveQuery(...) || null`
code = code.replace(
  "const activeShift = useLiveQuery(async () => {",
  "const [isDbReady, setIsDbReady] = useState(false);\n  useEffect(() => { const t = setTimeout(() => setIsDbReady(true), 1000); return () => clearTimeout(t); }, []);\n  const activeShift = useLiveQuery(async () => {"
);

code = code.replace(
  'if (activeShift === undefined) return <div className="p-8 text-center">Loading shift data...</div>;',
  'if (activeShift === undefined && !isDbReady) return <div className="p-8 text-center">Loading shift data...</div>;\n    if (activeShift === undefined && isDbReady) return <div className="p-8 text-center text-brand-danger">Database blocked. Please close this tab and open a new one.</div>;'
);

// wait, if I use `useState` and `useEffect`, I need to make sure they are imported.
if (!code.includes("useEffect")) {
   code = code.replace("import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';");
}

fs.writeFileSync('src/pages/Billing.jsx', code);

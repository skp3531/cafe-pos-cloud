const fs = require('fs');

let code = fs.readFileSync('src/pages/Dashboard.jsx', 'utf-8');

// The user is from useAuthStore. Let's make sure useAuthStore is imported.
if (!code.includes("useAuthStore")) {
  code = code.replace(
    "import React, { useState } from 'react';",
    "import React, { useState } from 'react';\nimport { useAuthStore } from '../store/useAuthStore';"
  );
  code = code.replace(
    "export default function Dashboard() {",
    "export default function Dashboard() {\n  const user = useAuthStore(state => state.user);"
  );
}

// In the End Shift Modal, hide expected and difference if role !== 'owner'
const oldEndShiftUI = `<div className="flex justify-between text-ui-text font-bold"><span>Expected Cash:</span><span>₹{expected}</span></div>`;
const newEndShiftUI = `{user?.role === 'owner' ? <div className="flex justify-between text-ui-text font-bold"><span>Expected Cash:</span><span>₹{expected}</span></div> : <div className="flex justify-between text-brand-primary font-bold"><span>Expected Cash:</span><span>HIDDEN (Blind Close)</span></div>}`;

code = code.replace(oldEndShiftUI, newEndShiftUI);

const oldDiffUI = `                {actualCash !== '' && (
                  <div className={\`flex justify-between font-bold \${color}\`}>
                    <span>Difference:</span>
                    <span>{diff > 0 ? '+' : ''}₹{diff.toFixed(2)}</span>
                  </div>
                )}`;
const newDiffUI = `                {actualCash !== '' && user?.role === 'owner' && (
                  <div className={\`flex justify-between font-bold \${color}\`}>
                    <span>Difference:</span>
                    <span>{diff > 0 ? '+' : ''}₹{diff.toFixed(2)}</span>
                  </div>
                )}`;
code = code.replace(oldDiffUI, newDiffUI);

fs.writeFileSync('src/pages/Dashboard.jsx', code);

const fs = require('fs');

let file = fs.readFileSync('src/pages/Billing.jsx', 'utf8');

// Load printData
if (!file.includes('const printSettings = useLiveQuery')) {
  file = file.replace(
    `const profileSettings = useLiveQuery(() => db.settings.get('profile')) || {};`,
    `const profileSettings = useLiveQuery(() => db.settings.get('profile')) || {};\n  const printSettings = useLiveQuery(() => db.settings.get('print')) || {};`
  );
}

// Update the print style in Billing.jsx
file = file.replace(
  `body{font-family:monospace;width:300px;margin:0 auto;padding:16px;text-align:center;color:#000;font-size:13px}`,
  `body{font-family:monospace;width:\${printSettings.paperWidth || '300px'};margin:0 auto;padding:16px;text-align:center;color:#000;font-size:\${printSettings.fontSize || '13px'}}`
);

// Update header and footer in Billing.jsx
file = file.replace(
  `<h2>\${profileSettings.name || 'Shake Sphere Cafe'}</h2>`,
  `\${printSettings.showHeader !== false ? \`<h2>\${profileSettings.name || 'Shake Sphere Cafe'}</h2>\` : ''}`
);
file = file.replace(
  `<p>\${profileSettings.address || ''}</p>`,
  `\${printSettings.showHeader !== false ? \`<p>\${profileSettings.address || ''}</p>\` : ''}`
);
file = file.replace(
  `<p>\${profileSettings.phone ? 'Ph: ' + profileSettings.phone : ''}</p>`,
  `\${printSettings.showHeader !== false ? \`<p>\${profileSettings.phone ? 'Ph: ' + profileSettings.phone : ''}</p>\` : ''}`
);
file = file.replace(
  `\${profileSettings.gstin ? \`<p>GSTIN: \${profileSettings.gstin}</p>\` : ''}`,
  `\${printSettings.showHeader !== false && profileSettings.gstin ? \`<p>GSTIN: \${profileSettings.gstin}</p>\` : ''}`
);
file = file.replace(
  `<p>\${profileSettings.footer || 'Thank you! Visit again.'}</p>`,
  `\${printSettings.showFooter !== false ? \`<p>\${profileSettings.footer || 'Thank you! Visit again.'}</p>\` : ''}`
);

fs.writeFileSync('src/pages/Billing.jsx', file);

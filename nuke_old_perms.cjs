const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.jsx', 'utf-8');

const regex = /const PERMISSION_GROUPS = \[\s*\{ group: 'Core'[\s\S]*?\]\}\s*\];/;
code = code.replace(regex, '');

// Also remove `const togglePermission` just in case it's there
code = code.replace(/const togglePermission = \([\s\S]*?\};\n/, '');

fs.writeFileSync('src/pages/Settings.jsx', code);

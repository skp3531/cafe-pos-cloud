const fs = require('fs');
let file = fs.readFileSync('src/pages/Billing.jsx', 'utf8');

// The image size in Billing.jsx is currently h-16
file = file.replace(/className="w-full h-16/g, 'className="w-full h-24');
file = file.replace(/className="w-full h-16/g, 'className="w-full h-24'); // In case there are multiple
// Wait, I did a global replace for h-16 earlier.
// What about the placeholder div?
file = file.replace(
  /<div className="w-full h-16 bg-ui-bg flex items-center justify-center text-3xl font-black text-ui-muted\/30">/g,
  `<div className="w-full h-24 bg-ui-bg flex items-center justify-center text-3xl font-black text-ui-muted/30">`
);

// Also change grid cols to be a bit wider if they want them larger
file = file.replace(
  `className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"`,
  `className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4"`
);

fs.writeFileSync('src/pages/Billing.jsx', file);

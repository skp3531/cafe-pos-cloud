const fs = require('fs');

let file = fs.readFileSync('src/pages/Menu.jsx', 'utf8');

// Fix the main layout structure
file = file.replace(
  `className="grid grid-cols-1 lg:grid-cols-3 gap-8"`,
  `className="w-full"`
);
file = file.replace(
  `className="lg:col-span-2 flex flex-col h-fit"`,
  `className="w-full flex flex-col h-fit"`
);
file = file.replace(
  `className="grid grid-cols-1 sm:grid-cols-2 gap-4"`,
  `className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"`
);

// Fix the image height in Menu.jsx
file = file.replace(/h-32/g, 'h-16');

fs.writeFileSync('src/pages/Menu.jsx', file);

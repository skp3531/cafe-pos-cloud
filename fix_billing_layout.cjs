const fs = require('fs');

let file = fs.readFileSync('src/pages/Billing.jsx', 'utf8');

// Replace the inner cart panel classes to prevent absolute overlapping on desktop
// Original: className={clsx("absolute right-0 bottom-0 top-0 w-full sm:w-[400px] bg-ui-card border-l border-ui-border shadow-2xl md:shadow-none flex flex-col transition-transform duration-300 md:transform-none z-50", isCartOpen ? "translate-x-0" : "translate-x-full")}
file = file.replace(
  `"absolute right-0 bottom-0 top-0 w-full sm:w-[400px] bg-ui-card border-l border-ui-border shadow-2xl md:shadow-none flex flex-col transition-transform duration-300 md:transform-none z-50"`,
  `"absolute md:relative right-0 bottom-0 top-0 w-full sm:w-[400px] bg-ui-card border-l border-ui-border shadow-2xl md:shadow-none flex flex-col transition-transform duration-300 md:transform-none z-50 md:flex-shrink-0 h-full"`
);

// We also need to ensure the grid items use h-16
file = file.replace(/h-24/g, 'h-16');

fs.writeFileSync('src/pages/Billing.jsx', file);

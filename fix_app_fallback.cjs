const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf-8');

c = c.replace(
  "const fallback = firstPerm.split('_')[0];",
  ""
);
c = c.replace(
  "return <Navigate to={`/${fallback === 'dashboard' ? '' : fallback}`} replace />;",
  "return <Navigate to={user.role === 'cashier' ? '/billing' : '/'} replace />;"
);

fs.writeFileSync('src/App.jsx', c);

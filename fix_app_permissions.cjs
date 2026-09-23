const fs = require('fs');

let file = fs.readFileSync('src/App.jsx', 'utf8');

// Update ProtectedRoute to check permissions instead of just roles
const protectedRoute = `
function ProtectedRoute({ children, perm }) {
  const user = useAuthStore(state => state.user);
  if (!user) return <Navigate to="/login" replace />;
  
  if (user.role === 'owner') return children;
  
  const hasPerm = user.permissions?.includes(perm) || (!user.permissions && ['billing', 'orders', 'customers'].includes(perm));
  
  if (!hasPerm) {
    const fallback = user.permissions?.[0] || 'billing';
    return <Navigate to={\`/\${fallback === 'dashboard' ? '' : fallback}\`} replace />;
  }
  
  return children;
}
`;

file = file.replace(/function ProtectedRoute\([\s\S]*?return children;\n\}/, protectedRoute.trim());

// Now replace all allowedRoles={['...']} with perm="..."
file = file.replace(/allowedRoles=\{\['owner'\]\}/g, ''); // We'll manually fix the mapping below
file = file.replace(/allowedRoles=\{\['owner', 'cashier'\]\}/g, '');

file = file.replace(/<ProtectedRoute >\s*<Dashboard \/>\s*<\/ProtectedRoute>/g, '<ProtectedRoute perm="dashboard"><Dashboard /></ProtectedRoute>');
file = file.replace(/<ProtectedRoute >\s*<Billing \/>\s*<\/ProtectedRoute>/g, '<ProtectedRoute perm="billing"><Billing /></ProtectedRoute>');
file = file.replace(/<ProtectedRoute >\s*<Orders \/>\s*<\/ProtectedRoute>/g, '<ProtectedRoute perm="orders"><Orders /></ProtectedRoute>');
file = file.replace(/<ProtectedRoute >\s*<Menu \/>\s*<\/ProtectedRoute>/g, '<ProtectedRoute perm="menu"><Menu /></ProtectedRoute>');
file = file.replace(/<ProtectedRoute >\s*<Inventory \/>\s*<\/ProtectedRoute>/g, '<ProtectedRoute perm="inventory"><Inventory /></ProtectedRoute>');
file = file.replace(/<ProtectedRoute >\s*<Purchase \/>\s*<\/ProtectedRoute>/g, '<ProtectedRoute perm="purchase"><Purchase /></ProtectedRoute>');
file = file.replace(/<ProtectedRoute >\s*<Customers \/>\s*<\/ProtectedRoute>/g, '<ProtectedRoute perm="customers"><Customers /></ProtectedRoute>');
file = file.replace(/<ProtectedRoute >\s*<Expenses \/>\s*<\/ProtectedRoute>/g, '<ProtectedRoute perm="expenses"><Expenses /></ProtectedRoute>');
file = file.replace(/<ProtectedRoute >\s*<Reports \/>\s*<\/ProtectedRoute>/g, '<ProtectedRoute perm="reports"><Reports /></ProtectedRoute>');
file = file.replace(/<ProtectedRoute >\s*<Settings \/>\s*<\/ProtectedRoute>/g, '<ProtectedRoute perm="settings"><Settings /></ProtectedRoute>');


fs.writeFileSync('src/App.jsx', file);

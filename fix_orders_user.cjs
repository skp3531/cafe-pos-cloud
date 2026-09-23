const fs = require('fs');
let file = fs.readFileSync('src/pages/Orders.jsx', 'utf8');

// I added const { user } = useAuthStore();
// Remove it, and move the one at line 104 to the top
file = file.replace(/const { user } = useAuthStore\(\);\n/, '');
file = file.replace(/const user = useAuthStore\(state => state\.user\);/g, '');

// Now insert it cleanly at the top of Orders
file = file.replace(
  `const navigate = useNavigate();`,
  `const navigate = useNavigate();\n  const user = useAuthStore(state => state.user);`
);

fs.writeFileSync('src/pages/Orders.jsx', file);

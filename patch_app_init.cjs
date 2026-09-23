const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf-8');

if (!c.includes('useDataStore')) {
    c = c.replace(
      "import { useAuthStore } from './store/useAuthStore';",
      "import { useAuthStore } from './store/useAuthStore';\nimport useDataStore from './store/useDataStore';\nimport { useEffect } from 'react';"
    );
    
    c = c.replace(
      "function App() {",
      "function App() {\n  useEffect(() => {\n    const unsub = useDataStore.getState().initSync();\n    return () => unsub();\n  }, []);\n"
    );
    fs.writeFileSync('src/App.jsx', c);
}

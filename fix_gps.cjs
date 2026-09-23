const fs = require('fs');
let code = fs.readFileSync('src/pages/Employees.jsx', 'utf-8');

// I will just find `setCheckInLoading(false);\n    });` and replace it with the error callback
code = code.replace(
  "      setCheckInLoading(false);\n    });",
  "      setCheckInLoading(false);\n    }, (error) => {\n      console.error(error);\n      alert('GPS Error: ' + error.message + '\\nPlease ensure location permissions are granted in your browser.');\n      setCheckInLoading(false);\n    }, { timeout: 10000 });"
);

fs.writeFileSync('src/pages/Employees.jsx', code);

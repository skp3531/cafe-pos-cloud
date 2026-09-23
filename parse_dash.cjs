const acorn = require('acorn');
const jsx = require('acorn-jsx');
const fs = require('fs');
const Parser = acorn.Parser.extend(jsx());
try {
  Parser.parse(fs.readFileSync('src/pages/Dashboard.jsx', 'utf-8'), { sourceType: 'module', ecmaVersion: 2020 });
  console.log("Dash OK");
} catch(e) { console.error("Dash Error:", e); }

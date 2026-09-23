const acorn = require('acorn');
const jsx = require('acorn-jsx');
const fs = require('fs');

const Parser = acorn.Parser.extend(jsx());
const code = fs.readFileSync('src/pages/Billing.jsx', 'utf-8');

try {
  Parser.parse(code, { sourceType: 'module', ecmaVersion: 2020 });
  console.log("OK");
} catch (e) {
  console.error("Syntax Error at line " + e.loc.line + " col " + e.loc.column + ": " + e.message);
}

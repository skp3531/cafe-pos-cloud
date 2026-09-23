const fs = require('fs');
let code = fs.readFileSync('src/db/db.js', 'utf-8');

const oldFunc = `export const generateInvoiceNumber = async () => {
  const profile = await db.settings.get('profile');
  const prefix = profile?.terminalId || 'T1';
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = await db.sales.where('date').aboveOrEqual(todayStart.toISOString()).count();
  const seq = String(todayCount + 1).padStart(4, '0');
  return \`\${prefix}-\${dateStr}-\${seq}\`;
};`;

const newFunc = `export const generateInvoiceNumber = async () => {
  const profile = await db.settings.get('profile');
  const printSettings = await db.settings.get('print');
  const prefix = profile?.terminalId || 'T1';
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = await db.sales.where('date').aboveOrEqual(todayStart.toISOString()).count();
  const seq = String(todayCount + 1).padStart(4, '0');
  
  const format = printSettings?.invoiceFormat || 'standard';
  if (format === 'short') return \`\${prefix}-\${seq}\`;
  if (format === 'minimal') return \`\${seq}\`;
  return \`\${prefix}-\${dateStr}-\${seq}\`;
};`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/db/db.js', code);

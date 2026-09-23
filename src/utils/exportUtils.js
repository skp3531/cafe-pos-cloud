export const exportToCSV = (filename, rows) => {
  const csvContent = rows.map(e => e.map(item => `"${(item || '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const printReportPDF = (title, headers, rows) => {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  
  const headerHtml = headers.map(h => `<th>${h}</th>`).join('');
  const rowsHtml = rows.map(r => `<tr>${r.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>`).join('');

  const content = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #111827; }
          h1 { text-align: center; margin-bottom: 20px; font-size: 24px; }
          table { w-full; width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 14px; }
          th { background-color: #f9fafb; font-weight: 600; }
          .date { text-align: right; font-size: 12px; color: #6b7280; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="date">Generated on: ${new Date().toLocaleString('en-IN')}</div>
        <table>
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
    </html>
  `;
  
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(content);
  doc.close();
  
  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => { document.body.removeChild(iframe); }, 2000);
  }, 250);
};

const fs = require('fs');
let code = fs.readFileSync('src/pages/Billing.jsx', 'utf-8');

if (!code.includes('const canDiscount')) {
  code = code.replace(
    "const activeShift = useLiveQuery",
    "const canDiscount = user?.role === 'owner' || user?.permissions?.includes('billing_discount');\n  const canHold = user?.role === 'owner' || user?.permissions?.includes('billing_hold');\n  const canSplit = user?.role === 'owner' || user?.permissions?.includes('billing_split');\n  const canDelete = user?.role === 'owner' || user?.permissions?.includes('billing_delete_item');\n  const activeShift = useLiveQuery"
  );
  
  // discount button
  code = code.replace(
    "<button onClick={() => setDiscount(5)}",
    "{canDiscount && <button onClick={() => setDiscount(5)}"
  ).replace(
    "% Disc</button>",
    "% Disc</button>}"
  );

  // hold button
  code = code.replace(
    "<button disabled={cart.length===0} onClick={handleHoldBill}",
    "{canHold && <button disabled={cart.length===0} onClick={handleHoldBill}"
  ).replace(
    "Hold</button>",
    "Hold</button>}"
  );

  // split button
  code = code.replace(
    "<button disabled={cart.length===0} onClick={() => setIsSplitOpen(true)}",
    "{canSplit && <button disabled={cart.length===0} onClick={() => setIsSplitOpen(true)}"
  ).replace(
    "Split</button>",
    "Split</button>}"
  );
  
  // cart item delete button
  code = code.replace(
    "<button onClick={() => updateCart(c.id, 0)}",
    "{canDelete && <button onClick={() => updateCart(c.id, 0)}"
  ).replace(
    "<Trash2 size={16} /></button>",
    "<Trash2 size={16} /></button>}"
  );

  fs.writeFileSync('src/pages/Billing.jsx', code);
}


import logo from "../assets/jjs.png";
import qrcodeImg from "../assets/qrcode.png";

export function exportInvoiceToPDF(invoice) {
    const fmt = (n) => "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const subtotal = invoice.items.reduce((sum, item) => sum + (item.qty * (item.unitPrice + (item.addOnPrice || 0))), 0);
    const tax = invoice.taxRate ? subtotal * invoice.taxRate : 0;
    const discount = invoice.discount?.amount || 0;
    const total = subtotal + tax - discount;

    const itemRows = invoice.items.map((item, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>
                <div style="font-weight:700;color:#1e293b">${item.description}</div>
                ${item.size ? `<div style="font-size:9px;color:#64748b;margin-top:2px">SIZE: ${item.size}</div>` : ''}
                ${item.addOn && item.addOn !== 'None' ? `<div style="font-size:9px;color:#3b82f6;font-weight:700;margin-top:2px">${item.addOn.toUpperCase()}</div>` : ''}
                ${item.notes ? `<div style="font-size:9px;color:#94a3b8;margin-top:2px">${item.notes}</div>` : ''}
            </td>
            <td style="text-align:center"><span style="font-size:9px;padding:2px 6px;background:#f1f5f9;border-radius:4px;color:#475569;font-weight:700">${item.type.toUpperCase()}</span></td>
            <td style="text-align:center">${item.qty}</td>
            <td style="text-align:right">
                ${fmt(item.unitPrice)}
                ${item.addOnPrice > 0 ? `<div style="font-size:9px;color:#94a3b8">+ ${fmt(item.addOnPrice)}</div>` : ''}
            </td>
            <td style="text-align:right;font-weight:700;color:#0f172a">${fmt(item.qty * (item.unitPrice + (item.addOnPrice || 0)))}</td>
        </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8"/>
    <title>Invoice ${invoice.referenceId}</title>
    <style>
        @page { size: A4; margin: 0; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #fff; }
        .receipt-card { max-width: 800px; margin: 0 auto; background: #fff; position: relative; }
        
        .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 1px solid #f1f5f9; padding-bottom: 30px; }
        .brand { display: flex; align-items: center; gap: 15px; }
        .brand img { width: 70px; height: auto; }
        .brand-info h1 { font-size: 20px; font-weight: 800; margin: 0; color: #0f172a; }
        .brand-info p { font-size: 11px; color: #64748b; margin: 2px 0; }
        
        .invoice-meta { text-align: right; }
        .invoice-label { font-size: 32px; font-weight: 900; color: #f1f5f9; text-transform: uppercase; margin: 0; line-height: 1; }
        .meta-grid { margin-top: 15px; display: grid; gap: 4px; font-size: 12px; }
        .meta-item { display: flex; justify-content: flex-end; gap: 20px; }
        .meta-label { color: #94a3b8; width: 80px; }
        .meta-value { font-weight: 700; color: #334155; }
        .status-badge { display: inline-block; padding: 4px 12px;; font-size: 10px; font-weight: 800; margin-top: 10px; text-transform: uppercase; }
        .status-paid { color: #059669; }
        
        .billing-qr { display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; margin-bottom: 40px; }
        .bill-box { padding: 20px; border-radius: 16px; }
        .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em; margin-bottom: 12px; }
        .bill-name { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
        .bill-detail { font-size: 12px; color: #64748b; line-height: 1.5; }
        
        .qr-box { padding: 20px; border-radius: 16px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .qr-img { width: 100px; height: 100px; background: #fff; padding: 6px; border-radius: 8px; margin-bottom: 8px; }
        .qr-ref { font-family: monospace; font-size: 11px; color: #94a3b8; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { padding: 12px 15px; text-align: left; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #000000 ; border: 1px solid #0f172a; }
        th:first-child { border-radius: 8px 0 0 8px; }
        th:last-child { border-radius: 0 8px 8px 0; }
        td { padding: 16px 15px; border-bottom: 1px solid #f1f5f9; font-size: 12px; vertical-align: top; }
        
        .totals-area { display: flex; justify-content: flex-end; margin-bottom: 50px; }
        .totals-box { width: 280px; }
        .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
        .total-label { color: #64748b; }
        .total-val { font-weight: 700; color: #2b2b2bff; }
        .grand-total { outline: 1px solid #0f172a; border-radius: 12px; padding: 15px; color: #000000; margin-top: 15px; display: flex; justify-content: space-between; align-items: center; }
        .gt-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #000000ff; }
        .gt-val { font-size: 20px; font-weight: 900;}
        
        .footer { border-top: 1px solid #f1f5f9; padding-top: 30px; display: flex; justify-content: space-between; align-items: start; }
        .thanks { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
        .terms { font-size: 11px; color: #94a3b8; max-width: 350px; line-height: 1.6; }
        .contact-info { text-align: right; font-size: 11px; color: #64748b; line-height: 1.6; }
        .contact-email { color: #3b82f6; font-weight: 600; }
    </style>
</head>
<body>
    <div class="receipt-card">
        
        <div class="header">
            <div class="brand">
                <img src="${logo}" alt="Logo"/>
                <div class="brand-info">
                    <h1>JJS Track</h1>
                    <p>Jennoel-Jennyl SportsweaR</p>
                    <p>Purok 3B National Highway, Calapacuan, Subic</p>
                    <p>0908 997 2332</p>
                </div>
            </div>
            <div class="invoice-meta">
                <h2 class="invoice-label">Invoice</h2>
                <div class="meta-grid">
                    <div class="meta-item"><span class="meta-label">ID:</span><span class="meta-value">${invoice.referenceId}</span></div>
                    <div class="meta-item"><span class="meta-label">Date:</span><span class="meta-value">${invoice.date}</span></div>
                    <div class="meta-item"><span class="meta-label">Due Date:</span><span class="meta-value">${invoice.dueDate}</span></div>
                </div>
                <div class="status-badge ${invoice.status === 'Paid' ? 'status-paid' : ''}">
                    ${invoice.status}
                </div>
            </div>
        </div>

        <div class="billing-qr">
            <div class="bill-box">
                <div class="section-title">Bill To</div>
                <div class="bill-name">${invoice.billTo.name}</div>
                <div class="bill-detail">${invoice.billTo.address}</div>
                <div class="bill-detail">${invoice.billTo.city}</div>
                <div class="bill-detail" style="margin-top:8px">${invoice.billTo.phone}</div>
                <div class="bill-detail contact-email">${invoice.billTo.email}</div>
            </div>
            <div class="qr-box">
                <img src="${qrcodeImg}" class="qr-img" alt="QR"/>
                <div class="qr-ref">${invoice.referenceId}</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width:40px">#</th>
                    <th>Description</th>
                    <th style="text-align:center">Type</th>
                    <th style="text-align:center">Qty</th>
                    <th style="text-align:right">Unit Price</th>
                    <th style="text-align:right">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${itemRows}
            </tbody>
        </table>

        <div class="totals-area">
            <div class="totals-box">
                <div class="total-row">
                    <span class="total-label">Subtotal</span>
                    <span class="total-val">${fmt(subtotal)}</span>
                </div>
                ${tax > 0 ? `
                <div class="total-row">
                    <span class="total-label">Tax</span>
                    <span class="total-val">${fmt(tax)}</span>
                </div>` : ''}
                ${discount > 0 ? `
                <div class="total-row">
                    <span class="total-label">${invoice.discount?.label || 'Discount'}</span>
                    <span style="color:#dc2626;font-weight:700">- ${fmt(discount)}</span>
                </div>` : ''}
                <div class="grand-total">
                    <span class="gt-label">Total Amount</span>
                    <span class="gt-val">${fmt(total)}</span>
                </div>
            </div>
        </div>

        <div class="footer">
            <div>
                <div class="thanks">Thank you for your business!</div>
                <div class="terms">
                    Payment is due within 14 days. Late payments are subject to a 1.5% monthly fee. 
                    This document serves as an official receipt of transaction.
                </div>
            </div>
            <div class="contact-info">
                <div style="font-weight:700;color:#0f172a">JJS Track</div>
                <div class="contact-email">jjsportswearph@gmail.com</div>
                <div>0908 997 2332</div>
            </div>
        </div>
    </div>
    <script>
        window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
        };
    </script>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
}

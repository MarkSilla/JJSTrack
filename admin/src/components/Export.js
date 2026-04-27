
import logo from "../assets/jjs.png";

const calcOrderTotal = (o) =>
    o.invoice.items.reduce((sum, item) => sum + item.unitPrice * item.qty + (item.addOnPrice || 0), 0);

const fmt = (n) => "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 0 });

const todayLabel = () =>
    new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

export function exportToPDF({ orders, expenseBreakdown, totalExpenses }) {
    const totalAllOrders = orders.reduce((sum, o) => sum + calcOrderTotal(o), 0);

    const badge = (label) => label ?? "—";

    const orderRows = orders.map(o => `
        <tr>
            <td>${o.id}</td>
            <td>${o.item}</td>
            <td>${o.customer}</td>
            <td>${o.date}</td>
            <td>${o.estimatedCompletion ?? "—"}</td>
            <td>${badge(o.serviceType)}</td>
            <td style="font-weight:700">${fmt(calcOrderTotal(o))}</td>
            <td>${badge(o.invoice.status)}</td>
            <td>${badge(o.status)}</td>
        </tr>
    `).join("");

    const expenseRows = expenseBreakdown.map(e => `
        <tr>
            <td>
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;
                    background:${e.color};margin-right:6px;vertical-align:middle">
                </span>
                ${e.name}
            </td>
            <td style="font-weight:700">${e.value}%</td>
            <td>${fmt(Math.round(totalExpenses * e.value / 100))}</td>
        </tr>
    `).join("");
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>JJS-Track Financial Report — ${todayLabel()}</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4;
            margin: 20mm 15mm 25mm 15mm;
            @bottom-left {
                content: "Printed by: JJS admin";
                font-family: 'Roboto', sans-serif;
                font-size: 10px;
                color: #64748b;
                font-weight: 600;
            }
            @bottom-right {
                content: "Page " counter(page) " of " counter(pages);
                font-family: 'Roboto', sans-serif;
                font-size: 10px;
                color: #64748b;
                font-weight: 600;
            }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body        { 
            font-family: 'Roboto', sans-serif; 
            color: #111; 
            background: #fff; 
            padding: 0;
            font-size: 12px; 
        }
        
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        .logo-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .logo-container img {
            height: 35px;
            width: auto;
        }
        .brand-name {
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.5px;
        }
        .header-date {
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
        }

        h1          { font-family: 'Roboto', sans-serif; font-size: 24px; font-weight: 900; color: #0f172a; text-align: center; margin-bottom: 30px; }
        h2          { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 10px; }
        section     { margin-bottom: 35px; }
        table       { width: 100%; border-collapse: collapse; font-size: 11px; }
        thead tr    { background: #f1f5f9; }
        th          { padding: 10px; text-align: left; font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; }
        td          { padding: 10px; border-bottom: 1px solid #f1f5f9; color: #374151; }
        tfoot td    { border-top: 2px solid #e2e8f0; background: #f8fafc; font-weight: 800; color: #1d4ed8; font-size: 13px; padding: 12px 10px; }
        @media print {
            body { padding: 0; }
        }
    </style>
</head>
<body>

    <!-- Header -->
    <div class="page-header">
        <div class="logo-container">
            <img src="${logo}" alt="Logo" />
            <span class="brand-name">JJSportswear</span>
        </div>
        <div class="header-date">
            ${todayLabel()}
        </div>
    </div>

    <h1>JJS-Track Financial Report</h1>

    <!-- Orders -->
    <section>
        <h2>Orders (${orders.length} total)</h2>
        <table>
            <thead>
                <tr>
                    <th>Order ID</th><th>Item</th><th>Customer</th><th>Date</th>
                    <th>Est. Completion</th><th>Service</th><th>Total</th>
                    <th>Invoice</th><th>Status</th>
                </tr>
            </thead>
            <tbody>${orderRows}</tbody>
            <tfoot>
                <tr>
                    <td colspan="6">Grand Total (All Orders)</td>
                    <td>${fmt(totalAllOrders)}</td>
                    <td colspan="2"></td>
                </tr>
            </tfoot>
        </table>
    </section>

    <!-- Expense Breakdown -->
    <section>
        <h2>Expense Breakdown — ${fmt(totalExpenses)} total</h2>
        <table>
            <thead>
                <tr><th>Category</th><th>Share</th><th>Amount</th></tr>
            </thead>
            <tbody>${expenseRows}</tbody>
            <tfoot>
                <tr>
                    <td>Total</td>
                    <td>100%</td>
                    <td>${fmt(totalExpenses)}</td>
                </tr>
            </tfoot>
        </table>
    </section>



    <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
}
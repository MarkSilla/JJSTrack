
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

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8"/>
    <title>JJS-Track Financial Report — ${todayLabel()}</title>
    <style>
        @page{size:A4;margin:20mm 15mm 25mm 15mm;
            @bottom-left{content:"Printed by: JJS admin";font-family:Arial,sans-serif;font-size:10px;color:#64748b;font-weight:600}
            @bottom-right{content:"Page " counter(page) " of " counter(pages);font-family:Arial,sans-serif;font-size:10px;color:#64748b;font-weight:600}}
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;color:#111;background:#fff;font-size:12px}
        .ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;padding-bottom:10px;border-bottom:1px solid #e2e8f0}
        .lc{display:flex;align-items:center;gap:10px}
        .lc img{height:35px;width:auto}
        .bn{font-size:16px;font-weight:900;color:#0f172a;letter-spacing:-0.5px}
        .hd{font-size:11px;color:#64748b;font-weight:500}
        h1{font-size:24px;font-weight:900;color:#0f172a;text-align:center;margin-bottom:30px}
        h2{font-size:14px;font-weight:700;color:#1e293b;margin-bottom:10px}
        section{margin-bottom:35px}
        table{width:100%;border-collapse:collapse;font-size:11px}
        thead tr{background:#f1f5f9}
        th{padding:10px;text-align:left;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}
        td{padding:10px;border-bottom:1px solid #f1f5f9;color:#374151}
        tfoot td{border-top:2px solid #e2e8f0;background:#f8fafc;font-weight:800;color:#1d4ed8;font-size:13px;padding:12px 10px}
    </style>
</head>
<body>
    <div class="ph">
        <div class="lc"><img src="${logo}" alt="Logo"/><span class="bn">JJSportswear</span></div>
        <div class="hd">${todayLabel()}</div>
    </div>
    <h1>JJS-Track Financial Report</h1>
    <section>
        <h2>Orders (${orders.length} total)</h2>
        <table>
            <thead><tr><th>Order ID</th><th>Item</th><th>Customer</th><th>Date</th><th>Est. Completion</th><th>Service</th><th>Total</th><th>Invoice</th><th>Status</th></tr></thead>
            <tbody>${orderRows}</tbody>
            <tfoot><tr><td colspan="6">Grand Total (All Orders)</td><td>${fmt(totalAllOrders)}</td><td colspan="2"></td></tr></tfoot>
        </table>
    </section>
    <section>
        <h2>Expense Breakdown — ${fmt(totalExpenses)} total</h2>
        <table>
            <thead><tr><th>Category</th><th>Share</th><th>Amount</th></tr></thead>
            <tbody>${expenseRows}</tbody>
            <tfoot><tr><td>Total</td><td>100%</td><td>${fmt(totalExpenses)}</td></tr></tfoot>
        </table>
    </section>
    <script>window.onload=()=>{window.print()}</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
}

export function exportChartToPDF({
    chartData,
    totals,
    invoiceStatusBreakdown,
    recentPaidInvoices,
    serviceStats,
    timeRange,
}) {

    const CW = 740;
    const CH = 210;
    const PAD_L = 48;
    const PAD_B = 26;
    const PAD_T = 8;
    const PAD_R = 8;
    const W = CW - PAD_L - PAD_R;
    const H = CH - PAD_T - PAD_B;

    const n = chartData.length;
    const maxVal = Math.max(
        ...chartData.flatMap(d => [d.billed || 0, d.collected || 0, d.outstanding || 0]),
        1
    );

    const xOf = (i) => n <= 1 ? W / 2 : (i / (n - 1)) * W;
    const yOf = (v) => H - (v / maxVal) * H;
    const smoothPath = (key) => {
        if (n === 0) return "";
        const pts = chartData.map((d, i) => [xOf(i), yOf(d[key] || 0)]);
        if (n === 1) return `M ${pts[0][0]},${pts[0][1]}`;
        let p = `M ${pts[0][0]},${pts[0][1]}`;
        for (let i = 1; i < pts.length; i++) {
            const [x0, y0] = pts[i - 1];
            const [x1, y1] = pts[i];
            const cp = (x1 - x0) * 0.45;
            p += ` C ${x0 + cp},${y0} ${x1 - cp},${y1} ${x1},${y1}`;
        }
        return p;
    };
    const areaPath = (key) => {
        if (n === 0) return "";
        const pts = chartData.map((d, i) => [xOf(i), yOf(d[key] || 0)]);
        return `${smoothPath(key)} L ${pts[n - 1][0]},${H} L ${pts[0][0]},${H} Z`;
    };
    const Y_TICKS = 5;
    const yGrid = Array.from({ length: Y_TICKS + 1 }, (_, i) => {
        const frac = i / Y_TICKS;
        const val = maxVal * frac;
        const y = H - frac * H;
        const lbl = val >= 1000 ? `P${Math.round(val / 1000)}k` : `P${Math.round(val)}`;
        return `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#EEF2FF" stroke-width="1"/>
                <text x="-5" y="${y + 3.5}" text-anchor="end" font-size="9" fill="#94A3B8">${lbl}</text>`;
    }).join("");

    const step = Math.max(1, Math.ceil(n / 12));
    const xLabels = chartData.map((d, i) => {
        if (i % step !== 0 && i !== n - 1) return "";
        return `<text x="${xOf(i)}" y="${H + 16}" text-anchor="middle" font-size="9" fill="#94A3B8">${d.label}</text>`;
    }).join("");
    const dot = (key, color) => n === 1
        ? `<circle cx="${xOf(0)}" cy="${yOf(chartData[0][key] || 0)}" r="4" fill="${color}" stroke="#fff" stroke-width="2"/>`
        : "";

    const chartSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CW} ${CH + PAD_T}" style="width:100%;display:block" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%"  stop-color="#2563EB" stop-opacity=".18"/>
      <stop offset="95%" stop-color="#2563EB" stop-opacity=".01"/>
    </linearGradient>
    <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%"  stop-color="#10B981" stop-opacity=".16"/>
      <stop offset="95%" stop-color="#10B981" stop-opacity=".01"/>
    </linearGradient>
    <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%"  stop-color="#F59E0B" stop-opacity=".14"/>
      <stop offset="95%" stop-color="#F59E0B" stop-opacity=".01"/>
    </linearGradient>
  </defs>
  <g transform="translate(${PAD_L},${PAD_T})">
    ${yGrid}
    <path d="${areaPath("billed")}"       fill="url(#gB)" stroke="none"/>
    <path d="${areaPath("outstanding")}"  fill="url(#gO)" stroke="none"/>
    <path d="${areaPath("collected")}"    fill="url(#gC)" stroke="none"/>
    <path d="${smoothPath("billed")}"       fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="${smoothPath("outstanding")}"  fill="none" stroke="#F59E0B" stroke-width="2"   stroke-linejoin="round"/>
    <path d="${smoothPath("collected")}"    fill="none" stroke="#10B981" stroke-width="2"   stroke-linejoin="round"/>
    ${dot("billed", "#2563EB")}${dot("collected", "#10B981")}${dot("outstanding", "#F59E0B")}
    ${xLabels}
  </g>
</svg>`;

    const summaryRows = chartData.map(d => `
        <tr>
            <td style="padding:7px 8px;border-bottom:1px solid #f1f5f9;font-size:10px;color:#000000;font-weight:600">${d.label}</td>
            <td style="padding:7px 8px;border-bottom:1px solid #f1f5f9;font-size:10px;color:#000000;font-weight:700">${fmt(d.billed || 0)}</td>
            <td style="padding:7px 8px;border-bottom:1px solid #f1f5f9;font-size:10px;color:#000000;font-weight:700">${fmt(d.collected || 0)}</td>
            <td style="padding:7px 8px;border-bottom:1px solid #f1f5f9;font-size:10px;color:#000000;font-weight:700">${fmt(d.outstanding || 0)}</td>
        </tr>`).join("");

    const summaryTotRow = `
        <tr style="background:#f8fafc">
            <td style="padding:8px;font-size:10px;font-weight:800;color:#0f172a">Total</td>
            <td style="padding:8px;font-size:10px;font-weight:800;color:#000000">${fmt(totals.billedAmount)}</td>
            <td style="padding:8px;font-size:10px;font-weight:800;color:#000000">${fmt(totals.paidAmount)}</td>
            <td style="padding:8px;font-size:10px;font-weight:800;color:#000000">${fmt(totals.pendingAmount + totals.overdueAmount)}</td>
        </tr>`;

    const paymentRows = invoiceStatusBreakdown.map(row => {
        const pct = row.percent;
        return `
        <tr>
            <td style="padding:8px 6px;border-bottom:1px solid #f1f5f9">
                <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${row.color};margin-right:6px;vertical-align:middle"></span>
                <span style="font-size:11px;color:#374151">${row.name}</span>
            </td>
            <td style="padding:8px 6px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#374151">${pct}%</td>
            <td style="padding:8px 6px;border-bottom:1px solid #f1f5f9;font-size:11px;font-weight:700;color:#1e293b">${fmt(row.value)}</td>
            <td style="padding:8px 6px;border-bottom:1px solid #f1f5f9">
                <div style="height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden;min-width:60px">
                    <div style="height:100%;width:${pct}%;background:${row.color};border-radius:4px"></div>
                </div>
            </td>
        </tr>`;
    }).join("");

    /* Recent Paid*/
    const recentRows = recentPaidInvoices.map(b => {
        const customer = b?.contact?.fullName || b?.customerName || "Unknown";
        const bId = b?.bookingId || b?._id || "—";
        const svc = b?.service || b?.bookingType || "Service";
        const dateVal = b?.paidAt || b?.pickupDate || b?.updatedAt || b?.createdAt;
        const dateStr = dateVal
            ? new Date(dateVal).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "N/A";
        const total = (() => {
            if (Number.isFinite(b?.totalPrice)) return Number(b.totalPrice);
            const items = Array.isArray(b?.items) ? b.items : [];
            if (items.length)
                return items.reduce((s, it) => s + Number(it?.qty || 0) * Number(it?.unitPrice || 0) + Number(it?.addOnPrice || 0) * Number(it?.qty || 0), 0);
            return (Array.isArray(b?.selectedOptions) ? b.selectedOptions : [])
                .reduce((s, o) => s + Number(o?.price || 0) * Number(o?.quantity || 1), 0);
        })();
        return `
        <tr>
            <td style="padding:8px 6px;border-bottom:1px solid #f1f5f9;font-size:10px;color:#374151;font-weight:600">${bId}</td>
            <td style="padding:8px 6px;border-bottom:1px solid #f1f5f9;font-size:10px;color:#374151">${customer}</td>
            <td style="padding:8px 6px;border-bottom:1px solid #f1f5f9;font-size:10px;color:#64748b">${svc}</td>
            <td style="padding:8px 6px;border-bottom:1px solid #f1f5f9;font-size:10px;color:#64748b">${dateStr}</td>
            <td style="padding:8px 6px;border-bottom:1px solid #f1f5f9;font-size:10px;font-weight:800;color:#059669;text-align:right">${fmt(total)}</td>
        </tr>`;
    }).join("");

    /* Service */
    const maxRev = Math.max(...serviceStats.map(s => s.revenue), 1);
    const serviceRows = serviceStats.map(s => {
        const barPct = Math.round((s.revenue / maxRev) * 100);
        return `
        <tr>
            <td style="padding:8px 6px;border-bottom:1px solid #f1f5f9">
                <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${s.color};margin-right:6px;vertical-align:middle"></span>
                <span style="font-size:11px;color:#374151;font-weight:600">${s.name}</span>
            </td>
            <td style="padding:8px 6px;border-bottom:1px solid #f1f5f9;font-size:10px;color:#64748b">${s.orders} booking${s.orders !== 1 ? "s" : ""}</td>
            <td style="padding:8px 6px;border-bottom:1px solid #f1f5f9">
                <div style="height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden;min-width:80px">
                    <div style="height:100%;width:${barPct}%;background:${s.color};border-radius:4px"></div>
                </div>
            </td>
            <td style="padding:8px 6px;border-bottom:1px solid #f1f5f9;font-size:11px;font-weight:800;color:#1e293b;text-align:right">${fmt(s.revenue)}</td>
        </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8"/>
    <title>JJS-Track Chart Report — ${todayLabel()}</title>
    <style>
        @page{size:A4 landscape;margin:14mm 14mm 20mm 14mm;
            @bottom-left{content:"Printed by: JJS admin";font-family:Arial,sans-serif;font-size:9px;color:#64748b}
            @bottom-right{content:"Page " counter(page) " of " counter(pages);font-family:Arial,sans-serif;font-size:9px;color:#64748b}}
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;color:#111;background:#fff;font-size:11px}
        .ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #e2e8f0}
        .lc{display:flex;align-items:center;gap:8px}
        .lc img{height:30px;width:auto}
        .bn{font-size:15px;font-weight:900;color:#0f172a}
        .hd{font-size:10px;color:#64748b;font-weight:500}
        .card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:12px}
        .sec-title{font-size:12px;font-weight:700;color:#1e293b;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #f1f5f9}
        table{width:100%;border-collapse:collapse}
        th{padding:7px 8px;text-align:left;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
        tfoot td{background:#f8fafc}
        .legend{display:flex;gap:16px;margin-top:8px}
        .leg{display:flex;align-items:center;gap:5px;font-size:9px;color:#64748b}
        .leg-line{width:18px;height:3px;border-radius:2px;flex-shrink:0}
    </style>
</head>
<body>
    <div class="ph">
        <div class="lc"><img src="${logo}" alt="Logo"/><span class="bn">JJSportswear</span></div>
        <div style="text-align:center">
            <div style="font-size:16px;font-weight:900;color:#0f172a">Financial Chart Report</div>
            <div class="hd">Generated on ${todayLabel()}</div>
        </div>
        <div class="hd" style="text-align:right">Time Range: <b>${timeRange}</b></div>
    </div>

    <!-- Financial Timeline Area Chart (40% height) -->
    <div class="card" style="margin-bottom:12px">
        <div class="sec-title">Financial Timeline — ${timeRange}</div>
        <div style="width:100%">${chartSvg}</div>
        <div class="legend">
            <div class="leg"><div class="leg-line" style="background:#2563EB"></div>Billed</div>
            <div class="leg"><div class="leg-line" style="background:#10B981"></div>Collected</div>
            <div class="leg"><div class="leg-line" style="background:#F59E0B"></div>Outstanding</div>
        </div>
    </div>

    <!-- Chart Summary (period-by-period breakdown) -->
    <div class="card" style="margin-bottom:12px">
        <div class="sec-title">Summary</div>
        <table>
            <thead>
                <tr>
                    <th>Period</th>
                    <th style="color:#2563EB">Billed</th>
                    <th style="color:#10B981">Collected</th>
                    <th style="color:#F59E0B">Outstanding</th>
                </tr>
            </thead>
            <tbody>${summaryRows || '<tr><td colspan="4" style="padding:12px 8px;color:#94a3b8;font-size:11px;text-align:center">No data available.</td></tr>'}</tbody>
            <tfoot>${summaryTotRow}</tfoot>
        </table>
    </div>

    <!-- Booking Payment Mix + Recent Paid side by side -->
    <div style="display:flex;gap:10px;margin-bottom:12px">
        <div class="card" style="flex:1;margin-bottom:0">
            <div class="sec-title">Booking Payment Mix</div>
            <table>
                <thead><tr><th>Status</th><th>%</th><th>Amount</th><th>Bar</th></tr></thead>
                <tbody>${paymentRows || '<tr><td colspan="4" style="padding:12px 8px;color:#94a3b8;font-size:11px;text-align:center">No payment data.</td></tr>'}</tbody>
            </table>
        </div>
        <div class="card" style="flex:2;margin-bottom:0">
            <div class="sec-title">Recent Paid Bookings</div>
            <table>
                <thead><tr><th>Booking ID</th><th>Customer</th><th>Service</th><th>Date</th><th style="text-align:right">Amount</th></tr></thead>
                <tbody>${recentRows || '<tr><td colspan="5" style="padding:12px 8px;color:#94a3b8;font-size:11px;text-align:center">No paid bookings yet.</td></tr>'}</tbody>
            </table>
        </div>
    </div>

    <!-- Revenue by Service -->
    <div class="card">
        <div class="sec-title">Revenue by Service</div>
        <table>
            <thead><tr><th>Service</th><th>Bookings</th><th>Revenue Bar</th><th style="text-align:right">Revenue</th></tr></thead>
            <tbody>${serviceRows || '<tr><td colspan="4" style="padding:12px 8px;color:#94a3b8;font-size:11px;text-align:center">No service data yet.</td></tr>'}</tbody>
        </table>
    </div>

    <script>window.onload=()=>{window.print()}</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
}

export function exportReleasedToPDF({ records, totalRevenue, paidCount }) {
    const fmtAmt = (n) => n != null ? "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "N/A";

    const typeLabel = (typeKey) => {
        if (typeKey === "jersey") return "Jersey";
        if (typeKey === "organizational") return "Org";
        if (typeKey === "repair") return "Repair";
        return "Service";
    };

    const rows = records.map((r, i) => `
        <tr>
            <td>${i + 1}</td>
            <td style="font-family:monospace;font-size:10px;font-weight:700;color:#374151">${r.displayId}</td>
            <td>
                <div style="font-weight:700;color:#111;font-size:11px">${r.headline}</div>
                <div style="color:#94a3b8;font-size:10px;margin-top:1px">${r.secondaryLabel || ""}</div>
            </td>
            <td>${r.customerName}</td>
            <td>${r.serviceLabel || "—"}</td>
            <td>${r.dropDate || "—"}</td>
            <td style="color:#000000;font-weight:600">${r.releaseDate || "—"}</td>
            <td>${r.releasedBy || "—"}</td>
            <td>
                <span style="display:inline-block;padding:2px 8px;font-size:10px;font-weight:800;
                    background:${r.payStatus === "Paid" ? "#ECFDF5" : "#FFF1F2"};
                    color:${r.payStatus === "Paid" ? "#059669" : "#E11D48"};
                    border:none ${r.payStatus === "Paid" ? "#6EE7B7" : "#FECDD3"}">
                    ${r.payStatus || "Unpaid"}
                </span>
            </td>
            <td style="font-weight:700;color:#111;text-align:right">${fmtAmt(r.totalPrice)}</td>
            <td>
                <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;
                    background:${r.typeKey === "jersey" ? "#EFF6FF" : r.typeKey === "repair" ? "#FFF7ED" : r.typeKey === "organizational" ? "#F5F3FF" : "#F8FAFC"};
                    color:${r.typeKey === "jersey" ? "#1D4ED8" : r.typeKey === "repair" ? "#C2410C" : r.typeKey === "organizational" ? "#6D28D9" : "#475569"};
                    border:none ${r.typeKey === "jersey" ? "#BFDBFE" : r.typeKey === "repair" ? "#FED7AA" : r.typeKey === "organizational" ? "#DDD6FE" : "#E2E8F0"}">
                    ${typeLabel(r.typeKey)}
                </span>
            </td>
        </tr>`).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8"/>
    <title>JJS-Track Released Records — ${todayLabel()}</title>
    <style>
        @page{size:A4 landscape;margin:14mm 14mm 22mm 14mm;
            @bottom-left{content:"Printed by: JJS admin";font-family:Arial,sans-serif;font-size:9px;color:#64748b}
            @bottom-right{content:"Page " counter(page) " of " counter(pages);font-family:Arial,sans-serif;font-size:9px;color:#64748b}}
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;color:#111;background:#fff;font-size:11px}
        .ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #e2e8f0}
        .lc{display:flex;align-items:center;gap:8px}
        .lc img{height:30px;width:auto}
        .bn{font-size:15px;font-weight:900;color:#0f172a}
        .hd{font-size:10px;color:#64748b;font-weight:500}
        .stat-row{display:flex;gap:10px;margin-bottom:14px}
        .stat{flex:1;border-radius:10px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0}
        .stat-lbl{font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
        .stat-val{font-size:17px;font-weight:900;color:#0f172a;line-height:1}
        .stat-sub{font-size:9px;color:#94a3b8;margin-top:2px}
        table{width:100%;border-collapse:collapse;font-size:10.5px}
        thead tr{background:#f1f5f9}
        th{padding:9px 8px;text-align:left;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;border-bottom:2px solid #e2e8f0}
        td{padding:9px 8px;border-bottom:1px solid #f1f5f9;color:#374151;vertical-align:middle}
        tfoot td{border-top:2px solid #e2e8f0;background:#f8fafc;font-weight:800;font-size:11px;padding:10px 8px}
        tr:hover td{background:#f8fafc}
    </style>
</head>
<body>
    <div class="ph">
        <div class="lc"><img src="${logo}" alt="Logo"/><span class="bn">JJSportswear</span></div>
        <div style="text-align:center">
            <div style="font-size:16px;font-weight:900;color:#0f172a">Released Records Report</div>
            <div class="hd">Generated on ${todayLabel()}</div>
        </div>
        <div class="hd" style="text-align:right">Total Records: <b>${records.length}</b></div>
    </div>


    <table>
        <thead>
            <tr>
                <th>No.</th>
                <th>ID</th>
                <th>Record</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Drop Date</th>
                <th>Released Date</th>
                <th>Released By</th>
                <th>Pay Status</th>
                <th style="text-align:right">Amount</th>
                <th>Type</th>
            </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="11" style="padding:20px;text-align:center;color:#94a3b8">No released records found.</td></tr>'}</tbody>
        <tfoot>
            <tr>
                <td colspan="9">Grand Total (${records.length} records, ${paidCount} paid)</td>
                <td style="text-align:right;color:#1D4ED8">${fmtAmt(totalRevenue)}</td>
                <td></td>
            </tr>
        </tfoot>
    </table>

    <script>window.onload=()=>{window.print()}</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
}
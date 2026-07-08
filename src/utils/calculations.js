// Sums qty * price across a list of invoice line items.
export const calcItemsTotal = (items) =>
  items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0), 0);

// Remaining balance for a single invoice.
export const invoiceRemaining = (invoice) => invoice.total - invoice.paid;
// Most profitable products by total margin (margin per unit × qty sold).
// Different from top-selling: a low-volume, high-margin item can rank
// higher here than a high-volume, thin-margin one.
export function mostProfitableProducts(invoices, products, limit = 10) {
  const statsByProduct = {};
  invoices
    .filter((i) => i.type === "sale")
    .forEach((inv) => {
      (inv.items || []).forEach((item) => {
        const qty = parseFloat(item.qty) || 0;
        const product = products.find((p) => p.id === item.productId);
        if (!product) return;
        const { margin } = calcMargin(product.buyPrice || 0, parseFloat(item.price) || 0);
        if (!statsByProduct[item.productId]) {
          statsByProduct[item.productId] = { productId: item.productId, name: product.name, unit: product.unit, qty: 0, totalProfit: 0 };
        }
        statsByProduct[item.productId].qty += qty;
        statsByProduct[item.productId].totalProfit += margin * qty;
      });
    });

  return Object.values(statsByProduct)
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, limit);
}

// Total sale revenue bucketed by day of week (Sunday-Saturday), helps
// with staffing/stocking decisions.
export function salesByDayOfWeek(invoices) {
  const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const totals = dayNames.map((name) => ({ day: name, total: 0 }));

  invoices
    .filter((i) => i.type === "sale")
    .forEach((inv) => {
      const dayIndex = new Date(inv.date).getDay();
      totals[dayIndex].total += inv.total;
    });

  return totals;
}

// Monthly revenue vs profit trend over the last `months` months.
export function monthlyRevenueTrend(invoices, products, months = 6) {
  const now = new Date();
  const buckets = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("ar-EG", { month: "short", year: "2-digit" });
    buckets.push({ year: d.getFullYear(), month: d.getMonth(), label, revenue: 0, profit: 0 });
  }

  invoices
    .filter((i) => i.type === "sale")
    .forEach((inv) => {
      const d = new Date(inv.date);
      const bucket = buckets.find((b) => b.year === d.getFullYear() && b.month === d.getMonth());
      if (!bucket) return;
      bucket.revenue += inv.total;
      (inv.items || []).forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        const qty = parseFloat(item.qty) || 0;
        const { margin } = calcMargin(product?.buyPrice || 0, parseFloat(item.price) || 0);
        bucket.profit += margin * qty;
      });
    });

  return buckets;
}

// Local YYYY-MM-DD for a Date/date-string input — matches how
// toLocaleDateString displays it, unlike raw ISO string slicing (UTC-based).
export function localDateOf(dateInput) {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Filters invoices belonging to a given LOCAL date string (YYYY-MM-DD).
export const invoicesOnDate = (invoices, type, dateStr) =>
  invoices.filter((inv) => inv.type === type && localDateOf(inv.date) === dateStr);

// Filters invoices tied to a specific customer/supplier id.
export const invoicesForParty = (invoices, partyId) =>
  invoices.filter((inv) => inv.partyId === partyId);

// Outstanding balance for a customer/supplier: sum of (total - paid) across
// all of their invoices. (Legacy helper — still used by some pages.)
export const partyBalance = (invoices, partyId) =>
  invoicesForParty(invoices, partyId).reduce((sum, inv) => sum + invoiceRemaining(inv), 0);

// Profit margin (absolute + percentage) between buy and sell price.
export const calcMargin = (buyPrice, sellPrice) => {
  const margin = sellPrice - buyPrice;
  const marginPct = buyPrice ? ((margin / buyPrice) * 100).toFixed(1) : 0;
  return { margin, marginPct };
};

// Total unpaid amount across a party's invoices, not yet reduced by extra payments.
export function invoiceDebtFor(invoices, partyId) {
  return invoices.filter((i) => i.partyId === partyId).reduce((s, i) => s + (i.total - i.paid), 0);
}

// Debt the customer still owes the shop, after extra payments AND
// returned-product credits are applied.
export function debtFor(invoices, partyId, payments = [], returns = []) {
  const invoiceDebt = invoiceDebtFor(invoices, partyId);
  const paidOff = payments.reduce((s, p) => s + p.amount, 0);
  const returnedCredit = returns.reduce((s, r) => s + r.amount, 0);
  return Math.max(0, invoiceDebt - paidOff - returnedCredit);
}

// Credit the shop owes back to the customer (overpayment + returns not yet withdrawn).
export function creditFor(invoices, partyId, payments = [], withdrawals = [], returns = []) {
  const invoiceDebt = invoiceDebtFor(invoices, partyId);
  const paidOff = payments.reduce((s, p) => s + p.amount, 0);
  const withdrawn = withdrawals.reduce((s, w) => s + w.amount, 0);
  const returnedCredit = returns.reduce((s, r) => s + r.amount, 0);
  return Math.max(0, paidOff + returnedCredit - invoiceDebt - withdrawn);
}

// Filters expenses matching a given LOCAL date string (YYYY-MM-DD).
export const expensesOnDate = (expenses, dateStr) =>
  expenses.filter((e) => localDateOf(e.date) === dateStr);

// Builds a unified list of cash movements (in/out) across the business,
// derived entirely from existing data — no new storage needed except
// treasuryWithdrawals (owner cash-outs). Returns do NOT appear here since
// they are account credit for the customer, not physical cash movement.
export function getCashMovements(invoices, customers = [], suppliers = [], expenses = [], treasuryWithdrawals = [], treasuryDeposits = []) {
  const movements = [];

  invoices.forEach((inv) => {
    if (!inv.paid) return;
    movements.push({
      date: inv.date,
      amount: inv.paid,
      direction: inv.type === "sale" ? "in" : "out",
      source: inv.type === "sale" ? "sale" : "purchase",
      description: inv.type === "sale" ? `تحصيل من فاتورة بيع (${inv.partyName || "نقدي"})` : `دفع لفاتورة شراء (${inv.partyName || "نقدي"})`,
    });
  });

  customers.forEach((c) => {
    (c.payments || []).forEach((p) => {
      movements.push({ date: p.date, amount: p.amount, direction: "in", source: "customer_payment", description: `دفعة من العميل ${c.name}` });
    });
    (c.withdrawals || []).forEach((w) => {
      movements.push({ date: w.date, amount: w.amount, direction: "out", source: "customer_refund", description: `استرجاع مبلغ للعميل ${c.name}` });
    });
  });

  suppliers.forEach((s) => {
    (s.payments || []).forEach((p) => {
      movements.push({ date: p.date, amount: p.amount, direction: "out", source: "supplier_payment", description: `دفعة للمورد ${s.name}` });
    });
    (s.withdrawals || []).forEach((w) => {
      movements.push({ date: w.date, amount: w.amount, direction: "in", source: "supplier_refund", description: `استرجاع مبلغ من المورد ${s.name}` });
    });
  });

  expenses.forEach((e) => {
    movements.push({ date: e.date, amount: e.amount, direction: "out", source: "expense", description: `مصروف: ${e.category}` });
  });

  treasuryWithdrawals.forEach((w) => {
    movements.push({
      date: w.date,
      amount: w.amount,
      direction: "out",
      source: "treasury_withdrawal",
      description: w.note ? `سحب من الخزينة: ${w.note}` : "سحب من الخزينة",
      by: w.by || "",
    });
  });

  treasuryDeposits.forEach((d) => {
    movements.push({
      date: d.date,
      amount: d.amount,
      direction: "in",
      source: "treasury_deposit",
      description: d.note ? `إيداع خزينة (${d.category}): ${d.note}` : `إيداع خزينة (${d.category})`,
      by: d.by || "",
    });
  });

  return movements;
}

// Net cash for one specific LOCAL day (YYYY-MM-DD): total in - total out for that day only.
export function netCashForDate(movements, dateStr) {
  return movements
    .filter((m) => localDateOf(m.date) === dateStr)
    .reduce((s, m) => s + (m.direction === "in" ? m.amount : -m.amount), 0);
}

// Current cash register balance: all-time running total, not tied to any date.
export function cashRegisterBalance(movements) {
  return movements.reduce((s, m) => s + (m.direction === "in" ? m.amount : -m.amount), 0);
}

// All invoices where this transport person handled delivery.
export const invoicesForTransport = (invoices, transportId) =>
  invoices.filter((inv) => inv.transportId === transportId);

// Total transportation fees across a transport person's jobs.
export const transportFeesTotalFor = (invoices, transportId) =>
  invoicesForTransport(invoices, transportId).reduce((s, inv) => s + (inv.transportFee || 0), 0);

// Fees already paid to the transport person.
export const transportFeesCollectedFor = (invoices, transportId) =>
  invoicesForTransport(invoices, transportId)
    .filter((inv) => inv.transportFeePaid)
    .reduce((s, inv) => s + (inv.transportFee || 0), 0);

// Outstanding balance owed TO the transport person (shop owes them for
// completed deliveries not yet paid out).
export const transportBalanceFor = (invoices, transportId) => {
  const total = transportFeesTotalFor(invoices, transportId);
  const collected = transportFeesCollectedFor(invoices, transportId);
  return Math.max(0, total - collected);
};

// Full stats block for one transport person's dashboard/detail view.
export const transportStatsFor = (invoices, transportId) => {
  const jobs = invoicesForTransport(invoices, transportId);
  return {
    totalJobs: jobs.length,
    totalFees: transportFeesTotalFor(invoices, transportId),
    totalCollected: transportFeesCollectedFor(invoices, transportId),
    outstanding: transportBalanceFor(invoices, transportId),
    jobs,
  };
};

// Daily history: for every LOCAL date with activity, the net of that day AND
// the cumulative cash register balance at the end of that day.
export function dailyCashHistory(movements) {
  const byDate = {};
  movements.forEach((m) => {
    const d = localDateOf(m.date);
    byDate[d] = (byDate[d] || 0) + (m.direction === "in" ? m.amount : -m.amount);
  });

  const sortedDates = Object.keys(byDate).sort();
  let running = 0;
  return sortedDates.map((date) => {
    running += byDate[date];
    return { date, netOfDay: byDate[date], balanceEndOfDay: running };
  });
}

// Unified account history for one customer: every invoice, payment,
// withdrawal, and return, normalized to one shape for a single timeline.
export function partyAccountHistory(invoices, party) {
  const partyInvoices = invoices.filter((i) => i.partyId === party.id);
  const payments = party.payments || [];
  const withdrawals = party.withdrawals || [];
  const returns = party.returns || [];

  const entries = [
    ...partyInvoices.map((i) => ({
      date: i.date,
      type: "sale",
      typeLabel: "بيع",
      invoiceNumber: i.id.slice(-6).toUpperCase(),
      amount: i.total,
      note: i.notes || "",
    })),
    ...payments.map((p) => ({
      date: p.date,
      type: "payment",
      typeLabel: "دفعة",
      invoiceNumber: "—",
      amount: p.amount,
      note: p.note || "",
    })),
    ...withdrawals.map((w) => ({
      date: w.date,
      type: "withdrawal",
      typeLabel: "سحب فلوس",
      invoiceNumber: "—",
      amount: w.amount,
      note: w.note || "",
    })),
    ...returns.map((r) => ({
      date: r.date,
      type: "return",
      typeLabel: "مرتجع",
      invoiceNumber: r.invoiceId ? r.invoiceId.slice(-6).toUpperCase() : "—",
      amount: r.amount,
      note: r.note ? `${r.productName || ""} — ${r.note}` : r.productName || "",
    })),
  ];

  return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Top-selling products by quantity sold (sale invoices only).
export function topSellingProducts(invoices, products, limit = 10) {
  const qtyByProduct = {};
  invoices
    .filter((i) => i.type === "sale")
    .forEach((inv) => {
      (inv.items || []).forEach((item) => {
        qtyByProduct[item.productId] = (qtyByProduct[item.productId] || 0) + (parseFloat(item.qty) || 0);
      });
    });

  return Object.entries(qtyByProduct)
    .map(([productId, qty]) => {
      const product = products.find((p) => p.id === productId);
      return { productId, name: product?.name || "صنف محذوف", unit: product?.unit || "", qty };
    })
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

// Top customers by total sale revenue.
export function topCustomersByRevenue(invoices, customers, limit = 10) {
  const revenueByParty = {};
  invoices
    .filter((i) => i.type === "sale" && i.partyId)
    .forEach((inv) => {
      revenueByParty[inv.partyId] = (revenueByParty[inv.partyId] || 0) + inv.total;
    });

  return Object.entries(revenueByParty)
    .map(([partyId, revenue]) => {
      const customer = customers.find((c) => c.id === partyId);
      return { partyId, name: customer?.name || "عميل محذوف", revenue };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// Debt-aging report: outstanding customer debt bucketed by days since last
// account activity (invoice, payment, or return) — flags who to follow up
// with first.
export function debtAgingReport(invoices, customers) {
  const today = new Date();

  return customers
    .map((c) => {
      const debt = debtFor(invoices, c.id, c.payments || [], c.returns || []);
      if (debt <= 0) return null;

      const custInvoices = invoices.filter((i) => i.partyId === c.id);
      const dates = [
        ...custInvoices.map((i) => i.date),
        ...(c.payments || []).map((p) => p.date),
        ...(c.returns || []).map((r) => r.date)
      ];
      const lastActivity = dates.length ? new Date(Math.max(...dates.map((d) => new Date(d).getTime()))) : null;
      const daysSince = lastActivity ? Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24)) : null;

      let bucket = "غير محدد";
      if (daysSince !== null) {
        if (daysSince <= 7) bucket = "٠-٧ أيام";
        else if (daysSince <= 30) bucket = "٨-٣٠ يوم";
        else bucket = "أكثر من ٣٠ يوم";
      }

      return { customerId: c.id, name: c.name, debt, daysSince, bucket };
    })
    .filter(Boolean)
    .sort((a, b) => b.debt - a.debt);
}

// Estimated days until each product runs out, based on average daily sales
// over the last `lookbackDays`. Only includes products with actual recent
// sales activity (a stagnant/dead item has no meaningful "days left").
export function daysUntilStockout(invoices, products, lookbackDays = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookbackDays);

  const qtyByProduct = {};
  invoices
    .filter((i) => i.type === "sale" && new Date(i.date) >= cutoff)
    .forEach((inv) => {
      (inv.items || []).forEach((item) => {
        qtyByProduct[item.productId] = (qtyByProduct[item.productId] || 0) + (parseFloat(item.qty) || 0);
      });
    });

  return products
    .map((p) => {
      const soldQty = qtyByProduct[p.id] || 0;
      const avgDaily = soldQty / lookbackDays;
      const daysLeft = avgDaily > 0 ? Math.floor(p.stock / avgDaily) : null;
      return { productId: p.id, name: p.name, stock: p.stock, unit: p.unit, avgDaily, daysLeft };
    })
    .filter((p) => p.daysLeft !== null)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}
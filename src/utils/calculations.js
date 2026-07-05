// Sums qty * price across a list of invoice line items.
export const calcItemsTotal = (items) =>
  items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0), 0);

// Remaining balance for a single invoice.
export const invoiceRemaining = (invoice) => invoice.total - invoice.paid;

// Filters invoices belonging to a given date string prefix (YYYY-MM-DD).
export const invoicesOnDate = (invoices, type, dateStr) =>
  invoices.filter((inv) => inv.type === type && inv.date.startsWith(dateStr));

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

// Filters expenses matching a given date string (YYYY-MM-DD).
export const expensesOnDate = (expenses, dateStr) =>
  expenses.filter((e) => e.date.startsWith(dateStr));

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

// Net cash for one specific day (YYYY-MM-DD): total in - total out for that day only.
export function netCashForDate(movements, dateStr) {
  return movements
    .filter((m) => m.date.slice(0, 10) === dateStr)
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

// Daily history: for every date with activity, the net of that day AND the
// cumulative cash register balance at the end of that day.
export function dailyCashHistory(movements) {
  const byDate = {};
  movements.forEach((m) => {
    const d = m.date.slice(0, 10);
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
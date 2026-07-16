// ============================================================
// INVOICE BASICS
// ============================================================

// Sums qty * price across a list of invoice line items.
export const calcItemsTotal = (items) =>
  items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0), 0);

// Remaining balance for a single invoice.
export const invoiceRemaining = (invoice) => invoice.total - invoice.paid;

// Local YYYY-MM-DD for a Date/date-string input -- matches how
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
// all of their invoices. (Legacy helper -- still used by some pages.)
export const partyBalance = (invoices, partyId) =>
  invoicesForParty(invoices, partyId).reduce((sum, inv) => sum + invoiceRemaining(inv), 0);

// Profit margin (absolute + percentage) between buy and sell price.
export const calcMargin = (buyPrice, sellPrice) => {
  const margin = sellPrice - buyPrice;
  const marginPct = buyPrice ? ((margin / buyPrice) * 100).toFixed(1) : 0;
  return { margin, marginPct };
};

// ============================================================
// DEBT & CREDIT (single source of truth -- used by every page)
// ============================================================

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

// ============================================================
// EXPENSES
// ============================================================

// Filters expenses matching a given LOCAL date string (YYYY-MM-DD).
export const expensesOnDate = (expenses, dateStr) =>
  expenses.filter((e) => localDateOf(e.date) === dateStr);

// Groups expenses by category with totals -- feeds a pie/donut chart.
export function expensesByCategory(expenses) {
  const map = {};
  expenses.forEach((e) => {
    map[e.category] = (map[e.category] || 0) + e.amount;
  });
  return Object.entries(map)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

// ============================================================
// TREASURY / CASH REGISTER
// ============================================================

// Builds a unified list of cash movements (in/out) across the business,
// derived entirely from existing data -- no new storage needed except
// treasuryWithdrawals (owner cash-outs) and treasuryDeposits (owner cash-ins).
// Returns do NOT appear here since they are account credit for the
// customer, not physical cash movement.
export function getCashMovements(
  invoices,
  customers = [],
  suppliers = [],
  expenses = [],
  treasuryWithdrawals = [],
  treasuryDeposits = [],
  reservations = []
) {
  const movements = [];

  // ==========================
  // Invoices
  // ==========================
  invoices.forEach((inv) => {
    if (!inv.paid) return;

    // إذا كانت الفاتورة ناتجة عن تحويل حجز
    // فلا نسجلها مرة أخرى لأن الدفع تم تسجيله عند الحجز
    if (inv.convertedFromReservationId) return;

    movements.push({
      date: inv.date,
      amount: inv.paid,
      direction: inv.type === "sale" ? "in" : "out",
      source: inv.type === "sale" ? "sale" : "purchase",
      description:
        inv.type === "sale"
          ? `تحصيل من فاتورة بيع (${inv.partyName || "نقدي"})`
          : `دفع لفاتورة شراء (${inv.partyName || "نقدي"})`,
    });
  });

  // ==========================
  // Customers
  // ==========================
  customers.forEach((c) => {
    (c.payments || []).forEach((p) => {
      // إذا كانت الدفعة مجرد تحويل داخلي من الحجز
      // فلا تعتبر حركة نقدية جديدة
      if (p.isInternalTransfer) return;

      movements.push({
        date: p.date,
        amount: p.amount,
        direction: "in",
        source: "customer_payment",
        description: `دفعة من العميل ${c.name}`,
      });
    });

    (c.withdrawals || []).forEach((w) => {
      // تحويل رصيد الحجز ليس استردادًا نقديًا
      if (w.type === "reservation_credit") return;

      movements.push({
        date: w.date,
        amount: w.amount,
        direction: "out",
        source: "customer_refund",
        description: `استرجاع مبلغ للعميل ${c.name}`,
      });
    });
  });

  // ==========================
  // Suppliers
  // ==========================
  suppliers.forEach((s) => {
    (s.payments || []).forEach((p) => {
      movements.push({
        date: p.date,
        amount: p.amount,
        direction: "out",
        source: "supplier_payment",
        description: `دفعة للمورد ${s.name}`,
      });
    });

    (s.withdrawals || []).forEach((w) => {
      movements.push({
        date: w.date,
        amount: w.amount,
        direction: "in",
        source: "supplier_refund",
        description: `استرجاع مبلغ من المورد ${s.name}`,
      });
    });
  });

  // ==========================
  // Expenses
  // ==========================
  expenses.forEach((e) => {
    movements.push({
      date: e.date,
      amount: e.amount,
      direction: "out",
      source: "expense",
      description: `مصروف: ${e.category}`,
    });
  });

  // ==========================
  // Treasury Withdrawals
  // ==========================
  treasuryWithdrawals.forEach((w) => {
    movements.push({
      date: w.date,
      amount: w.amount,
      direction: "out",
      source: "treasury_withdrawal",
      description: w.note
        ? `سحب من الخزينة: ${w.note}`
        : "سحب من الخزينة",
      by: w.by || "",
    });
  });

  // ==========================
  // Treasury Deposits
  // ==========================
  treasuryDeposits.forEach((d) => {
    movements.push({
      date: d.date,
      amount: d.amount,
      direction: "in",
      source: "treasury_deposit",
      description: d.note
        ? `إيداع خزينة (${d.category}): ${d.note}`
        : `إيداع خزينة (${d.category})`,
      by: d.by || "",
    });
  });

  // ==========================
  // Reservation Payments
  // ==========================
  reservations.forEach((r) => {
    (r.payments || []).forEach((p) => {
      movements.push({
        date: p.date,
        amount: p.amount,
        direction: "in",
        source: "reservation_payment",
        description: `دفعة حجز — ${r.customerName || ""} (${r.productName || ""})`,
        by: p.by || "",
      });
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

// ============================================================
// TRANSPORTATION
// ============================================================

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

// ============================================================
// EMPLOYEES (loading / unloading workers)
// ============================================================

// All invoices where a given employee handled loading/unloading.
export const invoicesForEmployee = (invoices, employeeId) =>
  invoices.filter((inv) => (inv.employeeIds || []).includes(employeeId));

// Stats block for one employee: how many loading (sale) jobs vs
// unloading (purchase) jobs they've handled.
export const employeeStatsFor = (invoices, employeeId) => {
  const jobs = invoicesForEmployee(invoices, employeeId);
  const loadingJobs = jobs.filter((i) => i.type === "sale");
  const unloadingJobs = jobs.filter((i) => i.type === "purchase");
  return {
    totalJobs: jobs.length,
    loadingJobs: loadingJobs.length,
    unloadingJobs: unloadingJobs.length,
    jobs,
  };
};

// Total earned by an employee across every job they've been assigned to
// (loading/unloading fees, split evenly among however many workers were
// selected on that invoice).
export function employeeEarningsTotal(employee) {
  return (employee.earnings || []).reduce((s, e) => s + e.amount, 0);
}

// Total already paid out to this employee.
export function employeePaidTotal(employee) {
  return (employee.payments || []).reduce((s, p) => s + p.amount, 0);
}

// Outstanding balance the shop still owes this employee.
export function employeeBalanceFor(employee) {
  return Math.max(0, employeeEarningsTotal(employee) - employeePaidTotal(employee));
}

// ============================================================
// RESERVATIONS (customer holds on stock, does not affect inventory)
// ============================================================

// Active reservations for a specific product.
export const activeReservationsForProduct = (reservations, productId) =>
  reservations.filter((r) => r.productId === productId && r.status === "active");

// Total quantity currently reserved (active only) for a product -- does
// NOT get subtracted from stock, purely informational.
export function reservedQtyForProduct(reservations, productId) {
  return activeReservationsForProduct(reservations, productId).reduce((s, r) => s + (r.qty || 0), 0);
}

// Payment status label for a reservation.
export function reservationPaymentStatus(reservation) {
  if (reservation.paid >= reservation.total) return "مدفوع كامل";
  if (reservation.paid > 0) return "مدفوع جزئي";
  return "غير مدفوع";
}

// All reservations for one customer.
export const reservationsForCustomer = (reservations, customerId) =>
  reservations.filter((r) => r.customerId === customerId);

// ============================================================
// ACCOUNT HISTORY
// ============================================================

// Unified account history for one customer: every invoice, payment,
// withdrawal, return, AND reservation activity, normalized to one shape
// for a single timeline.
export function partyAccountHistory(invoices, party, reservations = []) {
  const partyInvoices = invoices.filter((i) => i.partyId === party.id);
  const payments = party.payments || [];
  const withdrawals = party.withdrawals || [];
  const returns = party.returns || [];
  const customerReservations = reservations.filter((r) => r.customerId === party.id);

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
      type: p.isInternalTransfer ? "reservation_credit_transfer" : "payment",
      typeLabel: p.isInternalTransfer ? "رصيد من حجز ملغى" : "دفعة",
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
    ...customerReservations.map((r) => ({
      date: r.date,
      type: "reservation",
      typeLabel: "حجز",
      invoiceNumber: "—",
      amount: r.total,
      note: `${r.productName || ""} — ${r.qty} ${r.unit || ""}${r.notes ? ` — ${r.notes}` : ""}`,
    })),
    ...customerReservations.flatMap((r) =>
      (r.history || [])
        .filter((h) => h.action?.startsWith("تسجيل دفعة"))
        .map((h) => ({
          date: h.date,
          type: "reservation_payment",
          typeLabel: "دفعة حجز",
          invoiceNumber: "—",
          amount: 0,
          note: `${r.productName || ""} — ${h.action}`,
        }))
    ),
  ];

  return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ============================================================
// ANALYTICS
// ============================================================

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
      return { id: productId, name: product?.name || "صنف محذوف", unit: product?.unit || "", qty };
    })
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

// Top customers by total product revenue (excludes transport fees).
export function topCustomersByRevenue(invoices, customers, limit = 10) {
  const revenueByParty = {};
  invoices
    .filter((i) => i.type === "sale" && i.partyId)
    .forEach((inv) => {
      revenueByParty[inv.partyId] = (revenueByParty[inv.partyId] || 0) + (inv.itemsTotal ?? inv.total);
    });

  return Object.entries(revenueByParty)
    .map(([partyId, revenue]) => {
      const customer = customers.find((c) => c.id === partyId);
      return { id: partyId, name: customer?.name || "عميل محذوف", revenue };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// Debt-aging report: outstanding customer debt bucketed by days since last
// account activity (invoice, payment, or return) -- flags who to follow up
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
        ...(c.returns || []).map((r) => r.date),
      ];
      const lastActivity = dates.length ? new Date(Math.max(...dates.map((d) => new Date(d).getTime()))) : null;
      const daysSince = lastActivity ? Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24)) : null;

      let bucket = "غير محدد";
      if (daysSince !== null) {
        if (daysSince <= 7) bucket = "٠-٧ أيام";
        else if (daysSince <= 30) bucket = "٨-٣٠ يوم";
        else bucket = "أكثر من ٣٠ يوم";
      }

      return { id: c.id, name: c.name, debt, daysSince, bucket };
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
      return { id: p.id, name: p.name, stock: p.stock, unit: p.unit, avgDaily, daysLeft };
    })
    .filter((p) => p.daysLeft !== null)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

// Most profitable products by total margin (margin per unit x qty sold).
// Different from top-selling: a low-volume, high-margin item can rank
// higher here than a high-volume, thin-margin one. Uses the sell price
// actually charged on each invoice line and the product's current buy
// price.
export function mostProfitableProducts(invoices, products, limit = 10) {
  const map = {};
  invoices
    .filter((i) => i.type === "sale")
    .forEach((inv) => {
      (inv.items || []).forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return;
        const qty = parseFloat(item.qty) || 0;
        const sellPriceUsed = parseFloat(item.price) || 0;
        const profit = (sellPriceUsed - (product.buyPrice || 0)) * qty;
        if (!map[item.productId]) map[item.productId] = { totalProfit: 0, name: product.name, unit: product.unit };
        map[item.productId].totalProfit += profit;
      });
    });

  return Object.entries(map)
    .map(([id, data]) => ({ id, name: data.name, unit: data.unit, totalProfit: data.totalProfit }))
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, limit);
}

// Total sale revenue grouped by day of week (Sunday-Saturday), so you can
// see which days are busiest. Uses product-only revenue (itemsTotal),
// excluding transport fees.
export function salesByDayOfWeek(invoices) {
  const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const totals = new Array(7).fill(0);

  invoices
    .filter((i) => i.type === "sale")
    .forEach((inv) => {
      const dayIndex = new Date(inv.date).getDay();
      totals[dayIndex] += inv.itemsTotal ?? inv.total;
    });

  return dayNames.map((day, i) => ({ day, total: totals[i] }));
}

// Revenue and profit trend for the last N months (product-only revenue,
// current-buy-price cost -- consistent with ReportsPage's convention).
// NOTE: "profit" here is revenue minus cost of goods only -- does NOT
// subtract expenses. Use monthlyNetProfitTrend for true net profit.
export function monthlyRevenueTrend(invoices, products, months = 6) {
  const now = new Date();
  const buckets = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString("ar-EG", { month: "short", year: "2-digit" }),
      revenue: 0,
      cost: 0,
    });
  }

  invoices
    .filter((i) => i.type === "sale")
    .forEach((inv) => {
      const d = new Date(inv.date);
      const bucket = buckets.find((b) => b.year === d.getFullYear() && b.month === d.getMonth());
      if (!bucket) return;
      bucket.revenue += inv.itemsTotal ?? inv.total;
      (inv.items || []).forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        bucket.cost += (product?.buyPrice || 0) * (parseFloat(item.qty) || 0);
      });
    });

  return buckets.map((b) => ({ label: b.label, revenue: b.revenue, profit: b.revenue - b.cost }));
}

// Monthly sales, cost of goods, expenses, and true net profit, for the
// last N months. Net profit = revenue - cost of goods sold - expenses.
export function monthlyNetProfitTrend(invoices, products, expenses, months = 6) {
  const now = new Date();
  const buckets = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString("ar-EG", { month: "short", year: "2-digit" }),
      revenue: 0,
      cost: 0,
      expenses: 0,
    });
  }

  invoices
    .filter((i) => i.type === "sale")
    .forEach((inv) => {
      const d = new Date(inv.date);
      const bucket = buckets.find((b) => b.year === d.getFullYear() && b.month === d.getMonth());
      if (!bucket) return;
      bucket.revenue += inv.itemsTotal ?? inv.total;
      (inv.items || []).forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        bucket.cost += (product?.buyPrice || 0) * (parseFloat(item.qty) || 0);
      });
    });

  expenses.forEach((e) => {
    const d = new Date(e.date);
    const bucket = buckets.find((b) => b.year === d.getFullYear() && b.month === d.getMonth());
    if (!bucket) return;
    bucket.expenses += e.amount;
  });

  return buckets.map((b) => ({
    label: b.label,
    revenue: b.revenue,
    cost: b.cost,
    expenses: b.expenses,
    netProfit: b.revenue - b.cost - b.expenses,
  }));
}

// Total value of everything currently sitting in the store.
// costValue = capital actually tied up (buyPrice x stock)
// saleValue = potential revenue if all stock sold at current sellPrice
// potentialProfit = saleValue - costValue
export function totalInventoryValue(products) {
  let costValue = 0;
  let saleValue = 0;

  const breakdown = products.map((p) => {
    const productCostValue = (p.buyPrice || 0) * (p.stock || 0);
    const productSaleValue = (p.sellPrice || 0) * (p.stock || 0);
    costValue += productCostValue;
    saleValue += productSaleValue;
    return {
      id: p.id,
      name: p.name,
      unit: p.unit,
      stock: p.stock || 0,
      costValue: productCostValue,
      saleValue: productSaleValue,
    };
  });

  return {
    costValue,
    saleValue,
    potentialProfit: saleValue - costValue,
    breakdown: breakdown.sort((a, b) => b.costValue - a.costValue),
  };
}

// Builds a sale-invoice payload from a reservation, ready to be pushed
// into the invoices array. Copies items, price, payments, and credit
// usage -- nothing needs to be re-entered.
export function buildInvoiceFromReservation(reservation, currentUserName) {
  return {
    type: "sale",
    date: new Date().toISOString(),
    partyId: reservation.customerId,
    partyName: reservation.customerName,
    items: [
      {
        productId: reservation.productId,
        productName: reservation.productName,
        qty: reservation.qty,
        price: reservation.unitPrice
      }
    ],
    itemsTotal: reservation.total,
    transportFee: 0,
    total: reservation.total,
    paid: reservation.paid + (reservation.creditUsed || 0),
    notes: reservation.notes || "",
    createdBy: currentUserName || "",
    transportId: null,
    transportPersonName: "",
    deliveryAddress: "",
    transportFeePaid: false,
    employeeIds: [],
    employeeNames: [],
    convertedFromReservationId: reservation.id
  };
}
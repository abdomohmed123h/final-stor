// Builds a CSV file from invoice rows and triggers a browser download.
// A UTF-8 BOM is prepended so Excel renders Arabic text correctly.
export const exportInvoicesToCSV = (invoices, from, to) => {
  const rows = [
    ["رقم الفاتورة", "النوع", "التاريخ", "الجهة", "الإجمالي", "المدفوع", "المتبقي", "بواسطة"],
  ];

  invoices.forEach((inv) => {
    rows.push([
      inv.id.slice(-6),
      inv.type === "sale" ? "بيع" : "شراء",
      inv.date.slice(0, 10),
      inv.partyName || "",
      inv.total,
      inv.paid,
      inv.total - inv.paid,
      inv.createdBy || "",
    ]);
  });

  const csv = rows.map((row) => row.join(",")).join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
  link.download = `تقرير-${from}-${to}.csv`;
  link.click();
};
// Builds a CSV file from expense rows and triggers a browser download.
// A UTF-8 BOM is prepended so Excel renders Arabic text correctly.
export const exportExpensesToCSV = (expenses, from, to) => {
  const rows = [["التاريخ", "التصنيف", "المبلغ", "ملاحظة"]];

  expenses.forEach((e) => {
    rows.push([e.date.slice(0, 10), e.category, e.amount, e.note || ""]);
  });

  const csv = rows.map((row) => row.join(",")).join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
  link.download = `مصروفات-${from}-${to}.csv`;
  link.click();
};

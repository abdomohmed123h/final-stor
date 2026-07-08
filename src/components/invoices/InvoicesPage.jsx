import { useState } from "react";
import { Card, Table, Badge, Btn } from "../ui";
import { InvoicePreview } from "./InvoicePreview";
import { fmt, shortId } from "../../utils/format";
import { invoiceRemaining } from "../../utils/calculations";

export function InvoicesPage({ invoices, setModal }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Case-insensitive search: normalize both the search term and the
  // fields being searched to lowercase before comparing.
  const searchLower = search.trim().toLowerCase();

  const filtered = invoices
    .filter((i) => {
      const matchesType = filter === "all" || i.type === filter;
      const matchesSearch =
        !searchLower ||
        i.partyName?.toLowerCase().includes(searchLower) ||
        i.id.toLowerCase().includes(searchLower);
      return matchesType && matchesSearch;
    })
    .reverse();

  return (
    <div>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#1e293b",
          marginBottom: 16
        }}
      >
        📋 سجل الفواتير
      </h2>
      <Card>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 14,
            flexWrap: "wrap"
          }}
        >
          {[
            ["all", "الكل"],
            ["sale", "مبيعات"],
            ["purchase", "مشتريات"]
          ].map(([value, textLabel]) => (
            <Btn
              key={value}
              color={filter === value ? "blue" : "gray"}
              small
              onClick={() => setFilter(value)}
            >
              {textLabel}
            </Btn>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم الجهة أو رقم الفاتورة..."
            style={{
              flex: 1,
              padding: "5px 10px",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "inherit",
              minWidth: 160
            }}
          />
        </div>
        <Table
          cols={[
            "رقم الفاتورة",
            "النوع",
            "التاريخ",
            "الجهة",
            "الإجمالي",
            "مدفوع",
            "متبقي",
            "بواسطة",
            ""
          ]}
          rows={filtered.map((inv) => [
            shortId(inv.id),
            inv.type === "sale" ? (
              <Badge color="blue">بيع</Badge>
            ) : (
              <Badge color="purple">شراء</Badge>
            ),
            new Date(inv.date).toLocaleDateString("ar-EG"),
            inv.partyName || "—",
            fmt(inv.total),
            fmt(inv.paid),
            <span
              style={{
                color: invoiceRemaining(inv) > 0 ? "#dc2626" : "#16a34a"
              }}
            >
              {fmt(invoiceRemaining(inv))}
            </span>,
            inv.createdBy || "—",
            <Btn
              small
              color="gray"
              onClick={() =>
                setModal(
                  <InvoicePreview inv={inv} onClose={() => setModal(null)} />
                )
              }
            >
              عرض
            </Btn>
          ])}
        />
      </Card>
    </div>
  );
}

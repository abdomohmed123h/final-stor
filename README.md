# البنا للمواد الإنشائية — Building Materials Management

A small ERP-style app (auth, sales, purchases, inventory, customers/suppliers,
invoices, products, users, reports) refactored into a clean, modular React
project. All business logic, calculations, and UI/UX are unchanged from the
original single-file version — only the code organization was improved.

## Run locally

```bash
npm install
npm run dev
```

## Project structure

```
src/
├── components/
│   ├── ui/          Reusable primitives (Badge, Btn, Input, Select, Card,
│   │                 Table, Metric, Modal, Toast)
│   ├── layout/       Sidebar + MainLayout shell
│   ├── auth/         Login screen
│   ├── dashboard/    Dashboard page
│   ├── sales/        Sales invoice form + page
│   ├── purchases/    Purchases invoice form + page
│   ├── inventory/    Inventory list + edit modal
│   ├── parties/      Unified customers/suppliers page + modals
│   ├── invoices/     Invoice list + shared invoice preview/print modal
│   ├── products/     Product CRUD page + modals
│   ├── users/        User management page + modal
│   ├── reports/       Filterable reports + CSV export
│   └── shared/        Cross-page components (e.g. InvoiceItemsEditor)
│
├── hooks/            useLocalStorageState, useToast, useModal, useInvoiceItems
├── utils/            format.js, storage.js, calculations.js, csvExport.js
├── constants/        roles.js, navigation.js, initialData.js, theme.js
├── styles/           Minimal global CSS reset
├── App.jsx           Top-level state wiring + page routing
└── main.jsx          React DOM entry point
```

## Notes on the refactor

- All localStorage keys (`bu_users`, `bu_products`, `bu_customers`,
  `bu_suppliers`, `bu_invoices`) and their persistence behavior are unchanged.
- All calculations (totals, remaining balances, margins, low-stock checks)
  were extracted to `utils/calculations.js` and are used identically by every
  page that needs them, removing duplicated logic between Sales/Purchases and
  Dashboard/Reports/Invoices.
- The Sales and Purchases invoice forms now share a single
  `InvoiceItemsEditor` component and a `useInvoiceItems` hook instead of two
  near-identical copies of the same form logic.
- Role-based navigation, the demo login credentials, and seed data live in
  `constants/` instead of being inlined in components.

import { useState, useMemo } from "react";
import { Toaster } from "react-hot-toast";

import { useLocalStorageState } from "./hooks/useLocalStorageState";
import { useToast } from "./hooks/useToast";
import { useModal } from "./hooks/useModal";
import { INIT_USERS, INIT_PRODUCTS } from "./constants/initialData";
import { getCashMovements, cashRegisterBalance } from "./utils/calculations";

import { Login } from "./components/auth/Login";
import { MainLayout } from "./components/layout/MainLayout";
import { Dashboard } from "./components/dashboard/Dashboard";
import { SalesPage } from "./components/sales/SalesPage";
import { PurchasesPage } from "./components/purchases/PurchasesPage";
import { InventoryPage } from "./components/inventory/InventoryPage";
import { PartyPage } from "./components/parties/PartyPage";
import { InvoicesPage } from "./components/invoices/InvoicesPage";
import { ProductsPage } from "./components/products/ProductsPage";
import { UsersPage } from "./components/users/UsersPage";
import { ReportsPage } from "./components/reports/ReportsPage";
import { TreasuryPage } from "./components/treasury/TreasuryPage";
import { ExpensesPage } from "./components/Expenses.jsx/Expenses";
import { TransportationPage } from "./components/transportation/TransportationPage";
import { AnalyticsPage } from "./components/analytics/AnalyticsPage";

export default function App() {
  const [users, setUsers] = useLocalStorageState("bu_users", INIT_USERS);
  const [products, setProducts] = useLocalStorageState(
    "bu_products",
    INIT_PRODUCTS
  );
  const [customers, setCustomers] = useLocalStorageState("bu_customers", []);
  const [suppliers, setSuppliers] = useLocalStorageState("bu_suppliers", []);
  const [invoices, setInvoices] = useLocalStorageState("bu_invoices", []);
  const [expenses, setExpenses] = useLocalStorageState("bu_expenses", []);
  const [treasuryWithdrawals, setTreasuryWithdrawals] = useLocalStorageState(
    "bu_treasury_withdrawals",
    []
  );
  const [treasuryDeposits, setTreasuryDeposits] = useLocalStorageState(
    "bu_treasury_deposits",
    []
  );

  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  const { toast, showToast } = useToast();
  const { modal, setModal } = useModal();
  const [transportPersons, setTransportPersons] = useLocalStorageState(
    "bu_transport_persons",
    []
  );

  const treasuryBalance = useMemo(
    () =>
      cashRegisterBalance(
        getCashMovements(
          invoices,
          customers,
          suppliers,
          expenses,
          treasuryWithdrawals,
          treasuryDeposits
        )
      ),
    [
      invoices,
      customers,
      suppliers,
      expenses,
      treasuryWithdrawals,
      treasuryDeposits
    ]
  );

  const pages = {
    dashboard: (
      <Dashboard
        products={products}
        invoices={invoices}
        customers={customers}
        suppliers={suppliers}
        expenses={expenses}
        treasuryWithdrawals={treasuryWithdrawals}
      />
    ),
    sales: (
      <SalesPage
        products={products}
        setProducts={setProducts}
        customers={customers}
        setCustomers={setCustomers}
        transportPersons={transportPersons}
        invoices={invoices}
        setInvoices={setInvoices}
        showToast={showToast}
        setModal={setModal}
        currentUser={currentUser}
      />
    ),
    purchases: (
      <PurchasesPage
        products={products}
        setProducts={setProducts}
        suppliers={suppliers}
        invoices={invoices}
        setInvoices={setInvoices}
        showToast={showToast}
        setModal={setModal}
        currentUser={currentUser}
      />
    ),
    inventory: (
      <InventoryPage
        products={products}
        setProducts={setProducts}
        showToast={showToast}
        setModal={setModal}
      />
    ),
    customers: (
      <PartyPage
        type="customer"
        parties={customers}
        setParties={setCustomers}
        invoices={invoices}
        showToast={showToast}
        setModal={setModal}
        treasuryBalance={treasuryBalance}
      />
    ),
    suppliers: (
      <PartyPage
        type="supplier"
        parties={suppliers}
        setParties={setSuppliers}
        invoices={invoices}
        showToast={showToast}
        setModal={setModal}
        treasuryBalance={treasuryBalance}
      />
    ),
    invoices: (
      <InvoicesPage
        invoices={invoices}
        customers={customers}
        suppliers={suppliers}
        setModal={setModal}
      />
    ),
    products: (
      <ProductsPage
        products={products}
        setProducts={setProducts}
        showToast={showToast}
        setModal={setModal}
      />
    ),
    users: (
      <UsersPage
        users={users}
        setUsers={setUsers}
        showToast={showToast}
        setModal={setModal}
        currentUser={currentUser}
      />
    ),
    expenses: (
      <ExpensesPage
        expenses={expenses}
        setExpenses={setExpenses}
        showToast={showToast}
      />
    ),
    reports: (
      <ReportsPage
        invoices={invoices}
        products={products}
        customers={customers}
        suppliers={suppliers}
        expenses={expenses}
        treasuryWithdrawals={treasuryWithdrawals}
        treasuryDeposits={treasuryDeposits}
        currentUser={currentUser}
        showToast={showToast}
        setModal={setModal}
        transportPersons={transportPersons}
      />
    ),

    // pages object
    analytics: (
      <AnalyticsPage
        invoices={invoices}
        products={products}
        customers={customers}
        setModal={setModal}
      />
    ),

    treasury: (
      <TreasuryPage
        invoices={invoices}
        customers={customers}
        suppliers={suppliers}
        expenses={expenses}
        treasuryWithdrawals={treasuryWithdrawals}
        setTreasuryWithdrawals={setTreasuryWithdrawals}
        treasuryDeposits={treasuryDeposits}
        setTreasuryDeposits={setTreasuryDeposits}
        currentUser={currentUser}
        showToast={showToast}
        setModal={setModal}
      />
    ),
    transportation: (
      <TransportationPage
        transportPersons={transportPersons}
        setTransportPersons={setTransportPersons}
        invoices={invoices}
        setInvoices={setInvoices}
        showToast={showToast}
        setModal={setModal}
      />
    )
  };

  return (
    <>
      <Toaster position="top-right" />

      {!currentUser ? (
        <Login users={users} onLogin={setCurrentUser} />
      ) : (
        <MainLayout
          currentUser={currentUser}
          page={page}
          onNavigate={setPage}
          onLogout={() => setCurrentUser(null)}
          toast={toast}
          modal={modal}
        >
          {pages[page] || (
            <div style={{ color: "#6b7280" }}>الصفحة غير متاحة</div>
          )}
        </MainLayout>
      )}
    </>
  );
}

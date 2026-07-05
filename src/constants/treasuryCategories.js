// Categories for manual cash deposits into the treasury — money coming in
// from outside normal sales/purchases (loans, owner capital, expansion funds...).
export const DEPOSIT_CATEGORIES = [
    { key: "loan", label: "قرض بنكي" },
    { key: "expansion", label: "توسعات في المشروع" },
    { key: "owner_capital", label: "رأس مال / فلوس من الأونر" },
    { key: "other", label: "أخرى" }
  ];
  
  export const depositCategoryLabel = (key) =>
    DEPOSIT_CATEGORIES.find((c) => c.key === key)?.label || key;
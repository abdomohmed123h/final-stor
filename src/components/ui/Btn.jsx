import { BUTTON_COLORS } from "../../constants/theme";

export function Btn({ children, onClick, color = "gray", small, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...BUTTON_COLORS[color],
        padding: small ? "5px 12px" : "8px 16px",
        borderRadius: 8,
        fontSize: small ? 12 : 13,
        fontFamily: "inherit",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontWeight: 500,
      }}
    >
      {children}
    </button>
  );
}

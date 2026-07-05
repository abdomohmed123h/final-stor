import { BADGE_COLORS } from "../../constants/theme";

export function Badge({ children, color = "gray" }) {
  return (
    <span
      style={{
        ...BADGE_COLORS[color],
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 99,
        fontWeight: 600,
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
}

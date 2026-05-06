export default function LoadingSpinner({ size = 14, color = "var(--text)", track = "var(--text-soft)" }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${track}`,
        borderTopColor: color,
        animation: "vbSpin .7s linear infinite",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

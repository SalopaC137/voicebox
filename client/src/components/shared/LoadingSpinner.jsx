export default function LoadingSpinner({ size = 14, color = "#fff", track = "rgba(255,255,255,.35)" }) {
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

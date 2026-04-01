function kindFromStatus(status) {
  if (status === "approved") return "ok";
  if (status === "pending") return "warn";
  if (status === "rejected" || status === "cancelled") return "bad";
  return "";
}

export default function StatusBadge({ status }) {
  const kind = kindFromStatus(status);
  return (
    <span className={`badge ${kind}`}>
      <span className="dot" />
      <span className="mono">{status || "unknown"}</span>
    </span>
  );
}
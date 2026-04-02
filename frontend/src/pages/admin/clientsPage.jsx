import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../lib/api";

export default function ClientsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [orders, setOrders] = useState([]);
    
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const nav = useNavigate();
  const downloadCsv = async () => {
  try {
    const token = getToken(); // Importa esto desde tu lib/api si aún no está
    const url = `/admin/orders.csv${query ? `?${query}` : ""}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      alert("No se pudo descargar el CSV");
      return;
    }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "orders.csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(a.href);
    }, 500);
  } catch (e) {
    alert("Error descargando CSV: " + (e.message || e));
  }
};
  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    return params.toString();
  }, [q, status]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiFetch(`/admin/orders${query ? `?${query}` : ""}`);
      setOrders(data.orders || []);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
  <div>
    <h2 style={{ margin: 0, fontSize: 22 }}>Clientes</h2>
    <p style={{ margin: "6px 0 0", color: "var(--muted)", lineHeight: 1.55 }}>
      Lista de compras (órdenes) registradas en el sistema.
    </p>
  </div>

  <div style={{ display: "flex", gap: 8 }}>
    <button className="btn" type="button" onClick={load} disabled={loading}>
      {loading ? "Cargando..." : "Actualizar"}
    </button>
    <button
      className="btn"
      type="button"
      onClick={downloadCsv}
      disabled={loading}
    >
      Exportar CSV
    </button>
  </div>
</div>

      <div className="hr" />

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 200px", alignItems: "center" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por orderId, email o DNI..."
          style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
        />

        
      </div>

      {err && (
        <div className="notice error" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Error</div>
          <div className="mono">{err}</div>
        </div>
      )}

      <div className="hr" />

      {loading ? (
        <p style={{ margin: 0, color: "var(--muted)" }}>Cargando órdenes...</p>
      ) : orders.length === 0 ? (
        <p style={{ margin: 0, color: "var(--muted)" }}>No hay órdenes.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 10 }}>Fecha</th>
                <th style={{ textAlign: "left", padding: 10 }}>Order</th>
                <th style={{ textAlign: "left", padding: 10 }}>Entrada</th>
                <th style={{ textAlign: "right", padding: 10 }}>Cant.</th>
                <th style={{ textAlign: "left", padding: 10 }}>Nombre</th>
                <th style={{ textAlign: "left", padding: 10 }}>Email</th>
                <th style={{ textAlign: "left", padding: 10 }}>DNI</th>
                <th style={{ textAlign: "left", padding: 10 }}>Nacimiento</th>
                <th style={{ textAlign: "left", padding: 10 }}>Estado</th>
                <th style={{ textAlign: "left", padding: 10 }}>Pago</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="mono" style={{ padding: 10, whiteSpace: "nowrap" }}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}
                  </td>
                  <td className="mono" style={{ padding: 10 }}>{o.orderId}</td>
                  <td style={{ padding: 10 }}>{o.title || "-"}</td>
                  <td className="mono" style={{ padding: 10, textAlign: "right" }}>{o.quantity ?? "-"}</td>
                  <td style={{ padding: 10 }}>
                    {(o.buyer_firstName || "") + (o.buyer_lastName ? ` ${o.buyer_lastName}` : "") || "-"}
                  </td>
                  <td className="mono" style={{ padding: 10 }}>{o.buyer_email || "-"}</td>
                  <td className="mono" style={{ padding: 10 }}>{o.buyer_dni || "-"}</td>
                  <td className="mono" style={{ padding: 10 }}>{o.buyer_birthdate || "-"}</td>
                  <td className="mono" style={{ padding: 10 }}>{o.status || "-"}</td>
                  <td className="mono" style={{ padding: 10 }}>{o.paymentId || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";

export default function ClientsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  const [q, setQ] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [q]);

  async function load() {
    setLoading(true);
    setErr(null);
    setSelected(new Set());
    try {
      const data = await apiFetch(`/admin/orders${query ? `?${query}` : ""}`);
      setOrders(data.orders || []);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === orders.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orders.map((o) => o._id)));
    }
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!window.confirm(`¿Eliminar ${selected.size} orden${selected.size > 1 ? "es" : ""}? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      await apiFetch("/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      await load();
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setDeleting(false);
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
    <button className="btn" type="button" onClick={load} disabled={loading || deleting}>
      {loading ? "Cargando..." : "Actualizar"}
    </button>
    {selected.size > 0 && (
      <button
        className="btn"
        type="button"
        onClick={deleteSelected}
        disabled={deleting}
        style={{ borderColor: "rgba(239,68,68,.4)", color: "rgba(239,68,68,.9)" }}
      >
        {deleting ? "Eliminando..." : `Eliminar (${selected.size})`}
      </button>
    )}
  </div>
</div>

      <div className="hr" />

      <div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por orderId, email o DNI..."
          style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)", width: "100%", boxSizing: "border-box" }}
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
          <table className="table" style={{ width: "100%", borderCollapse: "collapse", whiteSpace: "nowrap" }}>
            <thead>
              <tr>
                <th style={{ padding: 10, width: 36 }}>
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selected.size === orders.length}
                    onChange={toggleAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
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
                <tr key={o._id} style={{ background: selected.has(o._id) ? "rgba(139,92,246,.08)" : undefined }}>
                  <td style={{ padding: 10 }}>
                    <input
                      type="checkbox"
                      checked={selected.has(o._id)}
                      onChange={() => toggleOne(o._id)}
                      style={{ cursor: "pointer" }}
                    />
                  </td>
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
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../../lib/api";

export default function ClientOrderDetailPage() {
  const { orderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const data = await apiFetch(`/admin/orders/${encodeURIComponent(orderId)}`);
        setOrder(data.order);
      } catch (e) {
        setErr(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderId]);

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Detalle de orden</h2>
          <p style={{ margin: "6px 0 0", color: "var(--muted)", lineHeight: 1.55 }}>
            OrderId: <span className="mono">{orderId}</span>
          </p>
        </div>

        <Link to="/admin/clients" className="btn" style={{ textDecoration: "none" }}>
          Volver
        </Link>
      </div>

      <div className="hr" />

      {loading ? (
        <p style={{ margin: 0, color: "var(--muted)" }}>Cargando...</p>
      ) : err ? (
        <div className="notice error">
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Error</div>
          <div className="mono">{err}</div>
        </div>
      ) : !order ? (
        <p style={{ margin: 0, color: "var(--muted)" }}>No encontrada.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          <div className="row">
            <div className="label">Estado</div>
            <div className="value mono">{order.status}</div>
          </div>

          <div className="row">
            <div className="label">Entrada</div>
            <div className="value">{order.title || "-"}</div>
          </div>

          <div className="row">
            <div className="label">Cantidad</div>
            <div className="value mono">{order.quantity ?? "-"}</div>
          </div>

          <div className="row">
            <div className="label">Unit price</div>
            <div className="value mono">{order.unit_price ?? "-"} {order.currency_id || ""}</div>
          </div>

          <div className="row">
            <div className="label">Monto pagado</div>
            <div className="value mono">{order.transaction_amount ?? "-"} {order.currency_id || ""}</div>
          </div>

          <div className="row">
            <div className="label">PaymentId</div>
            <div className="value mono">{order.paymentId || "-"}</div>
          </div>

          <div className="hr" />

          <div className="row">
            <div className="label">Nombre</div>
            <div className="value">
              {(order.buyer_firstName || "") + (order.buyer_lastName ? ` ${order.buyer_lastName}` : "") || "-"}
            </div>
          </div>

          <div className="row">
            <div className="label">Email</div>
            <div className="value mono">{order.buyer_email || "-"}</div>
          </div>

          <div className="row">
            <div className="label">DNI</div>
            <div className="value mono">{order.buyer_dni || "-"}</div>
          </div>

          <div className="row">
            <div className="label">Nacimiento</div>
            <div className="value mono">{order.buyer_birthdate || "-"}</div>
          </div>

          <div className="row">
            <div className="label">Creada</div>
            <div className="value mono">
              {order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}
            </div>
          </div>

          <div className="row">
            <div className="label">Último webhook</div>
            <div className="value mono">
              {order.lastWebhookAt ? new Date(order.lastWebhookAt).toLocaleString() : "-"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
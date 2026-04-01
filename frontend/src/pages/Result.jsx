import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/Card";
import StatusBadge from "../components/StatusBadge";
import { getOrder } from "../api/mp";

function useOrderId() {
  const { search } = useLocation();
  return useMemo(() => {
    const qs = new URLSearchParams(search);
    return qs.get("orderId") || localStorage.getItem("lastOrderId") || null;
  }, [search]);
}

function titleFromStatus(status) {
  switch (status) {
    case "approved":
      return "Pago acreditado";
    case "pending":
      return "Pago pendiente";
    case "created":
      return "Orden creada (sin pagar)";
    case "rejected":
      return "Pago rechazado";
    case "cancelled":
      return "Pago cancelado";
    case "refunded":
      return "Pago reembolsado";
    default:
      return "Estado del pago";
  }
}

export default function Result() {
  const orderId = useOrderId();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setError("No tengo orderId (URL/localStorage). Volvé al inicio y generá un pago.");
      return;
    }

    let timer;

    async function load() {
      try {
        const data = await getOrder(orderId);
        setOrder(data);
        setError(null);
        if (data.status === "pending") timer = setTimeout(load, 2000);
      } catch (e) {
        setError(String(e?.message || e));
      }
    }

    load();
    return () => timer && clearTimeout(timer);
  }, [orderId]);

  return (
    <Layout>
      <Card
        title={order ? titleFromStatus(order.status) : "Verificando..."}
        subtitle="Este estado sale del backend (webhook), no del redirect."
      >
        {error && (
          <div className="notice error" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Error</div>
            <div className="mono">{error}</div>
          </div>
        )}

        {!error && !order && <p style={{ marginTop: 12 }}>Cargando...</p>}

        {order && (
          <>
            <div style={{ marginTop: 10, marginBottom: 12 }}>
              <StatusBadge status={order.status} />
            </div>

            <div className="row">
              <div className="label">OrderId</div>
              <div className="value mono">{order.orderId}</div>
            </div>

            <div className="row">
              <div className="label">PaymentId</div>
              <div className="value mono">{order.paymentId || "-"}</div>
            </div>

            <div className="row">
              <div className="label">Monto</div>
              <div className="value">
                {order.transaction_amount ?? "-"} {order.currency_id || ""}
              </div>
            </div>

            <div className="row">
              <div className="label">Live mode</div>
              <div className="value mono">{String(order.live_mode)}</div>
            </div>

            <details style={{ marginTop: 14 }}>
              <summary>Ver JSON</summary>
              <pre className="mono">{JSON.stringify(order, null, 2)}</pre>
            </details>
          </>
        )}

        <div className="hr" />

        <Link to="/">← Volver</Link>
      </Card>
    </Layout>
  );
}
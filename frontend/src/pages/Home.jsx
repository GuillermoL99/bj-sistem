import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import { createPreference } from "../api/mp";

export default function Home() {
  const UNIT_PRICE = 10; // ARS

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastOrderId, setLastOrderId] = useState(null);

  const [quantity, setQuantity] = useState(1);

  const total = useMemo(() => UNIT_PRICE * quantity, [quantity]);

  useEffect(() => {
    setLastOrderId(localStorage.getItem("lastOrderId"));
  }, []);

  async function pagar() {
    setLoading(true);
    setError(null);
    try {
      const data = await createPreference({
        title: "Entrada General",
        unit_price: UNIT_PRICE,
        quantity,
        buyer_email: "comprador@test.com",
      });

      localStorage.setItem("lastOrderId", data.orderId);
      setLastOrderId(data.orderId);

      const url = data.init_point || data.sandbox_init_point;
      if (!url) throw new Error("No vino init_point/sandbox_init_point");

      window.location.href = url;
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="grid">
        <Card
          title="Entradas"
          subtitle="Compra rápida. El estado se confirma por webhook."
        >
          <div className="hr" />

          <div className="row">
            <div className="label">Producto</div>
            <div className="value">Entrada General</div>
          </div>

          <div className="row">
            <div className="label">Precio unitario</div>
            <div className="value">{UNIT_PRICE} ARS</div>
          </div>

          <div className="row" style={{ alignItems: "center" }}>
            <div className="label">Cantidad</div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                className="btn"
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={loading || quantity === 1}
                aria-label="Disminuir cantidad"
              >
                −
              </button>

              <div className="value mono" style={{ minWidth: 28, textAlign: "center" }}>
                {quantity}
              </div>

              <button
                className="btn"
                type="button"
                onClick={() => setQuantity((q) => Math.min(6, q + 1))}
                disabled={loading || quantity === 6}
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>
          </div>

          <div className="row">
            <div className="label">Total</div>
            <div className="value">{total} ARS</div>
          </div>

          <div className="hr" />

          <Button variant="primary" onClick={pagar} disabled={loading}>
            {loading ? "Creando pago..." : "Pagar con Mercado Pago"}
          </Button>

          <p style={{ marginTop: 12, marginBottom: 0, color: "var(--muted)" }}>
            Máximo 6 entradas por compra.
          </p>

          {error && (
            <div className="notice error" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Error</div>
              <div className="mono">{error}</div>
            </div>
          )}
        </Card>

        <Card
          title="Tu última orden"
          subtitle="Si cerrás Mercado Pago, podés volver y ver el estado."
        >
          {lastOrderId ? (
            <div className="notice" style={{ marginTop: 10 }}>
              <div className="label">orderId</div>
              <div className="mono">{lastOrderId}</div>
              <div style={{ marginTop: 10 }}>
                <a href={`/success`} style={{ color: "var(--text)" }}>
                  Ver estado →
                </a>
              </div>
            </div>
          ) : (
            <p style={{ marginTop: 10 }}>Todavía no generaste una orden.</p>
          )}
        </Card>
      </div>
    </Layout>
  );
}
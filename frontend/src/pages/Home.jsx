import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import { createPreference } from "../api/mp";

export default function Home() {
  // IMPORTANTE:
  // 1) Creá un TicketType en tu DB (desde admin más adelante o directo en Mongo).
  // 2) Copiá su "id" (ObjectId) y pegalo acá.
  const TICKET_ID = "69cce18fbb6b9de5728e4ac0";

  // Por ahora dejamos estos hardcodeados para no complicar la UI todavía.
  // Más adelante los vamos a traer desde GET /tickets.
  const UNIT_PRICE = 10; // ARS
  const PRODUCT_NAME = "Entrada General";

  const nav = useNavigate();

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
      if (!TICKET_ID || TICKET_ID === "blablabla") {
        throw new Error(
          "Falta configurar TICKET_ID en Home.jsx. Pegá el id de tu entrada (TicketType) desde Mongo o desde GET /tickets."
        );
      }

      const data = await createPreference({
        ticketId: TICKET_ID,
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

  function goToAdminLogin() {
    nav("/admin/login");
  }

  return (
    <Layout>
      <div className="grid">
        <Card title="Entradas">
          <div className="hr" />

          <div className="row">
            <div className="label">Producto</div>
            <div className="value">{PRODUCT_NAME}</div>
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
                onClick={() => setQuantity((q) => Math.min(3, q + 1))}
                disabled={loading || quantity === 3}
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

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <Button variant="primary" onClick={pagar} disabled={loading}>
                {loading ? "Creando pago..." : "Pagar con Mercado Pago"}
              </Button>
            </div>
          </div>

          <p style={{ marginTop: 12, marginBottom: 0, color: "var(--muted)" }}>
            Máximo 3 entradas por compra.
          </p>

          {error && (
            <div className="notice error" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Error</div>
              <div className="mono">{error}</div>
            </div>
          )}

          {/* Si querés, esto lo podés usar para debug */}
          {lastOrderId && (
            <p style={{ marginTop: 12, marginBottom: 0, color: "var(--muted)" }}>
              Última orden: <span className="mono">{lastOrderId}</span>
            </p>
          )}

          {/* Botón/atajo al login admin (si lo estabas usando antes) */}
          <div style={{ marginTop: 12 }}>
            <button className="btn" type="button" onClick={goToAdminLogin}>
              Admin
            </button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
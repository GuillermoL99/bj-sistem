

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import { createPreference } from "../api/mp";
import { getTickets } from "../api/tickets";
import { checkout } from "../api/checkout";

function TicketBuyCard({ t, paying, onPay }) {
  const stock = Number(t.stock ?? 0);
  const maxQty = Math.max(0, Math.min(3, stock));

  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(false);

  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerDni, setBuyerDni] = useState("");
  const [buyerBirthdate, setBuyerBirthdate] = useState("");
  const [buyerFirstName, setBuyerFirstName] = useState("");
  const [buyerLastName, setBuyerLastName] = useState("");

  // Si cambia el stock (por refresh), ajustamos qty
  useEffect(() => {
    setQty((q) => {
      if (maxQty <= 0) return 1;
      return Math.min(Math.max(1, q), maxQty);
    });
  }, [maxQty]);

  const total = useMemo(() => Number(t.priceARS ?? 0) * qty, [t.priceARS, qty]);
  const disabled = paying || maxQty === 0;

  return (
    <section className="card">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 20, lineHeight: 1.25 }}>{t.name}</h2>
          
        </div>

        <span className={`badge ${stock > 0 ? "ok" : "bad"}`}>
          <span className="dot" />
          {stock > 0 ? "Disponible" : "Sin stock"}
        </span>
      </div>

      <div className="hr" />

      <div className="row">
        <div className="label">Stock</div>
        <div className="value mono">{stock}</div>
      </div>

      

      <div className="row">
        <div className="label">Total</div>
        <div className="value">{total} ARS</div>
      </div>

      <div className="hr" />

      <Button variant="primary" onClick={() => setOpen((v) => !v)} disabled={disabled}>
        {paying ? "Creando pago..." : stock > 0 ? (open ? "Cerrar" : "Pagar") : "Sin stock"}
      </Button>

      {open && (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <div className="row" style={{ alignItems: "center" }}>
  <div className="label">Nombre</div>
  <input
    value={buyerFirstName}
    onChange={(e) => setBuyerFirstName(e.target.value)}
    placeholder="Juan"
    disabled={paying}
    style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
  />
</div>

<div className="row" style={{ alignItems: "center" }}>
  <div className="label">Apellido</div>
  <input
    value={buyerLastName}
    onChange={(e) => setBuyerLastName(e.target.value)}
    placeholder="Pérez"
    disabled={paying}
    style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
  />
</div>
          <div className="row" style={{ alignItems: "center" }}>
            <div className="label">Email</div>
            <input
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="tu@mail.com"
              disabled={paying}
              style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
            />
          </div>

          <div className="row" style={{ alignItems: "center" }}>
            <div className="label">DNI</div>
            <input
              inputMode="numeric"
              value={buyerDni}
              onChange={(e) => setBuyerDni(e.target.value.replace(/\D/g, ""))}
              placeholder="12345678"
              disabled={paying}
              style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
            />
          </div>

          <div className="row" style={{ alignItems: "center" }}>
            <div className="label">Nacimiento</div>
            <input
              type="date"
              value={buyerBirthdate}
              onChange={(e) => setBuyerBirthdate(e.target.value)}
              disabled={paying}
              style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
            />
          </div>

          <Button
            variant="primary"
            onClick={() =>
              onPay(t, qty, {
                buyer_email: buyerEmail,
                buyer_dni: buyerDni,
                buyer_birthdate: buyerBirthdate,
                buyer_firstName: buyerFirstName,
                buyer_lastName: buyerLastName,
              })
            }
            disabled={paying || !buyerEmail.trim() || !buyerDni.trim() || !buyerBirthdate.trim()}
          >
            {paying ? "Creando pago..." : "Continuar a pago"}
          </Button>

          
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const nav = useNavigate();

  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState(null);
  const [tickets, setTickets] = useState([]);

  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);

  const [lastOrderId, setLastOrderId] = useState(null);

  useEffect(() => {
    setLastOrderId(localStorage.getItem("lastOrderId"));
  }, []);

  async function loadTickets() {
    setTicketsLoading(true);
    setTicketsError(null);
    try {
      const data = await getTickets();
      setTickets(data?.tickets || []);
    } catch (e) {
      setTicketsError(String(e?.message || e));
    } finally {
      setTicketsLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function pay(ticket, quantity, buyer) {
    setPaying(true);
    setError(null);

    try {
      const stock = Number(ticket.stock ?? 0);
      if (stock <= 0) throw new Error("No hay stock disponible para esta entrada.");
      if (quantity > stock) throw new Error("La cantidad supera el stock disponible.");

      // 1) checkout -> orderId
      const c = await checkout({
        ticketId: ticket.id,
        quantity,
        ...buyer,
      });

      localStorage.setItem("lastOrderId", c.orderId);
      setLastOrderId(c.orderId);

      // 2) preference con orderId
      const data = await createPreference({ orderId: c.orderId });

      // en sandbox, preferimos sandbox_init_point
      const url = data.sandbox_init_point || data.init_point;
      if (!url) throw new Error("No vino init_point/sandbox_init_point");

      window.location.href = url;
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setPaying(false);
    }
  }

  function goToAdminLogin() {
    nav("/admin/login");
  }

  return (
    <Layout>
      <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
        <Card>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22 }}>Entradas</h2>
              <p style={{ margin: "6px 0 0", color: "var(--muted)", lineHeight: 1.55 }}>
                Elegí tu entrada y pagá con Mercado Pago.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="btn" type="button" onClick={loadTickets} disabled={ticketsLoading || paying}>
                {ticketsLoading ? "Cargando..." : "Actualizar"}
              </button>
            </div>
          </div>

          <div className="hr" />

          {ticketsLoading && <p style={{ margin: 0, color: "var(--muted)" }}>Cargando entradas...</p>}

          {!ticketsLoading && ticketsError && (
            <div className="notice error" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Error</div>
              <div className="mono">{ticketsError}</div>
            </div>
          )}

          {!ticketsLoading && !ticketsError && tickets.length === 0 && (
            <p style={{ margin: 0, color: "var(--muted)" }}>No hay entradas disponibles.</p>
          )}

          {!ticketsLoading && !ticketsError && tickets.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 12,
                alignItems: "start",
              }}
            >
              {tickets.map((t) => (
                <TicketBuyCard key={t.id} t={t} paying={paying} onPay={pay} />
              ))}
            </div>
          )}

          {error && (
            <div className="notice error" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Error</div>
              <div className="mono">{error}</div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
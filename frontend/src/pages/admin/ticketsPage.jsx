import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { apiFetch } from "../../lib/api";

function TicketCard({ t, busy, onToggleActive, onSave }) {
  const [name, setName] = useState(t.name || "");
  const [priceARS, setPriceARS] = useState(String(t.priceARS ?? ""));
  const [stock, setStock] = useState(String(t.stock ?? ""));

  // Si se recarga la lista, sincronizamos el form
  useEffect(() => {
    setName(t.name || "");
    setPriceARS(String(t.priceARS ?? ""));
    setStock(String(t.stock ?? ""));
  }, [t.id, t.name, t.priceARS, t.stock]);

  const changed =
    name.trim() !== (t.name || "") ||
    Number(priceARS) !== Number(t.priceARS) ||
    Number(stock) !== Number(t.stock);

  const invalid =
    !name.trim() ||
    !Number.isFinite(Number(priceARS)) ||
    Number(priceARS) <= 0 ||
    !Number.isInteger(Number(stock)) ||
    Number(stock) < 0;

  return (
    <section className="card">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.25 }}>{t.name}</h2>
          <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
            <span className="mono">id:</span> <span className="mono">{t.id}</span>
          </p>
        </div>

        <span className={`badge ${t.active ? "ok" : "bad"}`}>
          <span className="dot" />
          {t.active ? "Activa" : "Inactiva"}
        </span>
      </div>

      <div className="hr" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            Nombre
          </div>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
        </div>

        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            Precio (ARS)
          </div>
          <input className="input" value={priceARS} onChange={(e) => setPriceARS(e.target.value)} disabled={busy} />
        </div>

        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            Stock
          </div>
          <input className="input" value={stock} onChange={(e) => setStock(e.target.value)} disabled={busy} />
        </div>

        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            Info
          </div>

          <div className="notice" style={{ margin: 0 }}>
            <div className="mono">Precio actual: {t.priceARS} ARS</div>
            <div className="mono">Stock actual: {t.stock}</div>
          </div>
        </div>
      </div>

      <div className="hr" />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" type="button" onClick={onToggleActive} disabled={busy}>
            {busy ? "Guardando..." : t.active ? "Desactivar" : "Activar"}
          </button>

          <Button
            variant="primary"
            onClick={() =>
              onSave({
                name: name.trim(),
                priceARS: Number(priceARS),
                stock: Number(stock),
              })
            }
            disabled={busy || !changed || invalid}
          >
            {busy ? "Guardando..." : changed ? "Guardar cambios" : "Guardado"}
          </Button>
        </div>

        {invalid && (
          <span className="mono" style={{ color: "rgba(255,255,255,.72)" }}>
            Revisá nombre, precio (&gt; 0) y stock (&ge; 0).
          </span>
        )}
      </div>
    </section>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [err, setErr] = useState("");

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);

  // form create
  const [newName, setNewName] = useState("");
  const [newPriceARS, setNewPriceARS] = useState("");
  const [newStock, setNewStock] = useState("");

  const stats = useMemo(() => {
    const total = tickets.length;
    const active = tickets.filter((t) => t.active).length;
    const noStock = tickets.filter((t) => (t.stock ?? 0) <= 0).length;
    return { total, active, noStock };
  }, [tickets]);

  async function loadTickets() {
    setErr("");
    setLoading(true);
    try {
      const data = await apiFetch("/admin/tickets");
      setTickets(data.tickets || []);
    } catch (e) {
      setErr(e?.data?.error || "load_failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function createTicket(e) {
    e.preventDefault();
    if (creating || loading || busyId) return;

    setErr("");
    setCreating(true);
    try {
      await apiFetch("/admin/tickets", {
        method: "POST",
        body: JSON.stringify({
          name: String(newName || "").trim(),
          priceARS: Number(newPriceARS),
          stock: Number(newStock),
        }),
      });

      setNewName("");
      setNewPriceARS("");
      setNewStock("");
      await loadTickets();
    } catch (e) {
      setErr(e?.data?.error || "create_failed");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(t) {
    if (busyId || creating || loading) return;

    setErr("");
    setBusyId(t.id);
    try {
      await apiFetch(`/admin/tickets/${t.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !t.active }),
      });
      await loadTickets();
    } catch (e) {
      setErr(e?.data?.error || "update_failed");
    } finally {
      setBusyId(null);
    }
  }

  async function saveTicket(t, patch) {
    if (busyId || creating || loading) return;

    setErr("");
    setBusyId(t.id);
    try {
      await apiFetch(`/admin/tickets/${t.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      await loadTickets();
    } catch (e) {
      setErr(e?.data?.error || "update_failed");
    } finally {
      setBusyId(null);
    }
  }

  const createDisabled =
    creating ||
    loading ||
    !!busyId ||
    !String(newName || "").trim() ||
    !Number.isFinite(Number(newPriceARS)) ||
    Number(newPriceARS) <= 0 ||
    !Number.isInteger(Number(newStock)) ||
    Number(newStock) < 0;

  return (
    <div className="adminPage">
      <Card title="Entradas">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span className="badge">
            <span className="dot" />
            Total: <span style={{ color: "var(--text)", fontWeight: 700 }}>{stats.total}</span>
          </span>

          <span className="badge ok">
            <span className="dot" />
            Activas: <span style={{ color: "var(--text)", fontWeight: 700 }}>{stats.active}</span>
          </span>

          <span className="badge warn">
            <span className="dot" />
            Sin stock: <span style={{ color: "var(--text)", fontWeight: 700 }}>{stats.noStock}</span>
          </span>

          <div style={{ marginLeft: "auto" }}>
            <button className="btn" type="button" onClick={loadTickets} disabled={loading || creating || !!busyId}>
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>

        <div className="hr" />

        {err && (
          <div className="notice error" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Error</div>
            <div className="mono">{err}</div>
          </div>
        )}

        <form onSubmit={createTicket} style={{ display: "grid", gridTemplateColumns: "1.2fr .7fr .7fr", gap: 12 }}>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Nombre</div>
            <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Entrada VIP" />
          </div>

          <div>
            <div className="label" style={{ marginBottom: 6 }}>Precio (ARS)</div>
            <input className="input" value={newPriceARS} onChange={(e) => setNewPriceARS(e.target.value)} placeholder="5000" />
          </div>

          <div>
            <div className="label" style={{ marginBottom: 6 }}>Stock</div>
            <input className="input" value={newStock} onChange={(e) => setNewStock(e.target.value)} placeholder="50" />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ minWidth: 220 }}>
              <Button variant="primary" disabled={createDisabled}>
                {creating ? "Creando..." : "Crear entrada"}
              </Button>
            </div>

          </div>
        </form>

        <div className="hr" />

        {loading ? (
          <p style={{ margin: 0, color: "var(--muted)" }}>Cargando entradas...</p>
        ) : tickets.length === 0 ? (
          <p style={{ margin: 0, color: "var(--muted)" }}>No hay entradas todavía.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 12,
              alignItems: "start",
            }}
          >
            {tickets.map((t) => (
              <TicketCard
                key={t.id}
                t={t}
                busy={busyId === t.id}
                onToggleActive={() => toggleActive(t)}
                onSave={(patch) => saveTicket(t, patch)}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
import { useEffect, useRef, useState } from "react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { apiFetch } from "../../lib/api";
import { Html5Qrcode } from "html5-qrcode";

const SCANNER_ID = "qr-reader";

const RESULT_CONFIG = {
  valid: {
    border: "rgba(34,197,94,.4)",
    bg: "rgba(34,197,94,.08)",
    title: "✅ Entrada válida",
    color: "var(--accent2)",
  },
  already_used: {
    border: "rgba(239,68,68,.4)",
    bg: "rgba(239,68,68,.08)",
    title: "❌ Ya fue usada",
    color: "rgba(239,68,68,.9)",
  },
  not_found: {
    border: "rgba(239,68,68,.4)",
    bg: "rgba(239,68,68,.08)",
    title: "❌ QR no encontrado",
    color: "rgba(239,68,68,.9)",
  },
  not_approved: {
    border: "rgba(245,158,11,.4)",
    bg: "rgba(245,158,11,.08)",
    title: "⚠️ Pago no aprobado",
    color: "var(--warn)",
  },
  server_error: {
    border: "rgba(239,68,68,.4)",
    bg: "rgba(239,68,68,.08)",
    title: "❌ Error del servidor",
    color: "rgba(239,68,68,.9)",
  },
};

function ScannerView({ onResult, onCancel }) {
  const calledRef = useRef(false);
  const scannerRef = useRef(null);

  async function handleDecoded(scanner, decodedText) {
    if (calledRef.current) return;
    calledRef.current = true;
    try { await scanner.stop(); scanner.clear(); } catch (_) {}
    scannerRef.current = null;

    let data;
    try {
      data = await apiFetch("/admin/scan", {
        method: "POST",
        body: JSON.stringify({ orderId: decodedText.trim() }),
      });
    } catch (e) {
      data = e?.data || { ok: false, code: "server_error" };
    }
    onResult(data);
  }

  useEffect(() => {
    calledRef.current = false;
    let mounted = true;

    async function init() {
      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;

      const config = { fps: 10, qrbox: { width: 260, height: 260 } };
      const cb = (text) => { if (mounted) handleDecoded(scanner, text); };

      try {
        // Intentar cámara trasera primero
        await scanner.start({ facingMode: "environment" }, config, cb, () => {});
      } catch (_) {
        try {
          // Fallback: cualquier cámara disponible
          await scanner.start({ facingMode: "user" }, config, cb, () => {});
        } catch (__) {
          if (mounted) onCancel();
        }
      }
    }

    init();

    return () => {
      mounted = false;
      if (scannerRef.current && !calledRef.current) {
        scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => {});
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div
        id={SCANNER_ID}
        style={{ width: "100%", maxWidth: 360, margin: "0 auto 16px", borderRadius: 14, overflow: "hidden" }}
      />
      <button className="btn" type="button" onClick={onCancel} style={{ marginBottom: 8 }}>
        Cancelar
      </button>
    </div>
  );
}

export default function ScanPage() {
  const [active, setActive] = useState(false);
  const [result, setResult] = useState(null);
  const [manual, setManual] = useState("");
  const [loadingManual, setLoadingManual] = useState(false);

  const cfg = result ? (RESULT_CONFIG[result.code] || RESULT_CONFIG.server_error) : null;

  async function submitManual(e) {
    e.preventDefault();
    if (!manual.trim()) return;
    setLoadingManual(true);
    const val = manual.trim();
    // Si son 6 dígitos numéricos → ticketCode, sino → orderId
    const isCode = /^\d{6}$/.test(val);
    let data;
    try {
      data = await apiFetch("/admin/scan", {
        method: "POST",
        body: JSON.stringify(isCode ? { ticketCode: val } : { orderId: val }),
      });
    } catch (err) {
      data = err?.data || { ok: false, code: "server_error" };
    } finally {
      setLoadingManual(false);
    }
    setManual("");
    setResult(data);
  }

  return (
    <div className="adminPage">
      <Card title="Escanear QR">
        <div className="hr" />

        {active && (
          <ScannerView
            onResult={(data) => { setResult(data); setActive(false); }}
            onCancel={() => setActive(false)}
          />
        )}

        {!active && result && cfg && (
          <div
            style={{
              border: `1px solid ${cfg.border}`,
              background: cfg.bg,
              borderRadius: 14,
              padding: 18,
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 18, color: cfg.color, marginBottom: 10 }}>
              {cfg.title}
            </div>

            {result.ok && result.order && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="mono">Orden: {result.order.orderId}</div>
                <div className="mono">Entrada: {result.order.title || "-"}</div>
                <div className="mono">
                  Nombre: {[result.order.buyer_firstName, result.order.buyer_lastName].filter(Boolean).join(" ") || "-"}
                </div>
                <div className="mono">DNI: {result.order.buyer_dni || "-"}</div>
                <div className="mono">Cantidad: {result.order.quantity ?? "-"}</div>
              </div>
            )}

            {result.code === "already_used" && result.scannedAt && (
              <div className="mono" style={{ marginTop: 6 }}>
                Escaneada el: {new Date(result.scannedAt).toLocaleString()}
              </div>
            )}

            {result.code === "not_approved" && (
              <div className="mono" style={{ marginTop: 6 }}>
                Estado del pago: {result.status || "-"}
              </div>
            )}
          </div>
        )}

        {!active && (
          <Button variant="primary" onClick={() => { setResult(null); setActive(true); }}>
            {result ? "Escanear otro" : "Abrir cámara"}
          </Button>
        )}

        <div className="hr" />

        <form onSubmit={submitManual} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 200 }}
            placeholder="Código de 6 dígitos o orderId..."
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            disabled={loadingManual}
          />
          <button className="btn" type="submit" disabled={!manual.trim() || loadingManual}>
            {loadingManual ? "Validando..." : "Validar"}
          </button>
        </form>

        <p style={{ marginTop: 12, marginBottom: 0, color: "var(--muted)", fontSize: 13 }}>
          Recomendado: usar Chrome en Android para mejor compatibilidad con cámara.
        </p>
      </Card>
    </div>
  );
}

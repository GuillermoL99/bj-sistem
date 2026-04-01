const API_BASE = "http://localhost:3001";

export async function createPreference(payload) {
  const r = await fetch(`${API_BASE}/mp/create-preference`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Error creando preferencia");
  return data; // { orderId, init_point, sandbox_init_point, ... }
}

export async function getOrder(orderId) {
  const r = await fetch(`${API_BASE}/orders/${orderId}`);
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Error consultando orden");
  return data;
}
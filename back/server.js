import express from "express";
import cors from "cors";
import "dotenv/config";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const app = express();

app.use(cors());
app.use(express.json());

// ===== "DB" EN MEMORIA (solo para pruebas) =====
// Se pierde al reiniciar el servidor.
const orders = new Map(); // key: orderId, value: { ... }

// Opcional: para que no diga "Cannot GET /"
app.get("/", (req, res) => {
  res.send("OK backend running");
});

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "backend", date: new Date().toISOString() });
});

// ===== API para consultar estado de una orden =====
app.get("/orders/:orderId", (req, res) => {
  const { orderId } = req.params;
  const order = orders.get(orderId);

  if (!order) {
    return res.status(404).json({ error: "order_not_found", orderId });
  }

  res.json(order);
});

// Config Mercado Pago (TOKEN DEL VENDEDOR)
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// Crear preferencia de pago
app.post("/mp/create-preference", async (req, res) => {
  try {
    const {
      title = "Entrada General",
      unit_price = 10,
      quantity = 1,
      buyer_email,
    } = req.body || {};

    const orderId = `ORDER_${Date.now()}`;

    // Guardamos la orden en memoria como "created"
    orders.set(orderId, {
      orderId,
      title,
      unit_price: Number(unit_price),
      quantity: Number(quantity),
      buyer_email: buyer_email || null,
      status: "created", // created | pending | approved | rejected | refunded | cancelled | unknown
      paymentId: null,
      live_mode: null,
      transaction_amount: null,
      currency_id: "ARS",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const preference = new Preference(mpClient);

    const result = await preference.create({
      body: {
        items: [
          {
            title,
            quantity: Number(quantity),
            unit_price: Number(unit_price),
            currency_id: "ARS",
          },
        ],
        payer: buyer_email ? { email: buyer_email } : undefined,

        // IMPORTANTÍSIMO: esto vincula el pago con tu orden
        external_reference: orderId,

        back_urls: {
          success: "http://localhost:5173/success",
          pending: "http://localhost:5173/pending",
          failure: "http://localhost:5173/failure",
        },

        // Fuerza el webhook para esta preferencia (ideal con ngrok)
        notification_url: `${process.env.BASE_URL}/mp/webhook`,
      },
    });

    // Guardamos info de la preferencia para debug
    const prev = orders.get(orderId);
    orders.set(orderId, {
      ...prev,
      preferenceId: result.id || null,
      init_point: result.init_point || null,
      sandbox_init_point: result.sandbox_init_point || null,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      orderId,
      preferenceId: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (err) {
    console.error("Error creando preferencia:", err);
    res.status(500).json({
      error: "Error creando preferencia",
      details: String(err?.message || err),
    });
  }
});

// ===== WEBHOOK MERCADO PAGO =====
app.post("/mp/webhook", async (req, res) => {
  // responder rápido para que MP no reintente por timeout
  res.sendStatus(200);

  try {
    const topic =
      req.query?.type ||
      req.query?.topic ||
      req.body?.type ||
      req.body?.topic;

    console.log("WEBHOOK MP (raw):", {
      topic,
      query: req.query,
      body: req.body,
    });

    // Ignoramos merchant_order u otros para no ensuciar la consola
    if (topic && topic !== "payment") {
      console.log(`WEBHOOK MP: ignorado porque topic=${topic}`);
      return;
    }

    const paymentId =
      req.query?.["data.id"] ||
      req.query?.id ||
      req.body?.data?.id ||
      req.body?.id ||
      req.body?.resource;

    if (!paymentId) {
      console.log("WEBHOOK MP: no vino paymentId (evento payment)");
      return;
    }

    const payment = new Payment(mpClient);
    const paymentInfo = await payment.get({ id: String(paymentId) });

    console.log("WEBHOOK MP (payment):", {
      id: paymentInfo.id,
      status: paymentInfo.status,
      status_detail: paymentInfo.status_detail,
      external_reference: paymentInfo.external_reference,
      transaction_amount: paymentInfo.transaction_amount,
      live_mode: paymentInfo.live_mode,
    });

    const orderId = paymentInfo.external_reference;

    // Si no vino external_reference, no sabemos qué orden actualizar
    if (!orderId) {
      console.log("WEBHOOK MP: payment sin external_reference, no se puede asociar a orden");
      return;
    }

    // Creamos/actualizamos la orden en memoria (idempotente)
    const existing = orders.get(orderId) || {
      orderId,
      title: null,
      unit_price: null,
      quantity: null,
      buyer_email: null,
      currency_id: null,
      createdAt: new Date().toISOString(),
    };

    orders.set(orderId, {
      ...existing,
      status: paymentInfo.status || "unknown",
      paymentId: String(paymentInfo.id),
      live_mode: Boolean(paymentInfo.live_mode),
      transaction_amount: paymentInfo.transaction_amount ?? null,
      updatedAt: new Date().toISOString(),
      lastWebhookAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Error procesando webhook:", e);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});
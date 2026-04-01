import express from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

import authRoutes from "./src/routes/auth.js";
import adminUsersRoutes from "./src/routes/adminUsers.js";
import User from "./src/models/User.js";
import Order from "./src/models/Orders.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("OK backend running"));
app.get("/health", (req, res) =>
  res.json({ ok: true, service: "backend", date: new Date().toISOString() })
);

app.use("/auth", authRoutes);
app.use("/admin/users", adminUsersRoutes);

app.get("/orders/:orderId", async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOne({ orderId }).lean();
  if (!order) return res.status(404).json({ error: "order_not_found", orderId });

  res.json(order);
});

function buildWebhookUrl() {
  const base = (process.env.BASE_URL || "").trim().replace(/\/+$/, "");
  if (!base) return null;
  if (!base.startsWith("https://")) return null;
  return `${base}/mp/webhook`;
}

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

app.post("/mp/create-preference", async (req, res) => {
  try {
    const { title = "Entrada General", unit_price = 10, quantity = 1, buyer_email } = req.body || {};
    const orderId = `ORDER_${Date.now()}`;

    await Order.create({
      orderId,
      title,
      unit_price: Number(unit_price),
      quantity: Number(quantity),
      buyer_email: buyer_email || null,
      status: "created",
      currency_id: "ARS",
    });

    const preference = new Preference(mpClient);
    const webhookUrl = buildWebhookUrl();

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
        external_reference: orderId,
        back_urls: {
          success: "http://localhost:5173/success",
          pending: "http://localhost:5173/pending",
          failure: "http://localhost:5173/failure",
        },
        notification_url: webhookUrl || undefined,
      },
    });

    await Order.updateOne(
      { orderId },
      {
        $set: {
          preferenceId: result.id || null,
          init_point: result.init_point || null,
          sandbox_init_point: result.sandbox_init_point || null,
        },
      }
    );

    res.json({
      orderId,
      preferenceId: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (err) {
    console.error("[mp] Error creando preferencia:", err);
    res.status(500).json({
      error: "Error creando preferencia",
      details: String(err?.message || err),
    });
  }
});

app.post("/mp/webhook", async (req, res) => {
  res.sendStatus(200);

  try {
    const topic = req.query?.type || req.query?.topic || req.body?.type || req.body?.topic;
    if (topic && topic !== "payment") return;

    const paymentId =
      req.query?.["data.id"] || req.query?.id || req.body?.data?.id || req.body?.id || req.body?.resource;

    if (!paymentId) return;

    const payment = new Payment(mpClient);
    const paymentInfo = await payment.get({ id: String(paymentId) });

    const orderId = paymentInfo.external_reference;
    if (!orderId) return;

    // Deduplicación: mismo paymentId y mismo status => ignorar
    const existing = await Order.findOne({ orderId }).lean();
    if (existing?.paymentId === String(paymentInfo.id) && existing?.status === paymentInfo.status) {
      return;
    }

    await Order.updateOne(
      { orderId },
      {
        $set: {
          status: paymentInfo.status || "unknown",
          paymentId: String(paymentInfo.id),
          live_mode: Boolean(paymentInfo.live_mode),
          transaction_amount: paymentInfo.transaction_amount ?? null,
          lastWebhookAt: new Date(),
        },
      }
    );

    console.log("[mp] payment updated:", {
      orderId,
      paymentId: paymentInfo.id,
      status: paymentInfo.status,
      status_detail: paymentInfo.status_detail,
      transaction_amount: paymentInfo.transaction_amount,
      live_mode: paymentInfo.live_mode,
    });
  } catch (e) {
    console.error("[mp] Error procesando webhook:", e);
  }
});

async function ensureSuperAdmin() {
  const username = process.env.SUPERADMIN_USERNAME;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!username || !password) {
    console.log("[seed] SUPERADMIN_USERNAME/PASSWORD not set, skipping seed");
    return;
  }

  const existing = await User.findOne({ username }).exec();
  if (existing) {
    console.log(`[seed] SUPER_ADMIN exists (${username})`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ username, passwordHash, role: "SUPER_ADMIN", active: true });
  console.log(`[seed] SUPER_ADMIN created (${username})`);
}

async function start() {
  try {
    if (!process.env.MONGO_URI) throw new Error("Missing MONGO_URI in .env");
    if (!process.env.JWT_SECRET) throw new Error("Missing JWT_SECRET in .env");
    if (!process.env.MP_ACCESS_TOKEN) throw new Error("Missing MP_ACCESS_TOKEN in .env");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("[db] connected");

    await ensureSuperAdmin();

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`Backend escuchando en http://localhost:${PORT}`));
  } catch (e) {
    console.error("[startup] error:", e);
    process.exit(1);
  }
}

start();
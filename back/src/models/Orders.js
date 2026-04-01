import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },

    title: { type: String, default: null },
    unit_price: { type: Number, default: null },
    quantity: { type: Number, default: null },
    buyer_email: { type: String, default: null },

    currency_id: { type: String, default: "ARS" },

    status: {
      type: String,
      enum: ["created", "pending", "approved", "rejected", "refunded", "cancelled", "unknown"],
      default: "created",
    },

    paymentId: { type: String, default: null },
    live_mode: { type: Boolean, default: null },
    transaction_amount: { type: Number, default: null },

    preferenceId: { type: String, default: null },
    init_point: { type: String, default: null },
    sandbox_init_point: { type: String, default: null },

    lastWebhookAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
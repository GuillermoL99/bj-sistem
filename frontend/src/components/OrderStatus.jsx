export default function OrderStatus({ order }) {
  return (
    <div>
      <p>
        Estado: <b>{order.status}</b>
      </p>
      <p>OrderId: {order.orderId}</p>
      <p>PaymentId: {order.paymentId || "-"}</p>
      <p>Monto: {order.transaction_amount ?? "-"} {order.currency_id || ""}</p>
      <p>Live mode: {String(order.live_mode)}</p>

      <details style={{ marginTop: 12 }}>
        <summary>Ver JSON completo</summary>
        <pre>{JSON.stringify(order, null, 2)}</pre>
      </details>
    </div>
  );
}
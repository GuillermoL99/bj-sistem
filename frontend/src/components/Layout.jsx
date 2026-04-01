export default function Layout({ children }) {
  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="logo" />
          <div>
            <h1>BIG JIM BAR</h1>
            <p>Entradas · Checkout seguro</p>
          </div>
        </div>

        <div className="badge">
          <span className="dot" />
          <span>Mercado Pago</span>
        </div>
      </header>

      {children}
    </div>
  );
}
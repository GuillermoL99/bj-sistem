export default function Card({ title, subtitle, children }) {
  return (
    <section className="card">
      {title && <h2>{title}</h2>}
      {subtitle && <p>{subtitle}</p>}
      {children}
    </section>
  );
}
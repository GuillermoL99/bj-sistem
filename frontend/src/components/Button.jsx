export default function Button({ variant = "default", ...props }) {
  const className =
    variant === "primary" ? "btn btnPrimary" : "btn";
  return <button className={className} {...props} />;
}
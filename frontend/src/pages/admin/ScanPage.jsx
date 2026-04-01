import Card from "../../components/Card";
import Button from "../../components/Button";

export default function ScanPage() {
  function openCamera() {
    // Placeholder: acá después conectamos el scanner real
    alert("Abrir cámara (pendiente integrar escaneo QR)");
  }

  return (
    <div className="adminPage">
      <Card title="Escanear QR" subtitle="Usá la cámara para validar entradas.">
        <div className="hr" />

        <Button variant="primary" onClick={openCamera}>
          Abrir cámara
        </Button>

        <p style={{ marginTop: 12, marginBottom: 0, color: "var(--muted)" }}>
          Recomendado: usar Chrome en Android para mejor compatibilidad con cámara.
        </p>
      </Card>
    </div>
  );
}
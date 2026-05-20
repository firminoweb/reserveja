/**
 * Marca visual em JSX puro pra usar dentro de `ImageResponse` (next/og).
 * ImageResponse não aceita `<svg>` arbitrário, só um subconjunto de elementos
 * e estilos. Por isso reconstruímos o ícone com divs + bordas.
 *
 * Mesmo desenho do componente Logo / icon.svg: quadrado indigo arredondado
 * com calendário branco + check.
 */
export function LogoIconForImage({ size = 180 }: { size?: number }) {
  const s = size
  // medidas relativas (proporção do viewBox 64x64)
  const r = (n: number) => (n * s) / 64

  return (
    <div
      style={{
        width: s,
        height: s,
        background: "#4F46E5",
        borderRadius: r(14),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Corpo do calendário */}
      <div
        style={{
          position: "absolute",
          top: r(18),
          left: r(14),
          width: r(36),
          height: r(32),
          borderRadius: r(4),
          border: `${r(3)}px solid #fff`,
          display: "flex",
        }}
      />
      {/* Cabeçalho (linha horizontal) */}
      <div
        style={{
          position: "absolute",
          top: r(28),
          left: r(14),
          width: r(36),
          height: r(3),
          background: "#fff",
          borderRadius: r(1.5),
        }}
      />
      {/* Pino esquerdo */}
      <div
        style={{
          position: "absolute",
          top: r(14),
          left: r(23),
          width: r(3),
          height: r(8),
          background: "#fff",
          borderRadius: r(1.5),
        }}
      />
      {/* Pino direito */}
      <div
        style={{
          position: "absolute",
          top: r(14),
          left: r(39),
          width: r(3),
          height: r(8),
          background: "#fff",
          borderRadius: r(1.5),
        }}
      />
      {/* Check (✓) construído com duas barras rotacionadas */}
      <div
        style={{
          position: "absolute",
          top: r(38),
          left: r(21),
          width: r(11),
          height: r(3.5),
          background: "#fff",
          borderRadius: r(2),
          transform: "rotate(45deg)",
          transformOrigin: "left center",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: r(43),
          left: r(28),
          width: r(20),
          height: r(3.5),
          background: "#fff",
          borderRadius: r(2),
          transform: "rotate(-45deg)",
          transformOrigin: "left center",
        }}
      />
    </div>
  )
}

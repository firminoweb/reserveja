/**
 * Bar chart SVG simples. Sem dependência. Cada barra com label embaixo.
 * Funciona em SSR e client.
 */

type BarData = {
  label: string
  value: number
  /** Label opcional embaixo da barra. Default: usa `label`. */
  axis?: string
}

type Props = {
  data: BarData[]
  /** Altura em px do grid interno (sem labels). */
  height?: number
  /** Cor da barra (var Tailwind). */
  className?: string
}

export function BarChart({ data, height = 140, className }: Props) {
  if (data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Sem dados.
      </div>
    )
  }
  const max = Math.max(1, ...data.map((d) => d.value))
  const barWidthPct = 100 / data.length
  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${data.length * 100} ${height + 28}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Gráfico de barras"
        className="w-full h-auto"
      >
        {/* baseline */}
        <line
          x1={0}
          y1={height}
          x2={data.length * 100}
          y2={height}
          className="stroke-border"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const barH = (d.value / max) * (height - 8)
          const x = i * 100 + 10
          const w = 80
          const y = height - barH
          return (
            <g key={`${d.label}-${i}`}>
              <rect
                x={x}
                y={y}
                width={w}
                height={barH}
                rx={4}
                className={className ?? "fill-primary"}
              />
              {d.value > 0 ? (
                <text
                  x={x + w / 2}
                  y={y - 4}
                  textAnchor="middle"
                  className="fill-foreground text-[16px] font-medium"
                >
                  {d.value}
                </text>
              ) : null}
              <text
                x={x + w / 2}
                y={height + 18}
                textAnchor="middle"
                className="fill-muted-foreground text-[14px]"
              >
                {d.axis ?? d.label}
              </text>
            </g>
          )
        })}
        {/* unused for layout but consumes width to align bars */}
        <rect x={0} y={0} width={data.length * 100 * 0 + barWidthPct * 0} height={0} />
      </svg>
    </div>
  )
}

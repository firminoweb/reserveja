import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"

const CATEGORY_LABEL: Record<string, string> = {
  BARBEARIA: "Barbearia",
  SALAO_BELEZA: "Salão de beleza",
  MANICURE_PEDICURE: "Manicure",
  ESTETICA: "Estética",
  MASSAGEM_TERAPIA: "Massagem/terapia",
  MECANICA_AUTO: "Mecânica auto",
  LAVA_RAPIDO: "Lava-rápido",
  PET_SHOP: "Pet shop",
  CLINICA_SAUDE: "Clínica de saúde",
  ESTUDIO_TATUAGEM: "Estúdio de tatuagem",
  OUTRO: "Outro",
}

export default async function AdminEstabelecimentosPage() {
  const organizations = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      status: true,
      createdAt: true,
      _count: { select: { establishments: true } },
      establishments: { select: { slug: true }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  })

  return (
    <div className="px-8 py-8">
      <h1 className="text-2xl font-bold">Empresas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {organizations.length} cadastrada(s)
      </p>

      <table className="mt-6 w-full text-sm">
        <thead className="text-left text-muted-foreground border-b">
          <tr>
            <th className="pb-2 font-medium">Nome</th>
            <th className="pb-2 font-medium">Categoria</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Unidades</th>
            <th className="pb-2 font-medium">Slug principal</th>
            <th className="pb-2 font-medium">Criada em</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {organizations.map((o) => (
            <tr key={o.id}>
              <td className="py-3 font-medium">{o.name}</td>
              <td className="py-3 text-muted-foreground">
                {CATEGORY_LABEL[o.category] ?? o.category}
              </td>
              <td className="py-3">
                <Badge variant={o.status === "ACTIVE" ? "default" : "secondary"}>
                  {o.status}
                </Badge>
              </td>
              <td className="py-3 text-muted-foreground tabular-nums">
                {o._count.establishments}
              </td>
              <td className="py-3 text-muted-foreground font-mono text-xs">
                {o.establishments[0]?.slug ?? "—"}
              </td>
              <td className="py-3 text-muted-foreground">
                {o.createdAt.toLocaleDateString("pt-BR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

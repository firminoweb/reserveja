import "dotenv/config"
import { defineConfig } from "@prisma/config"

// Migrations precisam de conexão DIRETA (sem pooler) porque o PgBouncer do Neon
// roda em modo "transaction" e não mantém estado de sessão — `pg_advisory_lock`
// trava esperando. Runtime (src/lib/db.ts) continua usando DATABASE_URL (pooled).
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? ""

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: migrationUrl,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
})

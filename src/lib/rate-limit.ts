// Rate limiter in-memory (sliding window) por chave arbitrária (IP, email, etc.).
//
// Limitação conhecida: em Vercel serverless cada instância tem seu próprio Map,
// então o limite é por-instância, não global. É uma proteção MITIGATÓRIA — não
// elimina brute-force distribuído. Pra produção com tráfego sério, migrar pra
// Upstash Redis (@upstash/ratelimit). Pra MVP defende contra script kiddie
// rodando do mesmo IP.

type Bucket = { hits: number[] }

const buckets = new Map<string, Bucket>()

// Limpa entradas velhas pra não vazar memória. Roda a cada hit (custo O(1) amortizado).
function purge(key: string, windowMs: number, now: number) {
  const bucket = buckets.get(key)
  if (!bucket) return
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs)
  if (bucket.hits.length === 0) buckets.delete(key)
}

export type RateLimitResult = {
  success: boolean
  remaining: number
  resetMs: number
}

export type RateLimitOptions = {
  /** Quantos hits são permitidos no período. */
  limit: number
  /** Janela em milissegundos. */
  windowMs: number
}

/**
 * Tenta consumir 1 hit pra essa key. Retorna `success: false` se já estourou.
 * Não joga exceção — caller decide o que fazer.
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
): RateLimitResult {
  const now = Date.now()
  purge(key, windowMs, now)

  const bucket = buckets.get(key) ?? { hits: [] }
  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0]
    return {
      success: false,
      remaining: 0,
      resetMs: windowMs - (now - oldest),
    }
  }
  bucket.hits.push(now)
  buckets.set(key, bucket)
  return {
    success: true,
    remaining: limit - bucket.hits.length,
    resetMs: windowMs,
  }
}

/** Extrai um identificador de IP "best-effort" de um Request. */
export function clientIp(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  )
}

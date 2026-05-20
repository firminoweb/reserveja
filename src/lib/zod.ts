// Re-export do zod com mensagens em pt-BR ativadas globalmente.
// Sempre que precisar de Zod, importe daqui (não direto de "zod").
import { z, locales } from "zod"

z.config(locales.pt())

export { z }

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter })

async function ensureNoOverlapConstraint() {
  // Constraint EXCLUDE pra impedir sobreposição de bookings ativos pro mesmo
  // profissional. Funciona porque startsAt/endsAt são timestamptz (via
  // @db.Timestamptz no schema) e tstzrange(timestamptz, timestamptz) é
  // IMMUTABLE. Guard em pg_constraint deixa o seed idempotente.
  await db.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS btree_gist;`)
  await db.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'booking_no_overlap_per_professional'
      ) THEN
        ALTER TABLE "Booking" ADD CONSTRAINT booking_no_overlap_per_professional
        EXCLUDE USING gist (
          "professionalId" WITH =,
          tstzrange("startsAt", "endsAt") WITH &&
        ) WHERE (status IN ('PENDING', 'CONFIRMED'));
      END IF;
    END $$;
  `)
}

async function main() {
  await ensureNoOverlapConstraint()

  const passwordHash = await bcrypt.hash("troca-isso", 10)

  const owner = await db.user.upsert({
    where: { email: "joao@exemplo.com" },
    update: { passwordHash },
    create: {
      email: "joao@exemplo.com",
      name: "João Barbeiro",
      passwordHash,
      role: "OWNER",
    },
  })

  await db.user.upsert({
    where: { email: "admin@reserveja.app" },
    update: { passwordHash },
    create: {
      email: "admin@reserveja.app",
      name: "Admin Reserve Já",
      passwordHash,
      role: "ADMIN",
    },
  })

  // Garante a Organization "Barbearia do João" e a unidade principal.
  let establishment = await db.establishment.findUnique({
    where: { slug: "barbearia-do-joao" },
    include: { organization: true },
  })

  if (!establishment) {
    const organization = await db.organization.create({
      data: {
        name: "Barbearia do João",
        category: "BARBEARIA",
        status: "ACTIVE",
        memberships: { create: { userId: owner.id, role: "OWNER" } },
        establishments: {
          create: {
            slug: "barbearia-do-joao",
            name: "Barbearia do João",
            description: "Corte e barba na Vila Madalena. Atendemos com hora marcada.",
            whatsapp: "+5511999999999",
            timezone: "America/Sao_Paulo",
            workingHours: {
              create: [1, 2, 3, 4, 5, 6].map((weekday) => ({
                weekday,
                startMin: 9 * 60,
                endMin: 19 * 60,
              })),
            },
          },
        },
      },
      include: { establishments: true },
    })
    establishment = {
      ...organization.establishments[0],
      organization,
    }
  } else {
    // Reseed idempotente: garante membership pro owner caso já exista
    await db.membership.upsert({
      where: {
        userId_organizationId: {
          userId: owner.id,
          organizationId: establishment.organizationId,
        },
      },
      update: {},
      create: {
        userId: owner.id,
        organizationId: establishment.organizationId,
        role: "OWNER",
      },
    })
  }

  const corte = await db.service.upsert({
    where: { id: `seed-${establishment.id}-corte` },
    update: {},
    create: {
      id: `seed-${establishment.id}-corte`,
      establishmentId: establishment.id,
      name: "Corte masculino",
      description: "Tesoura ou máquina, finalizado com toalha quente",
      durationMin: 30,
      priceCents: 5000,
    },
  })

  const barba = await db.service.upsert({
    where: { id: `seed-${establishment.id}-barba` },
    update: {},
    create: {
      id: `seed-${establishment.id}-barba`,
      establishmentId: establishment.id,
      name: "Barba",
      description: "Modelagem com navalha",
      durationMin: 30,
      priceCents: 4000,
    },
  })

  const carlos = await db.professional.upsert({
    where: { id: `seed-${establishment.id}-carlos` },
    update: {},
    create: {
      id: `seed-${establishment.id}-carlos`,
      establishmentId: establishment.id,
      name: "Carlos",
      services: {
        create: [{ serviceId: corte.id }, { serviceId: barba.id }],
      },
    },
  })

  const marcos = await db.professional.upsert({
    where: { id: `seed-${establishment.id}-marcos` },
    update: {},
    create: {
      id: `seed-${establishment.id}-marcos`,
      establishmentId: establishment.id,
      name: "Marcos",
      services: {
        create: [{ serviceId: corte.id }],
      },
    },
  })

  console.log("✅ Seed concluído:")
  console.log(`   admin login: admin@reserveja.app / troca-isso`)
  console.log(`   owner login: ${owner.email} / troca-isso`)
  console.log(`   estabelecimento: /${establishment.slug}`)
  console.log(`   serviços: ${corte.name}, ${barba.name}`)
  console.log(`   profissionais: ${carlos.name}, ${marcos.name}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

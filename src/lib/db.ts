import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Create the Prisma client with deployment-safe settings.
 *
 * - Fails fast with an actionable message when DATABASE_URL is missing
 *   (instead of an opaque "Unable to open the database file" at query time).
 * - Query logging stays in development only; production logs errors only
 *   (keeps serverless logs clean and adds no per-query overhead).
 */
function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set.\n' +
        '  Local development : copy .env.example to .env (SQLite: file:../db/custom.db), then run `npm run db:push`.\n' +
        '  Vercel deployment : add the Vercel Postgres (Neon) DATABASE_URL in Project → Settings → Environment Variables.',
    )
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

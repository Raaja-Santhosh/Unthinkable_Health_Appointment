import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// On Vercel serverless functions, copy the seeded dev.db to /tmp so SQLite is writable and persistent per lambda instance
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  const tmpDbPath = '/tmp/dev.db'
  const sourceDbPath = path.join(process.cwd(), 'prisma', 'dev.db')

  try {
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(sourceDbPath)) {
      fs.copyFileSync(sourceDbPath, tmpDbPath)
    }
  } catch (e) {
    console.error('Error copying dev.db to /tmp:', e)
  }

  if (fs.existsSync(tmpDbPath)) {
    process.env.DATABASE_URL = 'file:/tmp/dev.db'
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

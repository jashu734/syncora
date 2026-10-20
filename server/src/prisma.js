import { PrismaClient } from '@prisma/client';

// Ensure a single PrismaClient instance is shared across the application lifecycle.
// In development, avoid exhausting database connection pools during hot reloading.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

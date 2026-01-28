import { PrismaClient } from '@prisma/client';
import { config } from '../config';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: config.isProduction ? ['error'] : ['query', 'error', 'warn'],
  });

if (!config.isProduction) {
  global.prisma = prisma;
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

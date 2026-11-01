import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type ResetTokenDatabase = Pick<PrismaClient, 'passwordResetToken'> | Prisma.TransactionClient;

export async function invalidateResetTokens(
  userId: string,
  db: ResetTokenDatabase = prisma,
) {
  await db.passwordResetToken.updateMany({
    where: {
      userId,
      used: false,
    },
    data: {
      used: true,
    },
  });
}

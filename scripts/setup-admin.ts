import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';
import { invalidateResetTokens } from '../src/lib/passwordReset';

const prisma = new PrismaClient();

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Usage: npm exec tsx scripts/setup-admin.ts <email> <password>');
    process.exit(1);
  }

  const hashedPassword = await hashPassword(password);
  const username = email.split('@')[0];

  const user = await prisma.$transaction(async (tx) => {
    const upsertedUser = await tx.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        tokenVersion: { increment: 1 },
        role: 'ADMIN',
        isActive: true,
        username,
      },
      create: {
        email,
        username,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    await invalidateResetTokens(upsertedUser.id, tx);
    return upsertedUser;
  });

  console.log(`Admin user ready: ${user.email}`);
}

main()
  .catch((error) => {
    console.error('Setup admin failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

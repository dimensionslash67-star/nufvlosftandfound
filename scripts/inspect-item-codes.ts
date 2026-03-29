import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const withCode = await prisma.item.count({
    where: {
      itemCode: {
        not: null,
      },
    },
  });

  const withoutCode = await prisma.item.count({
    where: {
      itemCode: null,
    },
  });

  const legacyCount = await prisma.item.count({
    where: {
      contactInfo: {
        contains: 'Legacy Code: ITEM-',
      },
    },
  });
  const duplicateCount = await prisma.item.count({
    where: {
      itemCode: {
        startsWith: 'DUPLICATE-',
      },
    },
  });

  const legacySample = await prisma.item.findMany({
    where: {
      contactInfo: {
        contains: 'Legacy Code: ITEM-',
      },
    },
    take: 10,
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      itemCode: true,
      contactInfo: true,
      createdAt: true,
    },
  });

  const recent = await prisma.item.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      itemCode: true,
      itemName: true,
      createdAt: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        withCode,
        withoutCode,
        legacyCount,
        duplicateCount,
        legacySample,
        recent,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

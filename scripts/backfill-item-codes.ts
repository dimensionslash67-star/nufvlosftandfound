import { PrismaClient } from '@prisma/client';
import { generateItemCode } from '../src/lib/itemCode';

const prisma = new PrismaClient();

function extractLegacyItemCode(contactInfo: string | null | undefined) {
  const match = contactInfo?.match(/Legacy Code:\s*(ITEM-\d{4}-\d+)/i);
  return match?.[1] ?? null;
}

async function main() {
  console.log('Backfilling item codes...');

  const existingCodes = new Set(
    (
      await prisma.item.findMany({
        where: {
          itemCode: {
            not: null,
          },
        },
        select: {
          itemCode: true,
        },
      })
    )
      .map((item) => item.itemCode)
      .filter((itemCode): itemCode is string => Boolean(itemCode)),
  );

  const itemsWithoutCode = await prisma.item.findMany({
    where: {
      itemCode: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      contactInfo: true,
    },
  });

  let preserved = 0;
  let generated = 0;

  for (const item of itemsWithoutCode) {
    const legacyCode = extractLegacyItemCode(item.contactInfo);
    let itemCode = legacyCode && !existingCodes.has(legacyCode) ? legacyCode : null;

    if (!itemCode) {
      itemCode = await generateItemCode();
      while (existingCodes.has(itemCode)) {
        itemCode = await generateItemCode();
      }
      generated += 1;
    } else {
      preserved += 1;
    }

    await prisma.item.update({
      where: {
        id: item.id,
      },
      data: {
        itemCode,
      },
    });

    existingCodes.add(itemCode);
  }

  console.log(`Updated ${itemsWithoutCode.length} items.`);
  console.log(`Preserved legacy codes: ${preserved}`);
  console.log(`Generated new codes: ${generated}`);
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

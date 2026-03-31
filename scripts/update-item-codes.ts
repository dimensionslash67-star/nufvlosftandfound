import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateItemCodes() {
  console.log('Starting item code update...');

  const items = await prisma.item.findMany({
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      dateReported: true,
    },
  });

  console.log(`Found ${items.length} items to update`);

  const itemsByYear = new Map<string, Array<{ id: string; dateReported: Date }>>();

  for (const item of items) {
    const year = new Date(item.dateReported).getFullYear().toString();
    const existing = itemsByYear.get(year) ?? [];
    existing.push(item);
    itemsByYear.set(year, existing);
  }

  let totalUpdated = 0;

  for (const [year, yearItems] of itemsByYear.entries()) {
    console.log(`Updating ${yearItems.length} items for year ${year}...`);

    for (let index = 0; index < yearItems.length; index += 1) {
      const item = yearItems[index];
      const itemCode = `ITEM-${year}-${String(index + 1).padStart(4, '0')}`;

      await prisma.item.update({
        where: { id: item.id },
        data: { itemCode },
      });

      totalUpdated += 1;

      if (totalUpdated % 100 === 0) {
        console.log(`Updated ${totalUpdated}/${items.length} items...`);
      }
    }
  }

  console.log(`Successfully updated ${totalUpdated} item codes`);
}

updateItemCodes()
  .catch((error) => {
    console.error('Error updating item codes:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

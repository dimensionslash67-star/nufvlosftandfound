import { prisma } from './prisma';

/**
 * Generates the next item code in format ITEM-YYYY-XXXX.
 * Sequence is maintained per reporting year.
 */
export async function generateItemCode(forDate = new Date()): Promise<string> {
  const currentYear = forDate.getFullYear();
  const prefix = `ITEM-${currentYear}-`;

  const latestItem = await prisma.item.findFirst({
    where: {
      itemCode: {
        startsWith: prefix,
      },
    },
    orderBy: {
      itemCode: 'desc',
    },
    select: {
      itemCode: true,
    },
  });

  let nextNumber = 1;

  if (latestItem?.itemCode) {
    const parts = latestItem.itemCode.split('-');
    const lastNumber = Number.parseInt(parts[parts.length - 1] ?? '', 10);

    if (!Number.isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}

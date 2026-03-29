import { prisma } from './prisma';

/**
 * Generates the next item code in format ITEM-YYYY-XXXX
 * Examples: ITEM-2026-0001, ITEM-2026-0170, ITEM-2026-1000
 *
 * Logic:
 * 1. Find the highest existing item code number across ALL years
 * 2. Increment by 1
 * 3. Use the CURRENT year (not the year from the last code)
 * 4. Zero-pad to 4 digits
 */
export async function generateItemCode(): Promise<string> {
  const currentYear = new Date().getFullYear();

  // Find the item with the highest sequential number
  // Item codes look like ITEM-2026-0170 — we sort by the numeric suffix
  const lastItem = await prisma.item.findFirst({
    where: {
      itemCode: {
        not: null,
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

  if (lastItem?.itemCode) {
    // Extract the numeric part from ITEM-2026-0170 → 170
    const parts = lastItem.itemCode.split('-');
    const lastNumber = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // Zero-pad to 4 digits: 1 → 0001, 170 → 0170, 1000 → 1000
  const paddedNumber = String(nextNumber).padStart(4, '0');

  return `ITEM-${currentYear}-${paddedNumber}`;
}

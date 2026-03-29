import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function extractLegacyItemCode(contactInfo: string | null | undefined) {
  const match = contactInfo?.match(/Legacy Code:\s*(ITEM-\d{4}-\d+)/i);
  return match?.[1] ?? null;
}

function formatDuplicateCode(year: number, sequence: number) {
  const paddedSequence =
    String(sequence).length >= 3 ? String(sequence) : String(sequence).padStart(3, '0');

  return `DUPLICATE-${year}-${paddedSequence}`;
}

async function main() {
  console.log('Reconciling legacy item codes...');

  const allItems = await prisma.item.findMany({
    select: {
      id: true,
      itemCode: true,
      contactInfo: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const targetItems = allItems
    .map((item) => ({
      ...item,
      legacyCode: extractLegacyItemCode(item.contactInfo),
    }))
    .filter((item): item is (typeof allItems)[number] & { legacyCode: string } => Boolean(item.legacyCode));

  const duplicateTargets = new Map<string, string[]>();
  for (const item of targetItems) {
    const itemsForCode = duplicateTargets.get(item.legacyCode) ?? [];
    itemsForCode.push(item.id);
    duplicateTargets.set(item.legacyCode, itemsForCode);
  }

  const duplicateCodes = Array.from(duplicateTargets.entries()).filter(([, ids]) => ids.length > 1);
  if (duplicateCodes.length > 0) {
    throw new Error(`Duplicate legacy item codes found: ${duplicateCodes.map(([code]) => code).join(', ')}`);
  }

  const targetsByDesiredCode = new Map(targetItems.map((item) => [item.legacyCode, item]));
  const targetsNeedingRestore = targetItems.filter((item) => item.itemCode !== item.legacyCode);
  const targetIds = new Set(targetItems.map((item) => item.id));
  const displacedItems = allItems.filter(
    (item) =>
      item.itemCode &&
      targetsByDesiredCode.has(item.itemCode) &&
      targetsByDesiredCode.get(item.itemCode)?.id !== item.id,
  );
  const existingCodes = new Set(
    allItems
      .map((item) => item.itemCode)
      .filter((itemCode): itemCode is string => Boolean(itemCode)),
  );
  const currentYear = new Date().getFullYear();
  let nextDuplicateSequence = 1;

  let tempIndex = 1;
  const tempCodes = new Map<string, string>();

  for (const item of [...targetsNeedingRestore, ...displacedItems]) {
    if (tempCodes.has(item.id)) {
      continue;
    }

    const tempCode = `TEMP-${String(tempIndex).padStart(6, '0')}`;
    tempIndex += 1;
    tempCodes.set(item.id, tempCode);

    await prisma.item.update({
      where: {
        id: item.id,
      },
      data: {
        itemCode: tempCode,
      },
    });
  }

  for (const item of targetsNeedingRestore) {
    await prisma.item.update({
      where: {
        id: item.id,
      },
      data: {
        itemCode: item.legacyCode,
      },
    });
  }

  let regenerated = 0;
  for (const item of displacedItems) {
    if (targetIds.has(item.id)) {
      continue;
    }

    let itemCode = formatDuplicateCode(currentYear, nextDuplicateSequence);
    nextDuplicateSequence += 1;

    while (targetsByDesiredCode.has(itemCode) || existingCodes.has(itemCode)) {
      itemCode = formatDuplicateCode(currentYear, nextDuplicateSequence);
      nextDuplicateSequence += 1;
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
    regenerated += 1;
  }

  console.log(`Restored legacy codes: ${targetsNeedingRestore.length}`);
  console.log(`Marked conflicting generated codes as duplicates: ${regenerated}`);
}

main()
  .catch((error) => {
    console.error('Reconciliation failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

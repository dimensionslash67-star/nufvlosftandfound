import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function asRecord(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Prisma.JsonValue>;
}

function readString(value: Prisma.JsonValue | null | undefined) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

async function main() {
  console.log('Backfilling claimer details from audit logs...');

  const claimLogs = await prisma.auditLog.findMany({
    where: {
      action: 'ITEM_CLAIMED',
      entityType: 'ITEM',
      entityId: { not: null },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      entityId: true,
      details: true,
    },
  });

  const latestLogByItem = new Map<string, Prisma.JsonValue | null>();

  for (const log of claimLogs) {
    if (log.entityId && !latestLogByItem.has(log.entityId)) {
      latestLogByItem.set(log.entityId, log.details);
    }
  }

  let updated = 0;
  let skipped = 0;
  let missingItems = 0;

  for (const [itemId, detailsValue] of latestLogByItem.entries()) {
    const details = asRecord(detailsValue);
    const claimerInfo = asRecord(details?.claimerInfo);

    if (!claimerInfo) {
      skipped += 1;
      continue;
    }

    const nextData = {
      claimerName: readString(claimerInfo.claimerName),
      claimerEmail: readString(claimerInfo.claimerEmail),
      claimerIdNumber: readString(claimerInfo.claimerIdNumber),
      claimerPhone: readString(claimerInfo.claimerPhone),
      relationshipToItem: readString(claimerInfo.relationshipToItem),
      verificationNotes: readString(claimerInfo.verificationNotes),
    };

    if (!Object.values(nextData).some((value) => value !== null)) {
      skipped += 1;
      continue;
    }

    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        claimerName: true,
        claimerEmail: true,
        claimerIdNumber: true,
        claimerPhone: true,
        relationshipToItem: true,
        verificationNotes: true,
      },
    });

    if (!existingItem) {
      missingItems += 1;
      continue;
    }

    const needsUpdate =
      existingItem.claimerName !== nextData.claimerName ||
      existingItem.claimerEmail !== nextData.claimerEmail ||
      existingItem.claimerIdNumber !== nextData.claimerIdNumber ||
      existingItem.claimerPhone !== nextData.claimerPhone ||
      existingItem.relationshipToItem !== nextData.relationshipToItem ||
      existingItem.verificationNotes !== nextData.verificationNotes;

    if (!needsUpdate) {
      skipped += 1;
      continue;
    }

    await prisma.item.update({
      where: { id: itemId },
      data: nextData,
    });

    updated += 1;
  }

  console.log(`Updated items: ${updated}`);
  console.log(`Skipped items: ${skipped}`);
  console.log(`Missing item records: ${missingItems}`);
}

main()
  .catch((error) => {
    console.error('Claimer detail backfill failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

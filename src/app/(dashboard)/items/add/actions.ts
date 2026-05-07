'use server';

import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit';
import { ITEM_CATEGORIES } from '@/lib/constants';
import { generateItemCode } from '@/lib/itemCode';
import { prisma } from '@/lib/prisma';

const legacyAddItemSchema = z.object({
  category: z.enum(ITEM_CATEGORIES),
  itemName: z.string().trim().min(2, 'Item title is required.'),
  locationLevel: z.string().trim().min(1, 'Level/Floor found is required.'),
  locationSpecific: z.string().trim().min(2, 'Specific place is required.'),
  dateReceived: z.string().trim().min(1, 'Date received is required.'),
  retentionDays: z.string().trim().min(1, 'Retention period is required.'),
  surrenderedBy: z.string().trim().optional().default(''),
  receivedBy: z.string().trim().min(1, 'Received by is required.'),
  description: z.string().trim().min(1, 'Item description is required.'),
});

export type LegacyAddItemInput = z.infer<typeof legacyAddItemSchema>;

export type LegacyAddItemResult =
  | {
      success: true;
      message: string;
      itemId: string;
    }
  | {
      success: false;
      message: string;
      fieldErrors?: Partial<Record<keyof LegacyAddItemInput, string>>;
    };

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date;
}

function toFieldErrors(error: z.ZodError<LegacyAddItemInput>) {
  const flattened = error.flatten().fieldErrors;
  const nextErrors: Partial<Record<keyof LegacyAddItemInput, string>> = {};

  for (const key of Object.keys(flattened) as Array<keyof LegacyAddItemInput>) {
    const message = flattened[key]?.[0];

    if (message) {
      nextErrors[key] = message;
    }
  }

  return nextErrors;
}

export async function submitLegacyAddItem(
  reporterId: string,
  input: LegacyAddItemInput,
): Promise<LegacyAddItemResult> {
  const parsed = legacyAddItemSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: 'Validation failed.',
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const reporter = await prisma.user.findUnique({
    where: { id: reporterId },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!reporter?.isActive) {
    return {
      success: false,
      message: 'Unauthorized.',
    };
  }

  const dateReported = new Date(`${parsed.data.dateReceived}T00:00:00`);
  const retentionDays = Number(parsed.data.retentionDays);

  if (Number.isNaN(dateReported.getTime()) || Number.isNaN(retentionDays) || retentionDays <= 0) {
    return {
      success: false,
      message: 'Validation failed.',
    };
  }

  const contactDetails = [
    parsed.data.surrenderedBy ? `Surrendered By: ${parsed.data.surrenderedBy}` : null,
    `Received By: ${parsed.data.receivedBy}`,
  ].filter(Boolean);

  let itemCode = '';

  for (let attempt = 0; attempt < 5; attempt += 1) {
    itemCode = await generateItemCode(dateReported);

    try {
      const item = await prisma.item.create({
        data: {
          itemCode,
          itemName: parsed.data.itemName,
          description: parsed.data.description,
          category: parsed.data.category,
          location: `${parsed.data.locationLevel} - ${parsed.data.locationSpecific}`,
          dateReported,
          dueDate: addDays(parsed.data.dateReceived, retentionDays),
          contactInfo: contactDetails.join(' | '),
          imageUrl: '',
          reporterId,
        },
      });

      await createAuditLog({
        userId: reporterId,
        action: 'ITEM_CREATED',
        entityType: 'ITEM',
        entityId: item.id,
        details: {
          itemCode: item.itemCode,
          itemName: item.itemName,
          category: item.category,
          status: item.status,
        },
      });

      return {
        success: true,
        message: 'Item added successfully.',
        itemId: item.id,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        (
          (Array.isArray(error.meta?.target) && error.meta.target.some((target) => String(target).includes('item'))) ||
          String(error.meta?.target ?? '').includes('item')
        )
      ) {
        continue;
      }

      console.error('Legacy add item action error:', error);
      return {
        success: false,
        message: 'Unable to add the item.',
      };
    }
  }

  return {
    success: false,
    message: 'Unable to generate a unique item code.',
  };
}

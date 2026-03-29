import Papa from 'papaparse';
import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { requireAdminPayload } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { itemStatusSchema, itemSchema } from '@/lib/validations';

function normalizeOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminPayload(request);

    if (!admin) {
      return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'CSV file is required.' }, { status: 400 });
    }

    const text = await file.text();
    const parsedCsv = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });

    const errors: string[] = [];
    let imported = 0;

    for (const [index, row] of parsedCsv.data.entries()) {
      const itemResult = itemSchema.safeParse({
        itemName: row.itemName,
        description: row.description,
        category: row.category,
        location: row.location,
        contactInfo: row.contactInfo,
        imageUrl: row.imageUrl,
      });

      if (!itemResult.success) {
        errors.push(`Row ${index + 2}: ${itemResult.error.issues[0]?.message ?? 'Invalid row'}`);
        continue;
      }

      const statusResult = itemStatusSchema.safeParse({
        status: row.status || 'PENDING',
      });

      if (!statusResult.success) {
        errors.push(`Row ${index + 2}: invalid status`);
        continue;
      }

      try {
        await prisma.item.create({
          data: {
            itemName: itemResult.data.itemName.trim(),
            description: normalizeOptionalString(itemResult.data.description),
            category: itemResult.data.category,
            location: itemResult.data.location.trim(),
            contactInfo: normalizeOptionalString(itemResult.data.contactInfo),
            imageUrl: normalizeOptionalString(itemResult.data.imageUrl),
            status: statusResult.data.status,
            dateReported: row.dateReported ? new Date(row.dateReported) : undefined,
            reporterId: admin.userId,
          },
        });

        imported += 1;
      } catch (error) {
        console.error(`CSV import row ${index + 2} failed:`, error);
        errors.push(`Row ${index + 2}: database insert failed`);
      }
    }

    await createAuditLog({
      userId: admin.userId,
      action: 'ITEMS_IMPORTED',
      entityType: 'ITEM',
      details: {
        imported,
        failed: errors.length,
      },
      request,
    });

    return NextResponse.json({
      message: 'Import complete.',
      imported,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    console.error('Import items error:', error);
    return NextResponse.json({ message: 'Unable to import CSV.' }, { status: 500 });
  }
}

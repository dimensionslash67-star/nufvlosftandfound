import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { requireAdminPayload, getSettingsData, saveSettingsData } from '@/lib/admin';
import { adminSettingsSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const admin = await requireAdminPayload(request);

  if (!admin) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
  }

  const settings = await getSettingsData();
  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdminPayload(request);

  if (!admin) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
  }

  const json = await request.json();
  const parsed = adminSettingsSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Validation failed.', errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await saveSettingsData(parsed.data);

  await createAuditLog({
    userId: admin.userId,
    action: 'SETTINGS_UPDATED',
    entityType: 'SETTING',
    details: parsed.data,
    request,
  });

  return NextResponse.json({
    message: 'Settings saved successfully.',
    settings: await getSettingsData(),
  });
}


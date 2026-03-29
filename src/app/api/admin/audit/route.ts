import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogsPageData, requireAdminPayload } from '@/lib/admin';
import { adminAuditQuerySchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const admin = await requireAdminPayload(request);

  if (!admin) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
  }

  const parsed = adminAuditQuerySchema.parse({
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    search: request.nextUrl.searchParams.get('search') ?? undefined,
    action: request.nextUrl.searchParams.get('action') ?? undefined,
    dateFrom: request.nextUrl.searchParams.get('dateFrom') ?? undefined,
    dateTo: request.nextUrl.searchParams.get('dateTo') ?? undefined,
  });

  return NextResponse.json(await getAuditLogsPageData(parsed));
}

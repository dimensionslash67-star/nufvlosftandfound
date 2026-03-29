import { NextRequest, NextResponse } from 'next/server';
import { createCsv, getReportPreviewData, requireAdminPayload } from '@/lib/admin';
import { adminReportQuerySchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const admin = await requireAdminPayload(request);

  if (!admin) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
  }

  const parsed = adminReportQuerySchema.parse({
    type: request.nextUrl.searchParams.get('type') ?? undefined,
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    dateFrom: request.nextUrl.searchParams.get('dateFrom') ?? undefined,
    dateTo: request.nextUrl.searchParams.get('dateTo') ?? undefined,
  });

  const preview = await getReportPreviewData(parsed);
  const fallbackColumns = ['Message'];
  const fallbackRows = [{ Message: 'No data' }];
  const csv = createCsv(
    preview.rows.length ? preview.columns : fallbackColumns,
    (preview.rows.length ? preview.rows : fallbackRows) as Array<Record<string, unknown>>,
  );

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${parsed.type}-report.csv"`,
    },
  });
}

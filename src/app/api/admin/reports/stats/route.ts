import { NextRequest, NextResponse } from 'next/server';
import { getReportStatsData, requireAdminPayload } from '@/lib/admin';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminPayload(request);

    if (!admin) {
      return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
    }

    const daysParam = Number(request.nextUrl.searchParams.get('days') ?? '30');
    const days = Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 30;

    return NextResponse.json(await getReportStatsData({ days }));
  } catch (error) {
    console.error('Admin report stats error:', error);
    return NextResponse.json({ message: 'Unable to load report statistics.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getAdminStatisticsData, requireAdminPayload } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const admin = await requireAdminPayload(request);

  if (!admin) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
  }

  return NextResponse.json(await getAdminStatisticsData());
}

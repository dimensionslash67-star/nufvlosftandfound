import { subDays } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthorized(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  const authorization = request.headers.get('authorization');
  const forwardedSecret = request.headers.get('x-cron-secret');

  return authorization === `Bearer ${secret}` || forwardedSecret === secret;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ message: 'Unauthorized cron request.' }, { status: 401 });
    }

    const cutoffDate = subDays(new Date(), 30);
    const now = new Date();

    const result = await prisma.item.updateMany({
      where: {
        status: {
          in: ['PENDING', 'CLAIMED'],
        },
        isDisposed: false,
        dateReported: {
          lt: cutoffDate,
        },
      },
      data: {
        status: 'DISPOSED',
        isDisposed: true,
        disposalDate: now,
        isOverdue: false,
      },
    });

    return NextResponse.json({
      message: 'Disposal cron completed.',
      disposedCount: result.count,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    console.error('Disposal cron failed:', error);

    return NextResponse.json({ message: 'Disposal cron failed.' }, { status: 500 });
  }
}

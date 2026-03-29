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

    const now = new Date();

    const result = await prisma.item.updateMany({
      where: {
        isDisposed: false,
        isOverdue: false,
        dueDate: {
          not: null,
          lt: now,
        },
      },
      data: {
        isOverdue: true,
      },
    });

    return NextResponse.json({
      message: 'Overdue cron completed.',
      overdueCount: result.count,
      processedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Overdue cron failed:', error);

    return NextResponse.json({ message: 'Overdue cron failed.' }, { status: 500 });
  }
}

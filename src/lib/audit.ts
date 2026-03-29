import { prisma } from './prisma';

export async function createAuditLog({
  userId,
  action,
  entityType,
  entityId,
  details,
  request,
}: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
  request?: Request;
}) {
  const ipAddress =
    request?.headers.get('x-forwarded-for') ||
    request?.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request?.headers.get('user-agent') || 'unknown';

  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
    },
  });
}


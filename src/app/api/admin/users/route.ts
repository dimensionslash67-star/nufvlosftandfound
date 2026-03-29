import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { getUsersPageData, requireAdminPayload } from '@/lib/admin';
import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { adminUserCreateSchema, adminUserUpdateSchema } from '@/lib/validations';

function normalizeOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdminPayload(request);

  if (!admin) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
  }

  const page = Number(request.nextUrl.searchParams.get('page') ?? '1');
  const search = request.nextUrl.searchParams.get('search') ?? undefined;

  return NextResponse.json(await getUsersPageData({ page, search }));
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminPayload(request);

  if (!admin) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
  }

  const json = await request.json();
  const parsed = adminUserCreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Validation failed.', errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: parsed.data.email.toLowerCase() },
        { username: parsed.data.username },
      ],
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ message: 'Email or username already exists.' }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      username: parsed.data.username.trim(),
      password: await hashPassword(parsed.data.password),
      firstName: normalizeOptionalString(parsed.data.firstName),
      lastName: normalizeOptionalString(parsed.data.lastName),
      role: parsed.data.role,
    },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await createAuditLog({
    userId: admin.userId,
    action: 'ADMIN_USER_CREATED',
    entityType: 'USER',
    entityId: user.id,
    details: { username: user.username, role: user.role },
    request,
  });

  return NextResponse.json({ message: 'User created successfully.', user }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdminPayload(request);

  if (!admin) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
  }

  const json = await request.json();
  const parsed = adminUserUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Validation failed.', errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: parsed.data.id },
    data: {
      role: parsed.data.role,
      isActive: parsed.data.isActive,
    },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await createAuditLog({
    userId: admin.userId,
    action: 'ADMIN_USER_UPDATED',
    entityType: 'USER',
    entityId: user.id,
    details: parsed.data,
    request,
  });

  return NextResponse.json({ message: 'User updated successfully.', user });
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdminPayload(request);

  if (!admin) {
    return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
  }

  const json = await request.json();
  const id = json?.id as string | undefined;

  if (!id) {
    return NextResponse.json({ message: 'User id is required.' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await createAuditLog({
    userId: admin.userId,
    action: 'ADMIN_USER_DEACTIVATED',
    entityType: 'USER',
    entityId: user.id,
    details: { username: user.username },
    request,
  });

  return NextResponse.json({ message: 'User deactivated successfully.', user });
}

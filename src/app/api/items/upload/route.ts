import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { getAuthPayloadFromRequest } from '@/lib/auth';
import { sanitizeFileName, uploadConfig } from '@/lib/upload';

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuthPayloadFromRequest(request);

    if (!payload?.userId) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'Please provide an image file.' }, { status: 400 });
    }

    if (!uploadConfig.allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        {
          message: `Unsupported file type. Allowed: ${uploadConfig.allowedMimeTypes.join(', ')}`,
        },
        { status: 400 },
      );
    }

    if (file.size > uploadConfig.maxFileSize) {
      return NextResponse.json(
        {
          message: `File exceeds the maximum size of ${Math.round(uploadConfig.maxFileSize / 1024 / 1024)}MB.`,
        },
        { status: 400 },
      );
    }

    const blob = await put(`items/${sanitizeFileName(file.name)}`, file, {
      access: 'public',
    });

    await createAuditLog({
      userId: payload.userId,
      action: 'ITEM_IMAGE_UPLOADED',
      entityType: 'ITEM',
      details: { fileName: file.name, url: blob.url },
      request,
    });

    return NextResponse.json({
      message: 'Image uploaded successfully.',
      url: blob.url,
    });
  } catch (error) {
    console.error('Upload item image error:', error);

    return NextResponse.json({ message: 'Unable to upload image.' }, { status: 500 });
  }
}

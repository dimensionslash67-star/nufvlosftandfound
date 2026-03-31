import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateITSupportEmail, getITSupportEmailAddress, sendEmail } from '@/lib/email';

const supportSchema = z.object({
  email: z.string().trim().email('A valid email address is required.'),
  message: z.string().trim().min(10, 'Please include more detail in your message.'),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = supportSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid support request.' },
        { status: 400 },
      );
    }

    await sendEmail({
      to: getITSupportEmailAddress(),
      subject: `IT Support Request from ${parsed.data.email}`,
      html: generateITSupportEmail(parsed.data.email, parsed.data.message),
    });

    await sendEmail({
      to: parsed.data.email,
      subject: 'IT Support Request Received - NUFV Lost & Found',
      html: `
        <p>Hello,</p>
        <p>We received your IT support request and will get back to you as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <p>${parsed.data.message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br />')}</p>
        <br />
        <p>Best regards,<br />NUFV Lost &amp; Found IT Support</p>
      `,
    });

    return NextResponse.json({
      message: 'Your message has been sent. We will respond to your email shortly.',
    });
  } catch (error) {
    console.error('IT support contact error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 },
    );
  }
}

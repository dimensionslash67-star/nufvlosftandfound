import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.LOST_AND_FOUND_EMAIL_USER || 'lostandfound@nu-fairview.edu.ph';
const EMAIL_PASS = process.env.LOST_AND_FOUND_EMAIL_PASS;
const IT_SUPPORT_EMAIL = process.env.IT_SUPPORT_EMAIL || 'aureocv@students.nu-fairview.edu.ph';
const APP_URL =
  process.env.APP_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

let transporter: nodemailer.Transporter | null = null;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTransporter() {
  if (!EMAIL_PASS) {
    throw new Error('LOST_AND_FOUND_EMAIL_PASS is not configured.');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  }

  return transporter;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const info = await getTransporter().sendMail({
    from: `"NUFV Lost & Found" <${EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  return { success: true, messageId: info.messageId };
}

export function getITSupportEmailAddress() {
  return IT_SUPPORT_EMAIL;
}

export function getAppUrl() {
  return APP_URL;
}

export function generatePasswordResetEmail(resetLink: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e3a8a; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #10b981;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password for the NUFV Lost & Found system.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1e3a8a;">${resetLink}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you did not request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>NUFV Lost & Found System</p>
            <p>Student Discipline Office, 2nd Floor</p>
            <p>${EMAIL_USER}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateITSupportEmail(userEmail: string, message: string) {
  const safeEmail = escapeHtml(userEmail);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e3a8a; color: white; padding: 20px; }
          .content { padding: 20px; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>IT Support Request</h2>
          </div>
          <div class="content">
            <p><strong>From:</strong> ${safeEmail}</p>
            <p><strong>Message:</strong></p>
            <p>${safeMessage}</p>
            <hr />
            <p style="font-size: 12px; color: #666;">
              This message was sent from the NUFV Lost & Found system IT Support form.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

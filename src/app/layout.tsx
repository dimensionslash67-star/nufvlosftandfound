import type { Metadata } from 'next';
import { SurveyWidget } from '@/components/SurveyWidget';
import './globals.css';

export const metadata: Metadata = {
  title: 'NUFV Lost and Found',
  description: 'Next.js migration scaffold for the NUFV lost and found platform.',
  icons: {
    icon: '/images/logo-circle.png',
    shortcut: '/images/logo-circle.png',
    apple: '/images/logo-circle.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <SurveyWidget />
      </body>
    </html>
  );
}

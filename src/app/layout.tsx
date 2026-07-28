import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NUFV Lost and Found | National University Fairview',
  description:
    'Search, report, and claim lost items at National University Fairview. Browse currently available found items or report something you lost.',
  openGraph: {
    title: 'NUFV Lost and Found',
    description:
      'Search, report, and claim lost items at National University Fairview.',
    url: 'https://nufv-lostandfound.vercel.app',
    siteName: 'NUFV Lost and Found',
    images: [
      {
        url: 'https://nufv-lostandfound.vercel.app/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NUFV Lost and Found',
      },
    ],
    locale: 'en_PH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NUFV Lost and Found',
    description:
      'Search, report, and claim lost items at National University Fairview.',
    images: ['https://nufv-lostandfound.vercel.app/images/og-image.png'],
  },
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
      </body>
    </html>
  );
}

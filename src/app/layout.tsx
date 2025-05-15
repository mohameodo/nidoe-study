import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientRootLayout from '@/components/layouts/ClientRootLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nidoe - Smart Study Helper',
  description: 'AI-powered quiz and study application for students. Upload your study materials and let AI generate custom quizzes, summaries, and study guides.',
  keywords: ['study app', 'AI quiz generator', 'smart study', 'education app', 'learning tool'],
  authors: [{ name: 'Nidoe Team' }],
  creator: 'Nidoe',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'apple-icon',
        url: '/apple-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/icons/icon-192x192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '384x384',
        url: '/icons/icon-384x384.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        url: '/icons/icon-512x512.png',
      },
    ],
  },
  manifest: '/manifest.json',
  applicationName: 'Nidoe',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nidoe',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="size-adjustment">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <link rel="mask-icon" href="/favicon.png" color="#000000" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground pb-12 md:pb-0`}>
        <ClientRootLayout>
          {children}
        </ClientRootLayout>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                      console.log('Service Worker registered with scope:', registration.scope);
                    })
                    .catch(error => {
                      console.error('Service Worker registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
} 
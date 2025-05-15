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
    icon: [
      { url: '/favicon.png', type: 'image/png' }
    ],
    shortcut: '/favicon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground pb-16 md:pb-0`}>
        <ClientRootLayout>
          {children}
        </ClientRootLayout>
      </body>
    </html>
  );
} 
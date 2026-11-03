import type { Metadata } from 'next';
import './globals.css';
import { LedgerProvider } from '@/lib/store/ledger-context';

export const metadata: Metadata = {
  title: 'Ledger AI — Intelligent Accounting & Financial Management',
  description:
    'Ledger AI is a modern, AI-powered accounting and financial management platform with double-entry ledgers, automated reconciliation, GST compliance, and intelligent workflows.',
  keywords: ['accounting software', 'GST', 'Ledger AI', 'business accounting', 'ERP'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="h-full bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <LedgerProvider>{children}</LedgerProvider>
      </body>
    </html>
  );
}

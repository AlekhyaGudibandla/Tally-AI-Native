import type { Metadata } from 'next';
import './globals.css';
import { LedgerProvider } from '@/lib/store/ledger-context';

export const metadata: Metadata = {
  title: 'Vahi — Familiar Accounting, Redesigned for the AI Era',
  description:
    'Vahi is the AI-native accounting and business operating platform. Familiar Tally-grade double-entry accounting with automated reconciliation, GST, e-invoicing and intelligent workflows.',
  keywords: ['accounting software', 'GST', 'Tally alternative', 'AI accounting', 'India ERP'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="h-full bg-[#f2f6fa] text-slate-900 antialiased selection:bg-[#ffbe00] selection:text-slate-900">
        <LedgerProvider>{children}</LedgerProvider>
      </body>
    </html>
  );
}

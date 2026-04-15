import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { TRPCProvider } from '@/lib/trpc/provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ITY - I Teach You',
  description: 'The simplest way to create your online school',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <TRPCProvider>{children}</TRPCProvider>
        <Toaster
          position="top-right"
          richColors={false}
          duration={3000}
          toastOptions={{
            classNames: {
              toast: 'bg-zinc-800 border border-zinc-700 text-zinc-200 shadow-xl',
              success: '!border-l-4 !border-l-[#a7f3d0]',
              error: '!border-l-4 !border-l-[#fecaca]',
              warning: '!border-l-4 !border-l-[#fef3c7]',
              info: '!border-l-4 !border-l-[#bfdbfe]',
            },
          }}
        />
      </body>
    </html>
  );
}

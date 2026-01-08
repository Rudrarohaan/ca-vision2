import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { FirebaseClientProvider } from '@/firebase/client-provider';

const fontBody = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const fontHeadline = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-headline',
});

export const metadata: Metadata = {
  title: 'CA Exam Prep',
  description: 'Generate MCQs for CA exams using AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          'font-body antialiased',
          fontBody.variable,
          fontHeadline.variable
        )}
      >
        <FirebaseClientProvider>
          <div className="flex min-h-screen flex-col bg-background text-foreground">
            <Header />
            <main className="flex-1 flex flex-col">{children}</main>
          </div>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

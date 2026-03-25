import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RankRebuild — AI Website Management',
  description: 'Update your WordPress site with AI. Chat to edit, preview changes, deploy with one click.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} bg-slate-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'RankRebuild — AI Website Management for WordPress',
    template: '%s | RankRebuild',
  },
  description:
    'Update your WordPress website using AI chat. Describe changes in plain English, preview before publishing, and deploy in one click. No developers needed.',
  metadataBase: new URL('https://rankrebuild.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ scrollBehavior: 'smooth' }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${geist.className} bg-slate-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}

import './globals.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import EngineInitializer from '@/components/EngineInitializer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Project Volt | Local-First Video Editor',
  description: 'High-performance video editing in the browser powered by Go WASM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script src="/wasm_exec.js" strategy="beforeInteractive" />
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <EngineInitializer />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Store - Your Trusted E-Commerce Destination',
    template: '%s | Store',
  },
  description: 'Discover quality products at great prices. Your trusted e-commerce destination.',
  keywords: ['ecommerce', 'online shopping', 'products'],
  authors: [{ name: 'Store' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Store',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

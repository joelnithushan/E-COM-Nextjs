import type { Metadata } from 'next';
import { generateLegalPageMetadata } from '@/lib/seo';

export const metadata: Metadata = generateLegalPageMetadata({
  title: 'Contact Us',
  description: 'Get in touch with us. We are here to help with any questions about our products, orders, or services.',
  path: '/contact',
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}




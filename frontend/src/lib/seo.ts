import { Metadata } from 'next';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  nofollow?: boolean;
}

/**
 * Generate SEO metadata for Next.js pages
 */
export function generateMetadata({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  noindex = false,
  nofollow = false,
}: SEOProps): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourstore.com';
  const defaultImage = `${siteUrl}/og-image.jpg`;
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullImage = image ? (image.startsWith('http') ? image : `${siteUrl}${image}`) : defaultImage;

  return {
    title: `${title} | Store`,
    description,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    authors: [{ name: 'Store' }],
    creator: 'Store',
    publisher: 'Store',
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type,
      url: fullUrl,
      title,
      description,
      siteName: 'Store',
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullImage],
    },
    alternates: {
      canonical: fullUrl,
    },
  };
}

/**
 * Generate structured data (JSON-LD) for products
 */
export function generateProductStructuredData(product: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  sku?: string;
  brand?: string;
  rating?: {
    average: number;
    count: number;
  };
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourstore.com';
  const productUrl = `${siteUrl}/products/${product.sku || ''}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Store',
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: product.currency || 'USD',
      price: product.price,
      availability: `https://schema.org/${product.availability || 'InStock'}`,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    ...(product.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating.average,
        reviewCount: product.rating.count,
      },
    }),
  };
}

/**
 * Generate structured data for breadcrumbs
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate structured data for organization
 */
/**
 * Generate metadata for legal pages
 */
export function generateLegalPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourstore.com';
  const fullUrl = `${siteUrl}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: `${title} | Store`,
      description,
      url: fullUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${title} | Store`,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function generateOrganizationStructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourstore.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Store',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      // Add social media links
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      // Add contact information
    },
  };
}


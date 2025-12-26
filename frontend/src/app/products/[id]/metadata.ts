import { Metadata } from 'next';
import { getProduct } from '@/lib/api/products.api';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

/**
 * Generate metadata for product detail pages
 * This is used in the page.tsx file
 */
export async function generateProductMetadata(
  productId: string
): Promise<Metadata> {
  try {
    const response = await getProduct(productId);
    
    if (!response.success || !response.data.product) {
      return generateSEOMetadata({
        title: 'Product Not Found',
        description: 'The product you are looking for could not be found.',
        noindex: true,
      });
    }

    const product = response.data.product;
    const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];

    return generateSEOMetadata({
      title: product.name,
      description: product.shortDescription || product.description,
      keywords: [
        product.name,
        product.category?.name || '',
        ...(product.tags || []),
      ].filter(Boolean),
      image: primaryImage?.url,
      url: `/products/${product._id}`,
      type: 'product',
    });
  } catch (error) {
    return generateSEOMetadata({
      title: 'Product',
      description: 'View product details',
    });
  }
}




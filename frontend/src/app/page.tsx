import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import Button from '@/components/ui/Button';
import { getProducts } from '@/lib/api/products.api';
import { getAllCategories } from '@/lib/api/categories.api';
import ProductGrid from '@/components/product/ProductGrid';
import { Product } from '@/lib/api/products.api';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Shop premium imported shoes in Sri Lanka. Discover quality footwear from top international brands at Zyra.',
  openGraph: {
    title: 'Zyra - Premium Imported Shoes in Sri Lanka',
    description: 'Shop premium imported shoes in Sri Lanka. Discover quality footwear from top international brands.',
    type: 'website',
  },
};

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const response = await getProducts({
      featured: true,
      limit: 8,
      status: 'active',
    });
    return response.success ? response.data.products : [];
  } catch (error) {
    return [];
  }
}

async function getCategories() {
  try {
    const response = await getAllCategories();
    return response.success ? response.data.categories : [];
  } catch (error) {
    return [];
  }
}

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <>
      {/* Hero Section */}
      <Section padding="xl" background="primary" className="text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Welcome to Zyra
          </h1>
          <p className="text-xl md:text-2xl text-white mb-8">
            Premium Imported Shoes in Sri Lanka
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Shop Now
              </Button>
            </Link>
            <Link href="/products?featured=true">
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 border-white text-white hover:bg-white/20">
                Featured Products
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <Section padding="lg">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-lg text-gray-600">
              Browse our wide selection of products
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.slice(0, 8).map((category) => (
              <Link
                key={category._id}
                href={`/products?category=${category._id}`}
                className="group"
              >
                <div className="card card-hover p-6 text-center">
                  {category.image?.url && (
                    <div className="relative w-16 h-16 mx-auto mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={category.image.url}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900 group-hover:text-black transition-colors underline"
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/products">
              <Button variant="outline">View All Categories</Button>
            </Link>
          </div>
        </Section>
      )}

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <Section padding="lg" background="gray">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600">
              Handpicked products just for you
            </p>
          </div>

          <ProductGrid products={featuredProducts} />

          <div className="text-center mt-8">
            <Link href="/products?featured=true">
              <Button variant="primary" size="lg">
                View All Featured Products
              </Button>
            </Link>
          </div>
        </Section>
      )}

      {/* Features Section */}
      <Section padding="lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Quality Guaranteed
            </h3>
            <p className="text-gray-600">
              All products are carefully selected and quality tested
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Fast Shipping
            </h3>
            <p className="text-gray-600">
              Quick and reliable delivery to your doorstep
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Secure Payment
            </h3>
            <p className="text-gray-600">
              Your payment information is safe and secure
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}

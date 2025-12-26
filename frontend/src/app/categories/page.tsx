import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import { getAllCategories } from '@/lib/api/categories.api';
import { generateLegalPageMetadata } from '@/lib/seo';

export const metadata: Metadata = generateLegalPageMetadata({
  title: 'Categories',
  description: 'Browse all shoe categories at Zyra - Running Shoes, Casual Sneakers, Basketball Shoes, Skate Shoes, and more.',
  path: '/categories',
});

export default async function CategoriesPage() {
  let categories = [];
  
  try {
    const response = await getAllCategories();
    if (response.success) {
      categories = response.data.categories.filter(cat => cat.status === 'active');
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
  }

  return (
    <Section padding="lg">
      <Container>
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our wide selection of premium imported shoes organized by category. Find the perfect pair for your needs.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-6">No categories available at the moment.</p>
            <Link href="/products">
              <button className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                Browse All Products
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {categories.map((category) => (
              <Link
                key={category._id}
                href={`/products?category=${category._id}`}
                className="group"
              >
                <div className="card card-hover p-8 text-center h-full flex flex-col">
                  {category.image?.url ? (
                    <div className="relative w-24 h-24 mx-auto mb-6 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={category.image.url}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 mx-auto mb-6 rounded-lg bg-gray-200 flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-black transition-colors">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-gray-600 text-sm mb-4 flex-grow">
                      {category.description}
                    </p>
                  )}
                  <div className="mt-auto">
                    <span className="text-black font-medium text-sm group-hover:underline">
                      Shop {category.name} →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Browse All Products Link */}
        <div className="text-center mt-12">
          <Link href="/products">
            <button className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
              View All Products
            </button>
          </Link>
        </div>
      </Container>
    </Section>
  );
}


import { Metadata } from 'next';
import Link from 'next/link';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import Button from '@/components/ui/Button';
import { generateLegalPageMetadata } from '@/lib/seo';

export const metadata: Metadata = generateLegalPageMetadata({
  title: 'About Us',
  description: 'Learn about Zyra - Premium imported shoes in Sri Lanka. Discover our mission, values, and commitment to quality footwear.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <Section padding="lg">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              About Zyra
            </h1>
            <p className="text-xl text-gray-600">
              Premium Imported Shoes in Sri Lanka
            </p>
          </div>

          {/* Mission Section */}
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Our Mission
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              At Zyra, we are dedicated to bringing you the finest imported footwear from top international brands. Our mission is to provide quality, style, and comfort to customers across Sri Lanka, making premium shoes accessible to everyone.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              We carefully curate our collection to ensure every pair of shoes meets our high standards for quality, durability, and design. Whether you're looking for running shoes, casual sneakers, basketball shoes, or skate shoes, we have something for everyone.
            </p>
          </div>

          {/* Values Section */}
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Our Values
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Quality First
                </h3>
                <p className="text-gray-700">
                  We source only authentic, high-quality footwear from trusted international brands. Every product in our collection is carefully inspected to ensure it meets our standards.
                </p>
              </div>
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Customer Satisfaction
                </h3>
                <p className="text-gray-700">
                  Your satisfaction is our priority. We provide excellent customer service, easy returns, and support throughout your shopping experience.
                </p>
              </div>
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Authenticity
                </h3>
                <p className="text-gray-700">
                  All our products are 100% authentic and imported directly from authorized distributors. We guarantee the authenticity of every pair of shoes we sell.
                </p>
              </div>
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Accessibility
                </h3>
                <p className="text-gray-700">
                  We believe everyone deserves access to quality footwear. Our competitive pricing and flexible payment options make premium shoes accessible to all.
                </p>
              </div>
            </div>
          </div>

          {/* Why Choose Us Section */}
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Why Choose Zyra?
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-black font-bold mr-3">✓</span>
                <div>
                  <strong className="text-gray-900">Wide Selection:</strong>
                  <span className="text-gray-700"> Browse through hundreds of styles from top brands like Nike, Adidas, Puma, New Balance, and more.</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-black font-bold mr-3">✓</span>
                <div>
                  <strong className="text-gray-900">Authentic Products:</strong>
                  <span className="text-gray-700"> All products are 100% authentic, imported directly from authorized distributors.</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-black font-bold mr-3">✓</span>
                <div>
                  <strong className="text-gray-900">Fast Shipping:</strong>
                  <span className="text-gray-700"> We offer fast and reliable shipping across Sri Lanka with secure packaging.</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-black font-bold mr-3">✓</span>
                <div>
                  <strong className="text-gray-900">Easy Returns:</strong>
                  <span className="text-gray-700"> Not satisfied? We offer hassle-free returns within 30 days of purchase.</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-black font-bold mr-3">✓</span>
                <div>
                  <strong className="text-gray-900">Customer Support:</strong>
                  <span className="text-gray-700"> Our dedicated support team is here to help you with any questions or concerns.</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="text-center p-8 border border-gray-200 rounded-lg bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Have Questions?
            </h2>
            <p className="text-gray-700 mb-6">
              We'd love to hear from you. Get in touch with our team for any inquiries.
            </p>
            <Link href="/contact">
              <Button variant="primary" size="lg">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}


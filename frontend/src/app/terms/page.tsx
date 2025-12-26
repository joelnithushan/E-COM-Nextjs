import type { Metadata } from 'next';
import Container from '@/components/layout/Container';
import { generateLegalPageMetadata } from '@/lib/seo';

export const metadata: Metadata = generateLegalPageMetadata({
  title: 'Terms & Conditions',
  description: 'Read our terms and conditions to understand the rules and regulations for using our e-commerce platform and services.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <Container>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>
          <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Use License</h2>
            <p className="text-gray-700 mb-4">
              Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Account Registration</h2>
            <p className="text-gray-700 mb-4">
              To access certain features of our website, you may be required to register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and identification</li>
              <li>Accept all responsibility for activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Products and Pricing</h2>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 Product Information</h3>
            <p className="text-gray-700 mb-4">
              We strive to provide accurate product descriptions and images. However, we do not warrant that product descriptions or other content on this site is accurate, complete, reliable, current, or error-free.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Pricing</h3>
            <p className="text-gray-700 mb-4">
              All prices are displayed in the currency specified and are subject to change without notice. We reserve the right to correct any pricing errors, even after an order has been placed. If we discover an error in pricing, we will notify you and give you the option to cancel your order or pay the correct price.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Orders and Payment</h2>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.1 Order Acceptance</h3>
            <p className="text-gray-700 mb-4">
              Your order is an offer to purchase products from us. We reserve the right to accept or reject your order for any reason, including product availability, errors in pricing or product information, or problems identified by our credit and fraud avoidance department.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.2 Payment</h3>
            <p className="text-gray-700 mb-4">
              Payment must be received before we ship your order. We accept major credit cards and other payment methods as indicated on our website. By providing payment information, you represent and warrant that you are authorized to use the payment method.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Shipping and Delivery</h2>
            <p className="text-gray-700 mb-4">
              We will arrange for shipment of products to you. Shipping costs and estimated delivery times are provided at checkout. We are not responsible for delays caused by shipping carriers or customs. Risk of loss and title for products pass to you upon delivery to the carrier.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Returns and Refunds</h2>
            <p className="text-gray-700 mb-4">
              Please review our Refund Policy, which also governs your use of our service, to understand our practices regarding returns and refunds.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              The content on this website, including text, graphics, logos, images, and software, is the property of our company or its content suppliers and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works from any content without our express written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Prohibited Uses</h2>
            <p className="text-gray-700 mb-4">You may not use our website:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>In any way that violates any applicable law or regulation</li>
              <li>To transmit any malicious code or viruses</li>
              <li>To collect or track personal information of others</li>
              <li>To spam, phish, or engage in any fraudulent activity</li>
              <li>To interfere with or disrupt the website or servers</li>
              <li>To impersonate or attempt to impersonate our company or employees</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              In no event shall our company, its directors, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the website or services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to defend, indemnify, and hold harmless our company and its employees from and against any claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including attorney's fees) arising from your use of the website or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in [Your Jurisdiction].
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the website after such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">14. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms & Conditions, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg mt-4">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong> legal@yourstore.com
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Phone:</strong> +1 (555) 123-4567
              </p>
              <p className="text-gray-700">
                <strong>Address:</strong> 123 Commerce Street, Business City, BC 12345
              </p>
            </div>
          </section>
        </div>
      </div>
    </Container>
  );
}




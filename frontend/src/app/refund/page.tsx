import type { Metadata } from 'next';
import Container from '@/components/layout/Container';
import Link from 'next/link';
import { generateLegalPageMetadata } from '@/lib/seo';

export const metadata: Metadata = generateLegalPageMetadata({
  title: 'Refund Policy',
  description: 'Learn about our refund policy, return process, and how to request a refund for your purchase.',
  path: '/refund',
});

export default function RefundPolicyPage() {
  return (
    <Container>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Refund Policy</h1>
          <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Overview</h2>
            <p className="text-gray-700 mb-4">
              We want you to be completely satisfied with your purchase. This Refund Policy explains our process for returns, refunds, and exchanges. Please read this policy carefully before making a purchase.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Return Eligibility</h2>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.1 Timeframe</h3>
            <p className="text-gray-700 mb-4">
              You have <strong>30 days</strong> from the date of delivery to return an item for a refund or exchange. Items must be returned in their original condition, unused, and with all original packaging and tags attached.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.2 Eligible Items</h3>
            <p className="text-gray-700 mb-4">Most items are eligible for return, except:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Personalized or custom-made items</li>
              <li>Perishable goods</li>
              <li>Intimate or sanitary goods (for health and hygiene reasons)</li>
              <li>Items that have been used, damaged, or altered</li>
              <li>Digital products or downloadable software</li>
              <li>Gift cards</li>
              <li>Items purchased on sale or clearance (unless defective)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Return Process</h2>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Initiating a Return</h3>
            <p className="text-gray-700 mb-4">To initiate a return:</p>
            <ol className="list-decimal pl-6 text-gray-700 mb-4 space-y-2">
              <li>Log into your account and go to your order history</li>
              <li>Select the order containing the item you wish to return</li>
              <li>Click "Request Return" and select the item(s)</li>
              <li>Provide a reason for the return</li>
              <li>Submit your return request</li>
            </ol>
            <p className="text-gray-700 mb-4">
              Alternatively, you can contact our customer service team at <a href="mailto:returns@yourstore.com" className="text-blue-600 hover:underline">returns@yourstore.com</a> or call us at +1 (555) 123-4567.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Return Authorization</h3>
            <p className="text-gray-700 mb-4">
              Once your return request is approved, you will receive a Return Authorization (RA) number and return shipping instructions. Please include the RA number with your return package.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.3 Shipping the Return</h3>
            <p className="text-gray-700 mb-4">
              Package the item securely in its original packaging (if available) and include all original tags, labels, and accessories. Ship the item to the address provided in your return instructions. We recommend using a trackable shipping method and retaining your shipping receipt.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Refund Processing</h2>
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 Inspection</h3>
            <p className="text-gray-700 mb-4">
              Once we receive your returned item, we will inspect it to ensure it meets our return criteria. This process typically takes 3-5 business days.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Refund Timeline</h3>
            <p className="text-gray-700 mb-4">
              If your return is approved, we will process your refund within <strong>5-10 business days</strong> after receiving and inspecting the item. The refund will be issued to the original payment method used for the purchase.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.3 Refund Amount</h3>
            <p className="text-gray-700 mb-4">
              You will receive a full refund of the item price, excluding:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Original shipping costs (unless the item was defective or incorrect)</li>
              <li>Return shipping costs (unless the return is due to our error)</li>
              <li>Any restocking fees (if applicable)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Exchanges</h2>
            <p className="text-gray-700 mb-4">
              We currently do not offer direct exchanges. If you wish to exchange an item, please return the original item for a refund and place a new order for the desired item. This ensures you receive the correct item quickly and allows us to process your return efficiently.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Defective or Incorrect Items</h2>
            <p className="text-gray-700 mb-4">
              If you receive a defective item or an item that differs from what you ordered, please contact us immediately. We will:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Provide a prepaid return shipping label</li>
              <li>Process a full refund including original shipping costs</li>
              <li>Offer to send a replacement item at no additional cost (if available)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Cancellations</h2>
            <p className="text-gray-700 mb-4">
              You may cancel an order before it ships. Once an order has been shipped, it cannot be cancelled, but you may return it following our standard return process. To cancel an order, contact us as soon as possible with your order number.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Non-Refundable Items</h2>
            <p className="text-gray-700 mb-4">The following items are non-refundable:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Gift cards</li>
              <li>Digital products and downloadable content</li>
              <li>Personalized or custom-made items (unless defective)</li>
              <li>Items returned after the 30-day return period</li>
              <li>Items not in original condition</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. International Returns</h2>
            <p className="text-gray-700 mb-4">
              For international orders, return shipping costs are the responsibility of the customer unless the return is due to our error. Please note that customs duties and taxes are non-refundable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Store Credit</h2>
            <p className="text-gray-700 mb-4">
              In some cases, we may offer store credit instead of a refund. Store credit will be issued to your account and can be used for future purchases. Store credit does not expire and can be combined with other promotions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Questions or Concerns</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about our refund policy or need assistance with a return, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg mt-4">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong> <a href="mailto:returns@yourstore.com" className="text-blue-600 hover:underline">returns@yourstore.com</a>
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Phone:</strong> +1 (555) 123-4567
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Address:</strong> 123 Commerce Street, Business City, BC 12345
              </p>
              <p className="text-gray-700">
                <strong>Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM EST
              </p>
            </div>
          </section>

          <section className="mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-blue-800 mb-4">
                Our customer service team is here to help. Visit our <Link href="/contact" className="text-blue-600 hover:underline font-medium">Contact page</Link> for more ways to reach us.
              </p>
            </div>
          </section>
        </div>
      </div>
    </Container>
  );
}




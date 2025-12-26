'use client';

import { useState, FormEvent } from 'react';
import Container from '@/components/layout/Container';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // TODO: Implement API endpoint for contact form submission
      // For now, this is a placeholder
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSubmitStatus({
        type: 'success',
        message: 'Thank you for contacting us! We will get back to you within 24 hours.',
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Something went wrong. Please try again or email us directly.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have a question or need help? We're here to assist you. Fill out the form below or reach us through any of the contact methods listed.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Get in Touch</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Email</h3>
                    <a
                      href="mailto:support@yourstore.com"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      support@yourstore.com
                    </a>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Phone</h3>
                    <a
                      href="tel:+15551234567"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      +1 (555) 123-4567
                    </a>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Address</h3>
                    <p className="text-gray-600 text-sm">
                      123 Commerce Street<br />
                      Business City, BC 12345<br />
                      United States
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Business Hours</h3>
                    <p className="text-gray-600 text-sm">
                      Monday - Friday: 9:00 AM - 5:00 PM EST<br />
                      Saturday: 10:00 AM - 2:00 PM EST<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="/refund" className="text-blue-600 hover:text-blue-700">
                      Refund Policy
                    </a>
                  </li>
                  <li>
                    <a href="/terms" className="text-blue-600 hover:text-blue-700">
                      Terms & Conditions
                    </a>
                  </li>
                  <li>
                    <a href="/privacy" className="text-blue-600 hover:text-blue-700">
                      Privacy Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {submitStatus.type && (
                <Alert
                  variant={submitStatus.type === 'success' ? 'success' : 'error'}
                  title={submitStatus.type === 'success' ? 'Success' : 'Error'}
                  className="mb-6"
                >
                  {submitStatus.message}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Phone
                    </label>
                    <Input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 placeholder:text-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-colors"
                    >
                      <option value="">Select a subject</option>
                      <option value="order">Order Inquiry</option>
                      <option value="shipping">Shipping & Delivery</option>
                      <option value="return">Returns & Refunds</option>
                      <option value="product">Product Question</option>
                      <option value="account">Account Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 placeholder:text-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-colors resize-none"
                    placeholder="Please provide details about your inquiry..."
                  />
                </div>

                <div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}


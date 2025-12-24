'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import ImageUpload, { UploadedImage } from '@/components/admin/ImageUpload';
import { createProduct } from '@/lib/api/admin.api';
import { getAllCategories, Category } from '@/lib/api/categories.api';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    compareAtPrice: '',
    category: '',
    stock: '',
    sku: '',
    status: 'active' as 'active' | 'inactive' | 'draft',
    featured: false,
    tags: '',
    metaTitle: '',
    metaDescription: '',
  });

  const [images, setImages] = useState<UploadedImage[]>([]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await getAllCategories();
        if (response.success) {
          setCategories(response.data.categories);
        }
      } catch (err: any) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Product description is required');
      return;
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      setError('Valid price is required');
      return;
    }

    if (!formData.category) {
      setError('Category is required');
      return;
    }

    if (images.length === 0) {
      setError('At least one product image is required');
      return;
    }

    try {
      setLoading(true);

      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        shortDescription: formData.shortDescription.trim() || undefined,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice
          ? parseFloat(formData.compareAtPrice)
          : undefined,
        category: formData.category,
        stock: parseInt(formData.stock) || 0,
        sku: formData.sku.trim() || undefined,
        status: formData.status,
        featured: formData.featured,
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag.length > 0),
        metaTitle: formData.metaTitle.trim() || undefined,
        metaDescription: formData.metaDescription.trim() || undefined,
        images: images.map((img) => ({
          url: img.url,
          publicId: img.publicId,
          isPrimary: img.isPrimary || false,
          order: img.order || 0,
        })),
      };

      const response = await createProduct(productData as any);

      if (response.success) {
        router.push('/admin/products');
      } else {
        setError('Failed to create product');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'An error occurred while creating the product'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Product</h1>
          <p className="mt-2 text-sm text-gray-600">
            Add a new product to your catalog
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card padding="md">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <Input
                    label="Product Name *"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter product name"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="input-base"
                      placeholder="Enter detailed product description"
                    />
                  </div>

                  <Input
                    label="Short Description"
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleInputChange}
                    placeholder="Brief description (max 200 characters)"
                    helperText="This appears in product listings and search results"
                  />
                </div>
              </Card>

              {/* Images */}
              <Card padding="md">
                <ImageUpload
                  folder="products"
                  maxImages={10}
                  existingImages={images}
                  onImagesChange={setImages}
                  disabled={loading}
                />
              </Card>

              {/* Pricing */}
              <Card padding="md">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Price *"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    placeholder="0.00"
                  />

                  <Input
                    label="Compare at Price"
                    name="compareAtPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.compareAtPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    helperText="Original price (for showing discounts)"
                  />
                </div>
              </Card>

              {/* SEO */}
              <Card padding="md">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings</h2>
                <div className="space-y-4">
                  <Input
                    label="Meta Title"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    placeholder="SEO title (max 60 characters)"
                    maxLength={60}
                    helperText={`${formData.metaTitle.length}/60 characters`}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      name="metaDescription"
                      value={formData.metaDescription}
                      onChange={handleInputChange}
                      rows={3}
                      className="input-base"
                      placeholder="SEO description (max 160 characters)"
                      maxLength={160}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.metaDescription.length}/160 characters
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status & Settings */}
              <Card padding="md">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Status & Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="input-base"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    {loadingCategories ? (
                      <Spinner size="sm" />
                    ) : (
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="input-base"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="featured"
                      id="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                      Featured Product
                    </label>
                  </div>
                </div>
              </Card>

              {/* Inventory */}
              <Card padding="md">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
                <div className="space-y-4">
                  <Input
                    label="Stock Quantity"
                    name="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="0"
                  />

                  <Input
                    label="SKU"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="Product SKU"
                    helperText="Stock Keeping Unit (optional)"
                  />
                </div>
              </Card>

              {/* Tags */}
              <Card padding="md">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
                <Input
                  label="Tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="tag1, tag2, tag3"
                  helperText="Separate tags with commas"
                />
              </Card>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Product'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Container>
  );
}


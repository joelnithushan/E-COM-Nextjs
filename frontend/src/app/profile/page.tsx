'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentUser } from '@/lib/api/auth.api';
import apiClient from '@/lib/api/client';

interface ProfileData {
  name: string;
  email: string;
  phone?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await getCurrentUser();
        if (response.success) {
          setProfile({
            name: response.data.user.name,
            email: response.data.user.email,
            phone: response.data.user.phone || '',
          });
        }
      } catch (err: any) {
        setError('Failed to load profile information');
      } finally {
        setLoading(false);
      }
    };

    if (authUser) {
      fetchProfile();
    }
  }, [authUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      // Update profile via API
      const response = await apiClient.put('/auth/me', {
        name: profile.name,
        phone: profile.phone || undefined,
      });

      if (response.success) {
        setSuccess('Profile updated successfully!');
        await refreshUser(); // Refresh user data in context
      } else {
        setError('Failed to update profile');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to update profile'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <ProtectedRoute requireAuth>
        <Section padding="lg">
          <Container>
            <div className="flex justify-center items-center py-20">
              <Spinner size="lg" />
            </div>
          </Container>
        </Section>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth>
      <Section padding="lg">
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Profile Settings
              </h1>
              <p className="text-gray-600">
                Manage your account information and preferences
              </p>
            </div>

            {error && (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" className="mb-6">
                {success}
              </Alert>
            )}

            <Card padding="lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Information */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Account Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Full Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={profile.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email Address
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="bg-gray-100 cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Email cannot be changed
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Phone Number
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={profile.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div className="pt-6 border-t border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Account Details
                  </h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Role:</span>
                      <span className="font-medium text-gray-900">
                        {authUser?.role === 'ADMIN' ? 'Administrator' : 'Customer'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email Verified:</span>
                      <span className="font-medium text-gray-900">
                        {authUser?.isEmailVerified ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {authUser?.createdAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Member Since:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(authUser.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => router.back()}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>

            {/* Quick Links */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card padding="md" className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      My Orders
                    </h3>
                    <p className="text-sm text-gray-600">
                      View your order history
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/orders')}
                  >
                    View
                  </Button>
                </div>
              </Card>

              <Card padding="md" className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Shopping Cart
                    </h3>
                    <p className="text-sm text-gray-600">
                      Continue shopping
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/cart')}
                  >
                    View
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </Section>
    </ProtectedRoute>
  );
}


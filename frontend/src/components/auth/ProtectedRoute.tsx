'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/ui/Spinner';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireCustomer?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireCustomer = false,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, isAdmin, isCustomer } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo || '/login');
      return;
    }

    // Check admin requirement
    if (requireAdmin && !isAdmin) {
      router.push(redirectTo || '/');
      return;
    }

    // Check customer requirement
    if (requireCustomer && !isCustomer) {
      router.push(redirectTo || '/');
      return;
    }
  }, [isLoading, isAuthenticated, isAdmin, isCustomer, requireAuth, requireAdmin, requireCustomer, redirectTo, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <Section padding="lg">
        <Container>
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        </Container>
      </Section>
    );
  }

  // Show loading while redirecting
  if (requireAuth && !isAuthenticated) {
    return (
      <Section padding="lg">
        <Container>
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        </Container>
      </Section>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <Section padding="lg">
        <Container>
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        </Container>
      </Section>
    );
  }

  if (requireCustomer && !isCustomer) {
    return (
      <Section padding="lg">
        <Container>
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        </Container>
      </Section>
    );
  }

  return <>{children}</>;
}


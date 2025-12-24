'use client';

import React from 'react';
import AdminSidebar from './AdminSidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ProtectedRoute requireAuth requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="md:pl-64 flex flex-col flex-1">
          {/* Top Bar */}
          <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
            <div className="flex-1 px-4 flex justify-between items-center">
              <div className="flex-1 flex">
                {/* Search can go here */}
              </div>
              <div className="ml-4 flex items-center md:ml-6">
                {/* User menu or notifications */}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1">
            <div className="py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}


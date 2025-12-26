'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function UserMenu() {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {user.avatar ? (
          <div className="relative w-8 h-8 rounded-full overflow-hidden">
            <Image
              src={user.avatar}
              alt={user.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="hidden md:block text-sm font-medium text-gray-700">
          {user.name.split(' ')[0]}
        </span>
        <svg
          className={cn(
            'w-4 h-4 text-gray-500 transition-transform',
            isOpen && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            {isAdmin && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-gray-200 text-black rounded border border-gray-400">
                Admin
              </span>
            )}
          </div>

          <div className="py-1">
            <Link
              href="/orders"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              My Orders
            </Link>
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Profile Settings
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Admin Dashboard
              </Link>
            )}
          </div>

          <div className="border-t border-gray-200 py-1">
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}





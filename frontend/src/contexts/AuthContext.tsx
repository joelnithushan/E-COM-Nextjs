'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  User,
  register as registerApi,
  login as loginApi,
  logout as logoutApi,
  getCurrentUser,
  RegisterData,
  LoginData,
} from '@/lib/api/auth.api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    try {
      const response = await getCurrentUser();
      if (response.success) {
        setUser(response.data.user);
      } else {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
        }
      }
    } catch (error) {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      
      if (token) {
        try {
          await refreshUser();
        } catch (error) {
          // Token invalid, clear it
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
          }
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  const login = async (data: LoginData) => {
    try {
      const response = await loginApi(data);
      if (response.success) {
        const { user, accessToken } = response.data;
        
        // Store token
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
        }
        
        setUser(user);
        
        // Redirect based on role
        if (user.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await registerApi(data);
      if (response.success) {
        const { user, accessToken } = response.data;
        
        // Store token
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
        }
        
        setUser(user);
        
        // Redirect based on role
        if (user.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      // Clear local state
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
      
      // Redirect to home
      router.push('/');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isCustomer: user?.role === 'CUSTOMER',
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



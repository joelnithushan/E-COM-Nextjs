/**
 * Feature Flags Configuration (Frontend)
 * Mirrors backend feature flags for type safety
 */

export const FEATURE_FLAGS = {
  // Product Features
  REVIEWS: 'reviews',
  PRODUCT_VARIANTS: 'product_variants',
  WISHLIST: 'wishlist',
  
  // Commerce Features
  COUPONS: 'coupons',
  GIFT_CARDS: 'gift_cards',
  LOYALTY_PROGRAM: 'loyalty_program',
  
  // Analytics & Reporting
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
  DASHBOARD_ANALYTICS: 'dashboard_analytics',
  
  // Communication
  EMAIL_NOTIFICATIONS: 'email_notifications',
  SMS_NOTIFICATIONS: 'sms_notifications',
  PUSH_NOTIFICATIONS: 'push_notifications',
  
  // Advanced Features
  MULTI_CURRENCY: 'multi_currency',
  MULTI_LANGUAGE: 'multi_language',
  INVENTORY_MANAGEMENT: 'inventory_management',
  ORDER_TRACKING: 'order_tracking',
  
  // Admin Features
  ADVANCED_ADMIN: 'advanced_admin',
  BULK_OPERATIONS: 'bulk_operations',
  EXPORT_DATA: 'export_data',
} as const;

export type FeatureFlag = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];




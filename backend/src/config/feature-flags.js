/**
 * Feature Flags Configuration
 * Centralized feature flag definitions
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
};

/**
 * Feature Flag Metadata
 * Descriptions and default values for each feature
 */
export const FEATURE_METADATA = {
  [FEATURE_FLAGS.REVIEWS]: {
    name: 'Product Reviews',
    description: 'Allow customers to leave reviews and ratings for products',
    category: 'product',
    defaultEnabled: true,
  },
  [FEATURE_FLAGS.COUPONS]: {
    name: 'Coupons & Discounts',
    description: 'Enable coupon codes and discount management',
    category: 'commerce',
    defaultEnabled: false,
  },
  [FEATURE_FLAGS.ANALYTICS]: {
    name: 'Analytics',
    description: 'Enable analytics tracking and reporting',
    category: 'analytics',
    defaultEnabled: true,
  },
  [FEATURE_FLAGS.DASHBOARD_ANALYTICS]: {
    name: 'Dashboard Analytics',
    description: 'Show analytics dashboard in admin panel',
    category: 'analytics',
    defaultEnabled: true,
  },
  [FEATURE_FLAGS.EMAIL_NOTIFICATIONS]: {
    name: 'Email Notifications',
    description: 'Send email notifications for orders and updates',
    category: 'communication',
    defaultEnabled: true,
  },
  [FEATURE_FLAGS.SMS_NOTIFICATIONS]: {
    name: 'SMS Notifications',
    description: 'Send SMS notifications for orders and updates',
    category: 'communication',
    defaultEnabled: false,
  },
  [FEATURE_FLAGS.PRODUCT_VARIANTS]: {
    name: 'Product Variants',
    description: 'Support for product variants (size, color, etc.)',
    category: 'product',
    defaultEnabled: false,
  },
  [FEATURE_FLAGS.WISHLIST]: {
    name: 'Wishlist',
    description: 'Allow customers to save products to wishlist',
    category: 'product',
    defaultEnabled: false,
  },
  [FEATURE_FLAGS.GIFT_CARDS]: {
    name: 'Gift Cards',
    description: 'Enable gift card functionality',
    category: 'commerce',
    defaultEnabled: false,
  },
  [FEATURE_FLAGS.LOYALTY_PROGRAM]: {
    name: 'Loyalty Program',
    description: 'Enable customer loyalty points and rewards',
    category: 'commerce',
    defaultEnabled: false,
  },
  [FEATURE_FLAGS.REPORTS]: {
    name: 'Reports',
    description: 'Generate detailed sales and inventory reports',
    category: 'analytics',
    defaultEnabled: true,
  },
  [FEATURE_FLAGS.PUSH_NOTIFICATIONS]: {
    name: 'Push Notifications',
    description: 'Send browser push notifications',
    category: 'communication',
    defaultEnabled: false,
  },
  [FEATURE_FLAGS.MULTI_CURRENCY]: {
    name: 'Multi-Currency',
    description: 'Support multiple currencies',
    category: 'advanced',
    defaultEnabled: false,
  },
  [FEATURE_FLAGS.MULTI_LANGUAGE]: {
    name: 'Multi-Language',
    description: 'Support multiple languages',
    category: 'advanced',
    defaultEnabled: false,
  },
  [FEATURE_FLAGS.INVENTORY_MANAGEMENT]: {
    name: 'Inventory Management',
    description: 'Advanced inventory tracking and management',
    category: 'advanced',
    defaultEnabled: true,
  },
  [FEATURE_FLAGS.ORDER_TRACKING]: {
    name: 'Order Tracking',
    description: 'Real-time order tracking for customers',
    category: 'advanced',
    defaultEnabled: true,
  },
  [FEATURE_FLAGS.ADVANCED_ADMIN]: {
    name: 'Advanced Admin',
    description: 'Advanced admin features and tools',
    category: 'admin',
    defaultEnabled: false,
  },
  [FEATURE_FLAGS.BULK_OPERATIONS]: {
    name: 'Bulk Operations',
    description: 'Perform bulk operations on products and orders',
    category: 'admin',
    defaultEnabled: false,
  },
  [FEATURE_FLAGS.EXPORT_DATA]: {
    name: 'Export Data',
    description: 'Export data to CSV, Excel, etc.',
    category: 'admin',
    defaultEnabled: true,
  },
};

/**
 * Get all feature flags
 */
export const getAllFeatures = () => {
  return Object.values(FEATURE_FLAGS);
};

/**
 * Get feature metadata
 */
export const getFeatureMetadata = (featureKey) => {
  return FEATURE_METADATA[featureKey] || null;
};

/**
 * Get features by category
 */
export const getFeaturesByCategory = (category) => {
  return Object.entries(FEATURE_METADATA)
    .filter(([_, metadata]) => metadata.category === category)
    .map(([key]) => key);
};




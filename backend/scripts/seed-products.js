import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../src/config/database.js';
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Categories to create
const categories = [
  {
    name: 'Running Shoes',
    slug: 'running-shoes',
    description: 'Premium running shoes for athletes and fitness enthusiasts',
    order: 1,
  },
  {
    name: 'Casual Sneakers',
    slug: 'casual-sneakers',
    description: 'Comfortable and stylish sneakers for everyday wear',
    order: 2,
  },
  {
    name: 'Basketball Shoes',
    slug: 'basketball-shoes',
    description: 'High-performance basketball shoes for the court',
    order: 3,
  },
  {
    name: 'Skate Shoes',
    slug: 'skate-shoes',
    description: 'Durable skate shoes designed for skateboarding',
    order: 4,
  },
];

// Sample shoe products data with category assignments
const sampleProducts = [
  {
    name: 'Nike Air Max 270 Premium Running Shoes',
    slug: 'nike-air-max-270-premium-running-shoes',
    description: 'Experience ultimate comfort with the Nike Air Max 270 Premium Running Shoes. Featuring advanced cushioning technology and a breathable mesh upper, these shoes are perfect for daily runs and workouts. The iconic Air Max unit provides maximum impact protection, while the durable rubber outsole ensures excellent traction on various surfaces.',
    shortDescription: 'Premium running shoes with advanced cushioning and breathable design.',
    price: 12999, // $129.99 in cents
    compareAtPrice: 15999, // $159.99 in cents
    stock: 45,
    sku: 'NIKE-AM270-BLK-001',
    weight: 0.8, // kg
    dimensions: {
      length: 30,
      width: 12,
      height: 10,
    },
    status: 'active',
    featured: true,
    categorySlug: 'running-shoes', // Assign to Running Shoes category
    tags: ['nike', 'running', 'sports', 'premium', 'air-max'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
        alt: 'Nike Air Max 270 Premium Running Shoes',
        isPrimary: true,
        order: 0,
      },
    ],
    ratings: {
      average: 4.5,
      count: 128,
      breakdown: { 5: 80, 4: 35, 3: 10, 2: 2, 1: 1 },
    },
  },
  {
    name: 'Adidas Ultraboost 22 Performance Sneakers',
    slug: 'adidas-ultraboost-22-performance-sneakers',
    description: 'Elevate your performance with the Adidas Ultraboost 22. These cutting-edge sneakers feature Primeknit upper for a sock-like fit and Boost midsole technology for exceptional energy return. Perfect for both training and casual wear, with a sleek modern design that stands out.',
    shortDescription: 'High-performance sneakers with Boost technology and Primeknit upper.',
    price: 17999, // $179.99 in cents
    compareAtPrice: 21999, // $219.99 in cents
    stock: 32,
    sku: 'ADIDAS-UB22-WHT-002',
    weight: 0.75,
    dimensions: {
      length: 29,
      width: 11,
      height: 9,
    },
    status: 'active',
    featured: true,
    categorySlug: 'running-shoes', // Assign to Running Shoes category
    tags: ['adidas', 'sneakers', 'performance', 'boost', 'training'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
        alt: 'Adidas Ultraboost 22 Performance Sneakers',
        isPrimary: true,
        order: 0,
      },
    ],
    ratings: {
      average: 4.7,
      count: 95,
      breakdown: { 5: 65, 4: 25, 3: 4, 2: 1, 1: 0 },
    },
  },
  {
    name: 'Puma RS-X3 Retro Running Shoes',
    slug: 'puma-rs-x3-retro-running-shoes',
    description: 'Step back in style with the Puma RS-X3 Retro Running Shoes. Combining retro aesthetics with modern comfort, these shoes feature a chunky design and superior cushioning. The bold colorways and premium materials make them a must-have for sneaker enthusiasts.',
    shortDescription: 'Retro-inspired running shoes with modern comfort and bold design.',
    price: 8999, // $89.99 in cents
    compareAtPrice: 11999, // $119.99 in cents
    stock: 58,
    sku: 'PUMA-RSX3-BLU-003',
    weight: 0.7,
    dimensions: {
      length: 28,
      width: 11,
      height: 9,
    },
    status: 'active',
    featured: false,
    categorySlug: 'casual-sneakers', // Assign to Casual Sneakers category
    tags: ['puma', 'retro', 'running', 'casual', 'chunky'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800',
        alt: 'Puma RS-X3 Retro Running Shoes',
        isPrimary: true,
        order: 0,
      },
    ],
    ratings: {
      average: 4.3,
      count: 67,
      breakdown: { 5: 40, 4: 20, 3: 5, 2: 2, 1: 0 },
    },
  },
  {
    name: 'New Balance 990v5 Classic Sneakers',
    slug: 'new-balance-990v5-classic-sneakers',
    description: 'The New Balance 990v5 represents the pinnacle of American craftsmanship. Made in the USA with premium materials, these classic sneakers offer unmatched comfort and durability. The ENCAP midsole provides superior support, making them ideal for all-day wear.',
    shortDescription: 'Classic American-made sneakers with premium materials and superior comfort.',
    price: 18499, // $184.99 in cents
    compareAtPrice: null,
    stock: 28,
    sku: 'NB-990V5-GRY-004',
    weight: 0.85,
    dimensions: {
      length: 30,
      width: 12,
      height: 10,
    },
    status: 'active',
    featured: true,
    categorySlug: 'casual-sneakers', // Assign to Casual Sneakers category
    tags: ['new-balance', 'classic', 'premium', 'made-in-usa', 'comfort'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
        alt: 'New Balance 990v5 Classic Sneakers',
        isPrimary: true,
        order: 0,
      },
    ],
    ratings: {
      average: 4.6,
      count: 142,
      breakdown: { 5: 95, 4: 35, 3: 10, 2: 2, 1: 0 },
    },
  },
  {
    name: 'Vans Old Skool Classic Skate Shoes',
    slug: 'vans-old-skool-classic-skate-shoes',
    description: 'The iconic Vans Old Skool is the original skate shoe. With its timeless design and durable construction, these shoes have been a favorite for decades. The signature side stripe and waffle outsole provide both style and function for skaters and casual wearers alike.',
    shortDescription: 'Iconic skate shoes with timeless design and durable construction.',
    price: 6499, // $64.99 in cents
    compareAtPrice: 7999, // $79.99 in cents
    stock: 72,
    sku: 'VANS-OS-BLK-005',
    weight: 0.6,
    dimensions: {
      length: 27,
      width: 10,
      height: 8,
    },
    status: 'active',
    featured: false,
    categorySlug: 'skate-shoes', // Assign to Skate Shoes category
    tags: ['vans', 'skate', 'classic', 'casual', 'iconic'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800',
        alt: 'Vans Old Skool Classic Skate Shoes',
        isPrimary: true,
        order: 0,
      },
    ],
    ratings: {
      average: 4.4,
      count: 203,
      breakdown: { 5: 130, 4: 60, 3: 10, 2: 3, 1: 0 },
    },
  },
  {
    name: 'Converse Chuck Taylor All Star High Tops',
    slug: 'converse-chuck-taylor-all-star-high-tops',
    description: 'The Converse Chuck Taylor All Star is the most recognized shoe in the world. These high-top classics feature a canvas upper, rubber toe cap, and iconic star ankle patch. Perfect for expressing your personal style, these timeless sneakers go with everything.',
    shortDescription: 'The world\'s most recognized high-top sneakers with timeless style.',
    price: 5499, // $54.99 in cents
    compareAtPrice: 6999, // $69.99 in cents
    stock: 89,
    sku: 'CONV-CT-HI-BLK-006',
    weight: 0.55,
    dimensions: {
      length: 28,
      width: 10,
      height: 12,
    },
    status: 'active',
    featured: false,
    categorySlug: 'casual-sneakers', // Assign to Casual Sneakers category
    tags: ['converse', 'classic', 'high-top', 'canvas', 'casual'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800',
        alt: 'Converse Chuck Taylor All Star High Tops',
        isPrimary: true,
        order: 0,
      },
    ],
    ratings: {
      average: 4.5,
      count: 312,
      breakdown: { 5: 200, 4: 90, 3: 18, 2: 3, 1: 1 },
    },
  },
  {
    name: 'Jordan 1 Retro High OG Basketball Shoes',
    slug: 'jordan-1-retro-high-og-basketball-shoes',
    description: 'The Air Jordan 1 Retro High OG brings back the legendary design that started it all. With premium leather construction, Nike Air cushioning, and the iconic Wings logo, these shoes are a must-have for any sneaker collection. Perfect for both on-court performance and street style.',
    shortDescription: 'Legendary basketball shoes with premium leather and iconic design.',
    price: 16999, // $169.99 in cents
    compareAtPrice: 19999, // $199.99 in cents
    stock: 15,
    sku: 'NIKE-AJ1-RED-007',
    weight: 0.9,
    dimensions: {
      length: 31,
      width: 12,
      height: 13,
    },
    status: 'active',
    featured: true,
    categorySlug: 'basketball-shoes', // Assign to Basketball Shoes category
    tags: ['jordan', 'basketball', 'retro', 'premium', 'collectible'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800',
        alt: 'Jordan 1 Retro High OG Basketball Shoes',
        isPrimary: true,
        order: 0,
      },
    ],
    ratings: {
      average: 4.8,
      count: 89,
      breakdown: { 5: 70, 4: 15, 3: 3, 2: 1, 1: 0 },
    },
  },
  {
    name: 'Reebok Classic Leather Casual Sneakers',
    slug: 'reebok-classic-leather-casual-sneakers',
    description: 'The Reebok Classic Leather is a timeless design that has remained popular for over 30 years. Made with premium leather upper and a comfortable EVA midsole, these sneakers offer classic style with modern comfort. Perfect for everyday wear and casual occasions.',
    shortDescription: 'Timeless leather sneakers with classic design and modern comfort.',
    price: 7499, // $74.99 in cents
    compareAtPrice: 9499, // $94.99 in cents
    stock: 41,
    sku: 'REEBOK-CL-WHT-008',
    weight: 0.65,
    dimensions: {
      length: 28,
      width: 11,
      height: 9,
    },
    status: 'active',
    featured: false,
    categorySlug: 'casual-sneakers', // Assign to Casual Sneakers category
    tags: ['reebok', 'leather', 'classic', 'casual', 'comfort'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1600185365483-26d7a4f03546?w=800',
        alt: 'Reebok Classic Leather Casual Sneakers',
        isPrimary: true,
        order: 0,
      },
    ],
    ratings: {
      average: 4.2,
      count: 156,
      breakdown: { 5: 90, 4: 50, 3: 12, 2: 3, 1: 1 },
    },
  },
  {
    name: 'ASICS Gel-Kayano 29 Running Shoes',
    slug: 'asics-gel-kayano-29-running-shoes',
    description: 'The ASICS Gel-Kayano 29 is engineered for maximum stability and support. Featuring GEL technology cushioning, FlyteFoam midsole, and a breathable mesh upper, these running shoes provide exceptional comfort for long-distance runners. Ideal for overpronators seeking premium support.',
    shortDescription: 'Premium stability running shoes with GEL technology and maximum support.',
    price: 15999, // $159.99 in cents
    compareAtPrice: 18999, // $189.99 in cents
    stock: 36,
    sku: 'ASICS-GK29-BLU-009',
    weight: 0.82,
    dimensions: {
      length: 30,
      width: 12,
      height: 10,
    },
    status: 'active',
    featured: true,
    categorySlug: 'running-shoes', // Assign to Running Shoes category
    tags: ['asics', 'running', 'stability', 'gel', 'support'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=800',
        alt: 'ASICS Gel-Kayano 29 Running Shoes',
        isPrimary: true,
        order: 0,
      },
    ],
    ratings: {
      average: 4.6,
      count: 178,
      breakdown: { 5: 120, 4: 45, 3: 10, 2: 2, 1: 1 },
    },
  },
  {
    name: 'Fila Disruptor II Platform Sneakers',
    slug: 'fila-disruptor-ii-platform-sneakers',
    description: 'Make a bold statement with the Fila Disruptor II Platform Sneakers. These chunky platform sneakers feature a retro-inspired design with modern comfort. The elevated sole and padded collar provide extra height and support, while the classic Fila branding adds authentic style.',
    shortDescription: 'Bold platform sneakers with retro design and modern comfort.',
    price: 6999, // $69.99 in cents
    compareAtPrice: 8999, // $89.99 in cents
    stock: 54,
    sku: 'FILA-DIS2-WHT-010',
    weight: 0.75,
    dimensions: {
      length: 29,
      width: 11,
      height: 11,
    },
    status: 'active',
    featured: false,
    categorySlug: 'casual-sneakers', // Assign to Casual Sneakers category
    tags: ['fila', 'platform', 'chunky', 'retro', 'bold'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800',
        alt: 'Fila Disruptor II Platform Sneakers',
        isPrimary: true,
        order: 0,
      },
    ],
    ratings: {
      average: 4.1,
      count: 94,
      breakdown: { 5: 55, 4: 28, 3: 8, 2: 2, 1: 1 },
    },
  },
];

async function seedProducts() {
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await connectDB();

    // Create or find categories
    console.log('\nCreating categories...');
    const categoryMap = {};
    
    for (const categoryData of categories) {
      let category = await Category.findOne({ slug: categoryData.slug });
      
      if (!category) {
        category = await Category.create({
          ...categoryData,
          status: 'active',
        });
        console.log(`✅ Created category: ${category.name}`);
      } else {
        console.log(`✅ Found category: ${category.name}`);
      }
      
      categoryMap[categoryData.slug] = category._id;
    }

    // Clear existing products (optional - comment out if you want to keep existing products)
    // await Product.deleteMany({});
    // console.log('Cleared existing products');

    // Insert products
    console.log(`\nInserting ${sampleProducts.length} products...`);
    const insertedProducts = [];

    for (const productData of sampleProducts) {
      // Check if product already exists
      const existingProduct = await Product.findOne({ slug: productData.slug });
      
      if (existingProduct) {
        // Update existing product's category
        const categoryId = categoryMap[productData.categorySlug];
        if (categoryId && existingProduct.category.toString() !== categoryId.toString()) {
          existingProduct.category = categoryId;
          await existingProduct.save();
          console.log(`🔄 Updated category for: ${productData.name}`);
        } else {
          console.log(`⏭️  Skipping ${productData.name} (already exists)`);
        }
        continue;
      }

      // Get category ID for this product
      const categoryId = categoryMap[productData.categorySlug];
      if (!categoryId) {
        console.error(`❌ Category not found for product: ${productData.name}`);
        continue;
      }

      // Remove categorySlug from productData before creating
      const { categorySlug, ...productDataWithoutCategory } = productData;

      const product = await Product.create({
        ...productDataWithoutCategory,
        category: categoryId,
      });

      insertedProducts.push(product);
      console.log(`✅ Created: ${product.name} - $${(product.price / 100).toFixed(2)} (${productData.categorySlug})`);
    }

    console.log(`\n🎉 Successfully seeded ${insertedProducts.length} products!`);
    console.log(`\nSummary:`);
    console.log(`- Total products in database: ${await Product.countDocuments()}`);
    console.log(`- Featured products: ${await Product.countDocuments({ featured: true })}`);
    console.log(`\nProducts by category:`);
    for (const [slug, categoryId] of Object.entries(categoryMap)) {
      const count = await Product.countDocuments({ category: categoryId });
      const categoryName = categories.find(c => c.slug === slug)?.name || slug;
      console.log(`  - ${categoryName}: ${count} products`);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed function
seedProducts();


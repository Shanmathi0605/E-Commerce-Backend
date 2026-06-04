const mongoose = require('mongoose');
const Category = require('./models/category');
const Product = require('./models/product');

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_product';

const seed = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing Categories and Products.');

    // 1. Create Categories
    const categoriesData = [
      { name: 'Indoor Plants', slug: 'indoor-plants' },
      { name: 'Outdoor Plants', slug: 'outdoor-plants' },
      { name: 'Desk Plants', slug: 'desk-plants' },
      { name: 'Succulents', slug: 'succulents' },
      { name: 'Bonsai', slug: 'bonsai' }
    ];

    const categoriesMap = {};
    for (const catData of categoriesData) {
      const category = new Category(catData);
      await category.save();
      categoriesMap[catData.slug] = category._id;
      console.log(`Created Category: ${catData.name}`);
    }

    // 2. Create Products
    const productsData = [
      {
        vendorId: 'vendor_123',
        title: 'Calathea Plant',
        description: 'Stunning Calathea plant with beautiful green-patterned leaves, perfect for indoor decoration.',
        price: 309.00,
        category: categoriesMap['indoor-plants'],
        brand: 'GreenLife',
        images: ['https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=400'],
        averageRating: 4.8,
        numReviews: 42,
        status: 'active'
      },
      {
        vendorId: 'vendor_123',
        title: 'Desk Plant (Monstera)',
        description: 'Compact Monstera Deliciosa desk plant, easy to grow and adds an instant tropical feel.',
        price: 359.00,
        category: categoriesMap['desk-plants'],
        brand: 'Planto',
        images: ['https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&q=80&w=400'],
        averageRating: 4.9,
        numReviews: 28,
        status: 'active'
      },
      {
        vendorId: 'vendor_123',
        title: 'Calathea AI Plant',
        description: 'Popular indoor Calathea variety with contrasting silver and purple undersides.',
        price: 399.00,
        category: categoriesMap['indoor-plants'],
        brand: 'GreenLife',
        images: ['https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=400'],
        averageRating: 4.7,
        numReviews: 19,
        status: 'active'
      },
      {
        vendorId: 'vendor_123',
        title: 'Cal 874 Plant (Cactus)',
        description: 'Vibrant desert cactus placed in a decorative terracotta pot, requires minimal watering.',
        price: 259.00,
        category: categoriesMap['succulents'],
        brand: 'Succulents Co.',
        images: ['https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&q=80&w=400'],
        averageRating: 4.6,
        numReviews: 31,
        status: 'active'
      },
      {
        vendorId: 'vendor_123',
        title: 'Show Plant (Palm)',
        description: 'Majestic parlor palm show plant with long feathery fronds, thrives in medium indirect light.',
        price: 759.00,
        category: categoriesMap['indoor-plants'],
        brand: 'Planto',
        images: ['https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=400'],
        averageRating: 4.9,
        numReviews: 53,
        status: 'active'
      },
      {
        vendorId: 'vendor_123',
        title: 'Calat 02 Plant',
        description: 'Rich dark green leafy plant, broad foliage designed for air purification.',
        price: 659.00,
        category: categoriesMap['indoor-plants'],
        brand: 'Planto',
        images: ['https://images.unsplash.com/photo-1512428813824-f111357b1c30?auto=format&fit=crop&q=80&w=400'],
        averageRating: 4.7,
        numReviews: 26,
        status: 'active'
      },
      {
        vendorId: 'vendor_123',
        title: 'Fiddle Leaf Fig',
        description: 'Premium Fiddle Leaf Fig tree in a ceramic pot, a beautiful statement piece for any home.',
        price: 599.00,
        category: categoriesMap['indoor-plants'],
        brand: 'GreenLife',
        images: ['https://images.unsplash.com/photo-1597055181300-e3633a207518?auto=format&fit=crop&q=80&w=400'],
        averageRating: 4.9,
        numReviews: 67,
        status: 'active'
      },
      {
        vendorId: 'vendor_123',
        title: 'Zebra Plant',
        description: 'Desk zebra plant with striking white zebra-like leaf ridges and details.',
        price: 150.00,
        category: categoriesMap['desk-plants'],
        brand: 'Planto',
        images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400'],
        averageRating: 4.5,
        numReviews: 12,
        status: 'active'
      },
      {
        vendorId: 'vendor_123',
        title: 'Aloe Vera Cactus',
        description: 'Medicinal aloe vera plant in a white cup pot, perfect for desks or window sills.',
        price: 120.00,
        category: categoriesMap['succulents'],
        brand: 'Succulents Co.',
        images: ['https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&q=80&w=400'],
        averageRating: 4.6,
        numReviews: 18,
        status: 'active'
      },
      {
        vendorId: 'vendor_123',
        title: 'Peace Lily',
        description: 'Beautiful white blooming peace lily, excellent for indoor purification and low light settings.',
        price: 350.00,
        category: categoriesMap['indoor-plants'],
        brand: 'GreenLife',
        images: ['https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=400'],
        averageRating: 4.8,
        numReviews: 29,
        status: 'active'
      },
      {
        vendorId: 'vendor_123',
        title: 'Jade Plant',
        description: 'Compact money jade plant, symbol of good luck and easy care.',
        price: 190.00,
        category: categoriesMap['desk-plants'],
        brand: 'Planto',
        images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400'],
        averageRating: 4.7,
        numReviews: 22,
        status: 'active'
      },
      {
        vendorId: 'vendor_123',
        title: 'Bonsai Juniper Tree',
        description: 'Artistically styled classic Japanese Juniper bonsai tree on a ceramic plate.',
        price: 999.00,
        category: categoriesMap['bonsai'],
        brand: 'Bonsai Masters',
        images: ['https://images.unsplash.com/photo-1512428813824-f111357b1c30?auto=format&fit=crop&q=80&w=400'],
        averageRating: 4.9,
        numReviews: 14,
        status: 'active'
      }
    ];

    for (const prodData of productsData) {
      const product = new Product(prodData);
      await product.save();
      console.log(`Created Product: ${prodData.title}`);
    }

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

seed();

const Category = require('../models/category');
const Product = require('../models/product');
const { BadRequestError, NotFoundError } = require('@ecommerce/common');
const { redisClient } = require('../config/redis');
const { esClient } = require('../config/elasticsearch');
const {
  productCreatedPublisher,
  productUpdatedPublisher,
  productDeletedPublisher
} = require('../events/publishers');

// --- CATEGORIES ---

// Create Category (Admin only)
const createCategory = async (req, res) => {
  const { name, parentCategory } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const existingCategory = await Category.findOne({ slug });
  if (existingCategory) {
    throw new BadRequestError('Category already exists');
  }

  const category = new Category({
    name,
    slug,
    parentCategory: parentCategory || null
  });

  await category.save();

  // Invalidate Redis categories cache
  try {
    await redisClient.del('categories:all');
  } catch (err) {
    console.error('[Redis] Failed to delete cache key', err.message);
  }

  res.status(201).send(category);
};

// Retrieve all categories (Cached in Redis)
const getCategories = async (req, res) => {
  try {
    const cached = await redisClient.get('categories:all');
    if (cached) {
      console.log('[Redis] Serving categories from cache');
      return res.status(200).send(JSON.parse(cached));
    }
  } catch (err) {
    console.error('[Redis] Get cache error', err.message);
  }

  const categories = await Category.find({}).populate('parentCategory');

  try {
    // Cache for 24 hours
    await redisClient.setEx('categories:all', 24 * 60 * 60, JSON.stringify(categories));
  } catch (err) {
    console.error('[Redis] Set cache error', err.message);
  }

  res.status(200).send(categories);
};


// --- PRODUCTS ---

// Create Product (Vendor only)
const createProduct = async (req, res) => {
  const { title, description, price, category, brand, variants } = req.body;

  // Verify category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new BadRequestError('Invalid Category ID');
  }

  // Parse variants if passed as string (from multipart form-data)
  let parsedVariants = [];
  if (variants) {
    parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
  }

  // Images upload paths
  const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

  const product = new Product({
    vendorId: req.currentUser.id,
    title,
    description,
    price: Number(price),
    category,
    brand,
    images,
    variants: parsedVariants,
    status: 'pending_approval' // requires Admin approval
  });

  await product.save();

  // Publish event (to notify inventory, but does not index to ES until approved)
  await productCreatedPublisher.publish({
    id: product._id,
    vendorId: product.vendorId,
    title: product.title,
    description: product.description,
    price: product.price,
    category: product.category,
    brand: product.brand,
    images: product.images,
    variants: product.variants,
    status: product.status
  });

  res.status(201).send(product);
};

// Update Product (Vendor only)
const updateProduct = async (req, res) => {
  const { productId } = req.params;
  const { title, description, price, category, brand, variants } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError();
  }

  if (product.vendorId !== req.currentUser.id) {
    throw new BadRequestError('Unauthorized to update this product');
  }

  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      throw new BadRequestError('Invalid Category ID');
    }
    product.category = category;
  }

  if (title) product.title = title;
  if (description) product.description = description;
  if (price) product.price = Number(price);
  if (brand) product.brand = brand;
  
  if (variants) {
    product.variants = typeof variants === 'string' ? JSON.parse(variants) : variants;
  }

  if (req.files && req.files.length > 0) {
    product.images = req.files.map(file => `/uploads/${file.filename}`);
  }

  await product.save();

  // Invalidate Redis product cache
  try {
    await redisClient.del(`product:${product._id}`);
  } catch (err) {
    console.error('[Redis] Cache invalidation failed', err.message);
  }

  // Publish updated event
  await productUpdatedPublisher.publish({
    id: product._id,
    vendorId: product.vendorId,
    title: product.title,
    description: product.description,
    price: product.price,
    category: product.category,
    brand: product.brand,
    images: product.images,
    variants: product.variants,
    status: product.status
  });

  res.status(200).send(product);
};

// Delete Product (Vendor only)
const deleteProduct = async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError();
  }

  if (product.vendorId !== req.currentUser.id && req.currentUser.role !== 'admin') {
    throw new BadRequestError('Unauthorized to delete this product');
  }

  product.status = 'rejected'; // Soft delete
  await product.save();

  // Invalidate Redis cache
  try {
    await redisClient.del(`product:${productId}`);
  } catch (err) {
    console.error('[Redis] Cache deletion failed', err.message);
  }

  // Publish deleted event to sync ES index
  await productDeletedPublisher.publish({
    id: productId
  });

  res.status(200).send({ message: 'Product removed successfully' });
};

// [Admin] Approve Product
const adminApproveProduct = async (req, res) => {
  const { productId } = req.params;
  const { status } = req.body; // active, rejected, suspended

  if (!['active', 'rejected', 'suspended'].includes(status)) {
    throw new BadRequestError('Invalid approval status');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError();
  }

  product.status = status;
  await product.save();

  // If approved (active), sync it to Elasticsearch index
  await productUpdatedPublisher.publish({
    id: product._id,
    vendorId: product.vendorId,
    title: product.title,
    description: product.description,
    price: product.price,
    category: product.category,
    brand: product.brand,
    images: product.images,
    variants: product.variants,
    status: product.status
  });

  res.status(200).send(product);
};

// Retrieve single product details (Cached in Redis)
const getProductDetails = async (req, res) => {
  const { productId } = req.params;

  try {
    const cached = await redisClient.get(`product:${productId}`);
    if (cached) {
      console.log('[Redis] Serving product details from cache');
      return res.status(200).send(JSON.parse(cached));
    }
  } catch (err) {
    console.error('[Redis] Get product cache error', err.message);
  }

  const product = await Product.findById(productId).populate('category');
  if (!product) {
    throw new NotFoundError();
  }

  try {
    // Cache single product details for 1 hour
    await redisClient.setEx(`product:${productId}`, 3600, JSON.stringify(product));
  } catch (err) {
    console.error('[Redis] Set product cache error', err.message);
  }

  res.status(200).send(product);
};

// Retrieve multiple products (filtering by vendor/status)
const getProducts = async (req, res) => {
  const { vendorId, status } = req.query;
  const filter = {};
  
  if (vendorId) filter.vendorId = vendorId;
  if (status) {
    if (status !== 'all') {
      filter.status = status;
    }
  } else {
    filter.status = 'active'; // Public shows active only
  }

  const products = await Product.find(filter).populate('category');
  res.status(200).send(products);
};

// Elasticsearch Query Search
const searchProducts = async (req, res) => {
  const { q, category, brand, minPrice, maxPrice, rating, inStock, sort } = req.query;

  try {
    // Build ES search queries
    const query = {
      bool: {
        must: [
          { term: { status: 'active' } }
        ],
        filter: []
      }
    };

    // Text search query
    if (q) {
      query.bool.must.push({
        multi_match: {
          query: q,
          fields: ['title^3', 'description', 'brand^2'],
          fuzziness: 'AUTO'
        }
      });
    } else {
      query.bool.must.push({ match_all: {} });
    }

    // Category filter
    if (category) {
      query.bool.filter.push({ term: { category } });
    }

    // Brand filter
    if (brand) {
      query.bool.filter.push({ term: { brand } });
    }

    // Price filter
    if (minPrice || maxPrice) {
      const priceRange = { range: { price: {} } };
      if (minPrice) priceRange.range.price.gte = parseFloat(minPrice);
      if (maxPrice) priceRange.range.price.lte = parseFloat(maxPrice);
      query.bool.filter.push(priceRange);
    }

    // Rating filter
    if (rating) {
      query.bool.filter.push({ range: { averageRating: { gte: parseFloat(rating) } } });
    }

    // Sort mappings
    let sortOptions = [];
    if (sort === 'newest') {
      sortOptions.push({ createdAt: { order: 'desc' } });
    } else if (sort === 'priceLowToHigh') {
      sortOptions.push({ price: { order: 'asc' } });
    } else if (sort === 'priceHighToLow') {
      sortOptions.push({ price: { order: 'desc' } });
    } else if (sort === 'rating') {
      sortOptions.push({ averageRating: { order: 'desc' } });
    }

    const response = await esClient.search({
      index: 'products',
      body: {
        query,
        sort: sortOptions
      }
    });

    const products = response.hits.hits.map(hit => hit._source);
    res.status(200).send(products);

  } catch (err) {
    console.warn('[ES Search] ES Query failed, falling back to database query.', err.message);

    // Fallback: Mongoose Database query
    const dbFilter = { status: 'active' };
    if (q) {
      dbFilter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } }
      ];
    }
    if (category) dbFilter.category = category;
    if (brand) dbFilter.brand = brand;
    if (minPrice || maxPrice) {
      dbFilter.price = {};
      if (minPrice) dbFilter.price.$gte = parseFloat(minPrice);
      if (maxPrice) dbFilter.price.$lte = parseFloat(maxPrice);
    }
    if (rating) dbFilter.averageRating = { $gte: parseFloat(rating) };

    let dbSort = {};
    if (sort === 'newest') dbSort.createdAt = -1;
    else if (sort === 'priceLowToHigh') dbSort.price = 1;
    else if (sort === 'priceHighToLow') dbSort.price = -1;
    else if (sort === 'rating') dbSort.averageRating = -1;

    const products = await Product.find(dbFilter).sort(dbSort).populate('category');
    res.status(200).send(products);
  }
};

module.exports = {
  createCategory,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  adminApproveProduct,
  getProductDetails,
  getProducts,
  searchProducts
};

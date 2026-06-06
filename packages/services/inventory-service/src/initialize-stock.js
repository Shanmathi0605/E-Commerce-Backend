const mongoose = require('mongoose');

// Define temporary schemas for the migration
const ProductSchema = new mongoose.Schema({
  title: String,
  variants: [
    {
      _id: mongoose.Schema.Types.ObjectId,
      size: String,
      color: String,
      price: Number,
      stock: Number
    }
  ]
});

const InventorySchema = new mongoose.Schema({
  productId: String,
  variantId: String,
  stock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  reservations: [
    {
      orderId: String,
      quantity: Number,
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

const run = async () => {
  try {
    // 1. Connect to ecommerce_product database to read products
    console.log('Connecting to Product DB: mongodb://127.0.0.1:27017/ecommerce_product');
    const productConn = await mongoose.createConnection('mongodb://127.0.0.1:27017/ecommerce_product').asPromise();
    const ProductModel = productConn.model('Product', ProductSchema);
    
    const products = await ProductModel.find({});
    console.log(`Found ${products.length} products in Product DB.`);
    await productConn.close();

    // 2. Connect to ecommerce_inventory database to write stock records
    console.log('Connecting to Inventory DB: mongodb://127.0.0.1:27017/ecommerce_inventory');
    const inventoryConn = await mongoose.createConnection('mongodb://127.0.0.1:27017/ecommerce_inventory').asPromise();
    const InventoryModel = inventoryConn.model('Inventory', InventorySchema);

    let createdCount = 0;
    for (const prod of products) {
      if (prod.variants && prod.variants.length > 0) {
        for (const variant of prod.variants) {
          const variantId = variant._id.toString();
          const exists = await InventoryModel.findOne({ productId: prod._id.toString(), variantId });
          if (!exists) {
            const inv = new InventoryModel({
              productId: prod._id.toString(),
              variantId,
              stock: variant.stock !== undefined ? Number(variant.stock) : 100
            });
            await inv.save();
            createdCount++;
          }
        }
      } else {
        const exists = await InventoryModel.findOne({ productId: prod._id.toString(), variantId: '' });
        if (!exists) {
          const inv = new InventoryModel({
            productId: prod._id.toString(),
            variantId: '',
            stock: 100 // default 100 stock
          });
          await inv.save();
          createdCount++;
        }
      }
    }

    console.log(`Migration complete! Initialized ${createdCount} stock records in Inventory DB.`);
    await inventoryConn.close();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

run();

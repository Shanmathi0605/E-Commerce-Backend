const express = require('express');
require('express-async-errors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { startConsumers } = require('./events/consumers');
const inventoryRoutes = require('./routes/inventory-routes');
const { errorHandler } = require('@ecommerce/common');

const app = express();

app.use(express.json());
app.use(cookieParser());

const Inventory = require('./models/inventory');

// Mount inventory REST API endpoints for internal service fallback (bypass auth)
app.post('/api/inventory/reserve', async (req, res) => {
  const { id: orderId, items } = req.body;
  console.log(`[Inventory REST API] Reserving stock for Order: ${orderId}`);

  let isStockAvailable = true;
  const reservedItems = [];

  for (const item of items) {
    const query = { productId: item.productId, variantId: item.variantId || '' };
    const inv = await Inventory.findOne(query);

    if (!inv || inv.stock < item.quantity) {
      console.warn(`[Inventory REST API] Insufficient stock for ${item.productId}. Required: ${item.quantity}, Current: ${inv ? inv.stock : 0}`);
      isStockAvailable = false;
      break;
    }
    reservedItems.push({ inv, item });
  }

  if (isStockAvailable) {
    for (const { inv, item } of reservedItems) {
      inv.stock -= item.quantity;
      inv.reservations.push({
        orderId,
        quantity: item.quantity
      });
      await inv.save();

      // Check low stock
      if (inv.stock <= inv.lowStockThreshold) {
        try {
          const { lowStockAlertPublisher } = require('./events/publishers');
          await lowStockAlertPublisher.publish({
            productId: inv.productId,
            variantId: inv.variantId,
            currentStock: inv.stock
          });
        } catch (err) {
          console.error('[Inventory REST API] Failed to publish low stock alert to Kafka:', err.message);
        }
      }

      // Publish general stock update
      try {
        const { inventoryUpdatedPublisher } = require('./events/publishers');
        await inventoryUpdatedPublisher.publish({
          productId: inv.productId,
          variantId: inv.variantId,
          stock: inv.stock
        });
      } catch (err) {
        console.error('[Inventory REST API] Failed to publish stock update to Kafka:', err.message);
      }
    }
    console.log(`[Inventory REST API] Stock reserved successfully for Order: ${orderId}`);
    return res.status(200).send({ success: true, message: 'Stock reserved successfully' });
  } else {
    console.error(`[Inventory REST API] Stock reservation failed for Order: ${orderId}`);
    return res.status(400).send({ success: false, message: 'Insufficient stock' });
  }
});

app.post('/api/inventory/release', async (req, res) => {
  const { id: orderId, items } = req.body;
  console.log(`[Inventory REST API] Releasing stock for Order: ${orderId}`);

  for (const item of items) {
    const query = { productId: item.productId, variantId: item.variantId || '' };
    const inv = await Inventory.findOne(query);

    if (inv) {
      const reservationIndex = inv.reservations.findIndex(r => r.orderId === orderId);
      if (reservationIndex !== -1) {
        const qty = inv.reservations[reservationIndex].quantity;
        inv.reservations.splice(reservationIndex, 1);
        inv.stock += qty;
        await inv.save();

        try {
          const { inventoryUpdatedPublisher } = require('./events/publishers');
          await inventoryUpdatedPublisher.publish({
            productId: inv.productId,
            variantId: inv.variantId,
            stock: inv.stock
          });
        } catch (err) {
          console.error('[Inventory REST API] Failed to publish stock update to Kafka:', err.message);
        }
      }
    }
  }
  return res.status(200).send({ success: true, message: 'Stock released successfully' });
});

// REST endpoint to get stock details publicly (unauthenticated)
app.get('/api/inventory/public/:productId', async (req, res) => {
  const { productId } = req.params;
  const { variantId } = req.query;

  try {
    if (variantId !== undefined) {
      const query = { productId, variantId: variantId || '' };
      const inv = await Inventory.findOne(query);
      return res.status(200).send({ stock: inv ? inv.stock : 0 });
    } else {
      const records = await Inventory.find({ productId });
      return res.status(200).send(records);
    }
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
});

// REST endpoint to initialize stock for a newly created product (unauthenticated, internal service fallback)
app.post('/api/inventory/product-created', async (req, res) => {
  const { id, variants } = req.body;
  console.log(`[Inventory REST API] Initializing stock records for product: ${id}`);

  try {
    if (variants && variants.length > 0) {
      for (const variant of variants) {
        const variantId = variant._id ? variant._id.toString() : '';
        const exists = await Inventory.findOne({ productId: id, variantId });
        if (!exists) {
          const inv = new Inventory({
            productId: id,
            variantId,
            stock: variant.stock || 0
          });
          await inv.save();
        }
      }
    } else {
      const exists = await Inventory.findOne({ productId: id, variantId: '' });
      if (!exists) {
        const inv = new Inventory({
          productId: id,
          variantId: '',
          stock: 100 // default mock stock for testing
        });
        await inv.save();
      }
    }
    return res.status(201).send({ success: true, message: 'Stock records initialized' });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
});

// Mount inventory routes
app.use('/api/inventory', inventoryRoutes);

// Error handler
app.use(errorHandler);

const start = async () => {
  // Connect to Database
  await connectDB();

  // Start Kafka Event listeners
  startConsumers(); // Non-blocking: runs in background, app starts regardless of Kafka status

  const PORT = process.env.PORT || 8005;
  app.listen(PORT, () => {
    console.log(`[Inventory Service] Listening on port ${PORT}`);
  });
};

start();

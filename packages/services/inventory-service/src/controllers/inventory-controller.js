const Inventory = require('../models/inventory');
const { BadRequestError, NotFoundError } = require('@ecommerce/common');
const { inventoryUpdatedPublisher } = require('../events/publishers');

// Retrieve stock level for a product variant
const getStock = async (req, res) => {
  const { productId } = req.params;
  const { variantId } = req.query;

  const query = { productId, variantId: variantId || '' };
  const inv = await Inventory.findOne(query);

  if (!inv) {
    throw new NotFoundError();
  }

  res.status(200).send(inv);
};

// Manually replenish/adjust stock (Vendor/Admin only)
const updateStock = async (req, res) => {
  const { productId } = req.params;
  const { variantId, stock, lowStockThreshold } = req.body;

  if (stock === undefined || stock < 0) {
    throw new BadRequestError('Valid stock quantity is required');
  }

  const query = { productId, variantId: variantId || '' };
  let inv = await Inventory.findOne(query);

  if (!inv) {
    inv = new Inventory({
      productId,
      variantId: variantId || '',
      stock
    });
  } else {
    inv.stock = Number(stock);
  }

  if (lowStockThreshold !== undefined) {
    inv.lowStockThreshold = Number(lowStockThreshold);
  }

  await inv.save();

  // Publish event
  await inventoryUpdatedPublisher.publish({
    productId: inv.productId,
    variantId: inv.variantId,
    stock: inv.stock
  });

  res.status(200).send(inv);
};

// Retrieve list of low-stock alerts
const getLowStockAlerts = async (req, res) => {
  const alerts = await Inventory.find({
    $expr: { $lte: ['$stock', '$lowStockThreshold'] }
  });
  res.status(200).send(alerts);
};

module.exports = {
  getStock,
  updateStock,
  getLowStockAlerts
};

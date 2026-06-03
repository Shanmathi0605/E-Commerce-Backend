const { BaseConsumer, Topics } = require('@ecommerce/common');
const Inventory = require('../models/inventory');
const kafka = require('../config/kafka');
const { inventoryUpdatedPublisher, lowStockAlertPublisher } = require('./publishers');

class ProductCreatedConsumer extends BaseConsumer {
  get topic() {
    return Topics.PRODUCT_CREATED;
  }
  get groupId() {
    return 'inventory-product-created-group';
  }
}

class OrderCreatedConsumer extends BaseConsumer {
  get topic() {
    return Topics.ORDER_CREATED;
  }
  get groupId() {
    return 'inventory-order-created-group';
  }
}

class OrderCancelledConsumer extends BaseConsumer {
  get topic() {
    return Topics.ORDER_CANCELLED;
  }
  get groupId() {
    return 'inventory-order-cancelled-group';
  }
}

class PaymentFailedConsumer extends BaseConsumer {
  get topic() {
    return Topics.PAYMENT_FAILED;
  }
  get groupId() {
    return 'inventory-payment-failed-group';
  }
}

const startConsumers = async () => {
  const productConsumer = new ProductCreatedConsumer(kafka);
  const orderCreatedConsumer = new OrderCreatedConsumer(kafka);
  const orderCancelledConsumer = new OrderCancelledConsumer(kafka);
  const paymentFailedConsumer = new PaymentFailedConsumer(kafka);

  try {
    // 1. Initialize stock on product creation
    await productConsumer.listen(async (data) => {
      const { id, variants } = data;
      console.log(`[Inventory Service] Initializing stock records for product: ${id}`);

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
            stock: 100 // default mock stock for testing if none given
          });
          await inv.save();
        }
      }
    });

    // 2. Reserve stock on order creation
    await orderCreatedConsumer.listen(async (data) => {
      const { id: orderId, items } = data;
      console.log(`[Inventory Service] Reserving stock for Order: ${orderId}`);

      let isStockAvailable = true;
      const reservedItems = [];

      for (const item of items) {
        const query = { productId: item.productId, variantId: item.variantId || '' };
        const inv = await Inventory.findOne(query);

        if (!inv || inv.stock < item.quantity) {
          console.warn(`[Inventory Service] Insufficient stock for ${item.productId}. Required: ${item.quantity}, Current: ${inv ? inv.stock : 0}`);
          isStockAvailable = false;
          break;
        }
        reservedItems.push({ inv, item });
      }

      if (isStockAvailable) {
        // Commit reservations
        for (const { inv, item } of reservedItems) {
          inv.stock -= item.quantity;
          inv.reservations.push({
            orderId,
            quantity: item.quantity
          });
          await inv.save();

          // Check low stock
          if (inv.stock <= inv.lowStockThreshold) {
            await lowStockAlertPublisher.publish({
              productId: inv.productId,
              variantId: inv.variantId,
              currentStock: inv.stock
            });
          }

          // Publish general stock update
          await inventoryUpdatedPublisher.publish({
            productId: inv.productId,
            variantId: inv.variantId,
            stock: inv.stock
          });
        }
        console.log(`[Inventory Service] Stock reserved successfully for Order: ${orderId}`);
      } else {
        // If stock is not available, we can trigger order rejection or payment failures
        console.error(`[Inventory Service] Stock reservation failed for Order: ${orderId}`);
      }
    });

    // 3. Release stock on cancellation
    const releaseStock = async (data) => {
      const { id: orderId, items } = data;
      console.log(`[Inventory Service] Releasing stock for Order: ${orderId}`);

      for (const item of items) {
        const query = { productId: item.productId, variantId: item.variantId || '' };
        const inv = await Inventory.findOne(query);

        if (inv) {
          // Find and pull the reservation
          const reservationIndex = inv.reservations.findIndex(res => res.orderId === orderId);
          if (reservationIndex !== -1) {
            const qty = inv.reservations[reservationIndex].quantity;
            inv.reservations.splice(reservationIndex, 1);
            inv.stock += qty; // refund the reserved items
            await inv.save();

            await inventoryUpdatedPublisher.publish({
              productId: inv.productId,
              variantId: inv.variantId,
              stock: inv.stock
            });
          }
        }
      }
    };

    await orderCancelledConsumer.listen(releaseStock);
    await paymentFailedConsumer.listen(releaseStock);

  } catch (err) {
    console.error('[Inventory Service Consumers] Kafka consumer setup failure:', err);
  }
};

module.exports = { startConsumers };

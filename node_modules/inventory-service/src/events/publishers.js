const { BasePublisher, Topics } = require('@ecommerce/common');
const kafka = require('../config/kafka');

class InventoryUpdatedPublisher extends BasePublisher {
  get topic() {
    return Topics.INVENTORY_UPDATED;
  }
}

class LowStockAlertPublisher extends BasePublisher {
  get topic() {
    return Topics.LOW_STOCK_ALERT;
  }
}

module.exports = {
  inventoryUpdatedPublisher: new InventoryUpdatedPublisher(kafka),
  lowStockAlertPublisher: new LowStockAlertPublisher(kafka)
};

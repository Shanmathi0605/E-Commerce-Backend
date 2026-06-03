const { BasePublisher, Topics } = require('@ecommerce/common');
const kafka = require('../config/kafka');

class ProductUpdatedPublisher extends BasePublisher {
  get topic() {
    return Topics.PRODUCT_UPDATED;
  }
}

module.exports = {
  productUpdatedPublisher: new ProductUpdatedPublisher(kafka)
};

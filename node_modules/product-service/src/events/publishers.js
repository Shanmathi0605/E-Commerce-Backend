const { BasePublisher, Topics } = require('@ecommerce/common');
const kafka = require('../config/kafka');

class ProductCreatedPublisher extends BasePublisher {
  get topic() {
    return Topics.PRODUCT_CREATED;
  }
}

class ProductUpdatedPublisher extends BasePublisher {
  get topic() {
    return Topics.PRODUCT_UPDATED;
  }
}

class ProductDeletedPublisher extends BasePublisher {
  get topic() {
    return Topics.PRODUCT_DELETED;
  }
}

module.exports = {
  productCreatedPublisher: new ProductCreatedPublisher(kafka),
  productUpdatedPublisher: new ProductUpdatedPublisher(kafka),
  productDeletedPublisher: new ProductDeletedPublisher(kafka)
};

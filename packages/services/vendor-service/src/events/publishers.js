const { BasePublisher, Topics } = require('@ecommerce/common');
const kafka = require('../config/kafka');

class VendorRegisteredPublisher extends BasePublisher {
  get topic() {
    return Topics.VENDOR_REGISTERED;
  }
}

class VendorApprovedPublisher extends BasePublisher {
  get topic() {
    return Topics.VENDOR_APPROVED;
  }
}

module.exports = {
  vendorRegisteredPublisher: new VendorRegisteredPublisher(kafka),
  vendorApprovedPublisher: new VendorApprovedPublisher(kafka)
};

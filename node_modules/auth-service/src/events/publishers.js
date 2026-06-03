const { BasePublisher, Topics } = require('@ecommerce/common');
const kafka = require('../config/kafka');

class EmailVerifyPublisher extends BasePublisher {
  get topic() {
    return Topics.EMAIL_VERIFY;
  }
}

class UserRegisteredPublisher extends BasePublisher {
  get topic() {
    return Topics.USER_REGISTERED;
  }
}

module.exports = {
  emailVerifyPublisher: new EmailVerifyPublisher(kafka),
  userRegisteredPublisher: new UserRegisteredPublisher(kafka)
};

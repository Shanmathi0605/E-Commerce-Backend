const { BaseConsumer, Topics } = require('@ecommerce/common');
const UserProfile = require('../models/user-profile');
const Wallet = require('../models/wallet');
const Referral = require('../models/referral');
const kafka = require('../config/kafka');

class UserRegisteredConsumer extends BaseConsumer {
  get topic() {
    return Topics.USER_REGISTERED;
  }

  get groupId() {
    return 'user-service-registration-group';
  }
}

const userRegisteredConsumer = new UserRegisteredConsumer(kafka);

const startConsumers = async () => {
  try {
    await userRegisteredConsumer.listen(async (data) => {
      const { id, email } = data;
      console.log(`[User Service Consumer] Provisioning setup for userId: ${id}, email: ${email}`);

      // 1. Create Profile if not exists
      const profileExists = await UserProfile.findOne({ userId: id });
      if (!profileExists) {
        const profile = new UserProfile({ userId: id, email });
        await profile.save();
        console.log(`[User Service] Profile created for user: ${email}`);
      }

      // 2. Create Wallet if not exists
      const walletExists = await Wallet.findOne({ userId: id });
      if (!walletExists) {
        const wallet = new Wallet({ userId: id, balance: 0 });
        await wallet.save();
        console.log(`[User Service] Wallet created for user: ${email}`);
      }

      // 3. Create Referral mapping if not exists
      const referralExists = await Referral.findOne({ userId: id });
      if (!referralExists) {
        const code = 'REF-' + id.substring(id.length - 6).toUpperCase();
        const referral = new Referral({
          userId: id,
          referralCode: code
        });
        await referral.save();
        console.log(`[User Service] Referral code generated: ${code}`);
      }
    });
  } catch (err) {
    console.error('[User Service Consumers] Failed to start consumer:', err);
  }
};

module.exports = { startConsumers };

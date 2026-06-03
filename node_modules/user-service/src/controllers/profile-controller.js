const UserProfile = require('../models/user-profile');
const { BadRequestError, NotFoundError } = require('@ecommerce/common');

const getOrCreateProfile = async (currentUser) => {
  let profile = await UserProfile.findOne({ userId: currentUser.id });
  if (!profile) {
    profile = new UserProfile({ userId: currentUser.id, email: currentUser.email });
    await profile.save();
  }
  return profile;
};

// Get current user profile
const getProfile = async (req, res) => {
  const profile = await getOrCreateProfile(req.currentUser);
  res.status(200).send(profile);
};

// Update name and phone
const updateProfile = async (req, res) => {
  const { name, phone } = req.body;
  const profile = await getOrCreateProfile(req.currentUser);

  if (name !== undefined) profile.name = name;
  if (phone !== undefined) profile.phone = phone;

  await profile.save();
  res.status(200).send(profile);
};

// Add new shipping/billing address
const addAddress = async (req, res) => {
  const { name, phone, street, city, state, zipCode, country, isDefault } = req.body;
  const profile = await getOrCreateProfile(req.currentUser);

  if (isDefault) {
    profile.addresses.forEach(addr => addr.isDefault = false);
  }

  profile.addresses.push({
    name,
    phone,
    street,
    city,
    state,
    zipCode,
    country,
    isDefault: isDefault || profile.addresses.length === 0
  });

  await profile.save();
  res.status(201).send(profile);
};

// Update existing address
const updateAddress = async (req, res) => {
  const { addressId } = req.params;
  const { name, phone, street, city, state, zipCode, country, isDefault } = req.body;

  const profile = await getOrCreateProfile(req.currentUser);

  const address = profile.addresses.id(addressId);
  if (!address) {
    throw new NotFoundError();
  }

  if (isDefault) {
    profile.addresses.forEach(addr => addr.isDefault = false);
    address.isDefault = true;
  } else if (address.isDefault && profile.addresses.length > 1) {
    // If setting default to false, set first address as default
    address.isDefault = false;
    profile.addresses[0].isDefault = true;
  }

  if (name) address.name = name;
  if (phone) address.phone = phone;
  if (street) address.street = street;
  if (city) address.city = city;
  if (state) address.state = state;
  if (zipCode) address.zipCode = zipCode;
  if (country) address.country = country;

  await profile.save();
  res.status(200).send(profile);
};

// Delete address
const deleteAddress = async (req, res) => {
  const { addressId } = req.params;
  const profile = await getOrCreateProfile(req.currentUser);

  const addressIndex = profile.addresses.findIndex(addr => addr._id.toString() === addressId);
  if (addressIndex === -1) {
    throw new NotFoundError();
  }

  const wasDefault = profile.addresses[addressIndex].isDefault;
  profile.addresses.splice(addressIndex, 1);

  if (wasDefault && profile.addresses.length > 0) {
    profile.addresses[0].isDefault = true;
  }

  await profile.save();
  res.status(200).send(profile);
};

// Set default address
const setDefaultAddress = async (req, res) => {
  const { addressId } = req.params;
  const profile = await getOrCreateProfile(req.currentUser);

  const address = profile.addresses.id(addressId);
  if (!address) {
    throw new NotFoundError();
  }

  profile.addresses.forEach(addr => addr.isDefault = false);
  address.isDefault = true;

  await profile.save();
  res.status(200).send(profile);
};

module.exports = {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};

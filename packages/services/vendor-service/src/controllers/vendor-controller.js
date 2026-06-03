const Vendor = require('../models/vendor');
const { BadRequestError, NotFoundError } = require('@ecommerce/common');
const { vendorRegisteredPublisher, vendorApprovedPublisher } = require('../events/publishers');

// Register vendor store profile & upload documents
const registerVendor = async (req, res) => {
  const { storeName, description, taxId, bankName, accountNumber, accountHolder, routingNumber } = req.body;

  const existingVendor = await Vendor.findOne({ userId: req.currentUser.id });
  if (existingVendor) {
    throw new BadRequestError('Vendor profile already exists for this user');
  }

  // File paths from Multer uploads
  const businessLicensePath = req.files && req.files.businessLicense ? `/uploads/${req.files.businessLicense[0].filename}` : '';
  const logoPath = req.files && req.files.logo ? `/uploads/${req.files.logo[0].filename}` : '';
  const bannerPath = req.files && req.files.banner ? `/uploads/${req.files.banner[0].filename}` : '';

  const vendor = new Vendor({
    userId: req.currentUser.id,
    storeName,
    description: description || '',
    logo: logoPath,
    banner: bannerPath,
    kycDocuments: {
      businessLicense: businessLicensePath,
      taxId: taxId || '',
      bankDetails: {
        accountHolder: accountHolder || '',
        accountNumber: accountNumber || '',
        bankName: bankName || '',
        routingNumber: routingNumber || ''
      }
    },
    status: 'pending'
  });

  await vendor.save();

  // Publish registration event to Kafka
  await vendorRegisteredPublisher.publish({
    id: vendor._id,
    userId: vendor.userId,
    storeName: vendor.storeName,
    status: vendor.status
  });

  res.status(201).send(vendor);
};

// Retrieve current vendor profile
const getVendorProfile = async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.currentUser.id });
  if (!vendor) {
    throw new NotFoundError();
  }
  res.status(200).send(vendor);
};

// Public endpoint for customers to browse vendor stores
const getVendorPublicProfile = async (req, res) => {
  const { vendorId } = req.params;
  const vendor = await Vendor.findOne({ userId: vendorId, status: 'approved' });
  if (!vendor) {
    throw new NotFoundError();
  }
  
  // Strip sensitive KYC data for public view
  const publicVendor = {
    userId: vendor.userId,
    storeName: vendor.storeName,
    description: vendor.description,
    logo: vendor.logo,
    banner: vendor.banner,
    followersCount: vendor.followers.length
  };
  
  res.status(200).send(publicVendor);
};

// Follow/Unfollow a vendor store
const followVendor = async (req, res) => {
  const { vendorId } = req.params;
  const userId = req.currentUser.id;

  const vendor = await Vendor.findOne({ userId: vendorId, status: 'approved' });
  if (!vendor) {
    throw new NotFoundError();
  }

  const index = vendor.followers.indexOf(userId);
  let followed = false;
  if (index === -1) {
    vendor.followers.push(userId);
    followed = true;
  } else {
    vendor.followers.splice(index, 1);
  }

  await vendor.save();
  res.status(200).send({
    message: followed ? 'Followed vendor successfully' : 'Unfollowed vendor successfully',
    followersCount: vendor.followers.length,
    followed
  });
};

// Update vendor store attributes
const updateVendorProfile = async (req, res) => {
  const { storeName, description } = req.body;
  const vendor = await Vendor.findOne({ userId: req.currentUser.id });
  if (!vendor) {
    throw new NotFoundError();
  }

  if (storeName) vendor.storeName = storeName;
  if (description !== undefined) vendor.description = description;

  if (req.files) {
    if (req.files.logo) {
      vendor.logo = `/uploads/${req.files.logo[0].filename}`;
    }
    if (req.files.banner) {
      vendor.banner = `/uploads/${req.files.banner[0].filename}`;
    }
  }

  await vendor.save();
  res.status(200).send(vendor);
};

// [Admin] Approve/Reject/Suspend vendor
const adminApproveVendor = async (req, res) => {
  const { vendorId } = req.params;
  const { status } = req.body; // approved, rejected, suspended

  if (!['approved', 'rejected', 'suspended'].includes(status)) {
    throw new BadRequestError('Invalid status value');
  }

  const vendor = await Vendor.findOne({ userId: vendorId });
  if (!vendor) {
    throw new NotFoundError();
  }

  vendor.status = status;
  await vendor.save();

  // Publish approval change event to Kafka
  await vendorApprovedPublisher.publish({
    userId: vendor.userId,
    storeName: vendor.storeName,
    status: vendor.status,
    commissionPercentage: vendor.commissionPercentage
  });

  res.status(200).send(vendor);
};

// [Admin] Adjust commission rate
const adminManageCommission = async (req, res) => {
  const { vendorId } = req.params;
  const { commissionPercentage } = req.body;

  if (commissionPercentage === undefined || commissionPercentage < 0 || commissionPercentage > 100) {
    throw new BadRequestError('Commission percentage must be between 0 and 100');
  }

  const vendor = await Vendor.findOne({ userId: vendorId });
  if (!vendor) {
    throw new NotFoundError();
  }

  vendor.commissionPercentage = Number(commissionPercentage);
  await vendor.save();

  res.status(200).send(vendor);
};

// [Admin] List all vendors
const getAllVendors = async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) {
    filter.status = status;
  }
  const vendors = await Vendor.find(filter);
  res.status(200).send(vendors);
};

module.exports = {
  registerVendor,
  getVendorProfile,
  getVendorPublicProfile,
  followVendor,
  updateVendorProfile,
  adminApproveVendor,
  adminManageCommission,
  getAllVendors
};

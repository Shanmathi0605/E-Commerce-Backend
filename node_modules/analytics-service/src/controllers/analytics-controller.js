const DailyMetric = require('../models/daily-metric');
const GlobalMetric = require('../models/global-metric');
const { NotFoundError } = require('@ecommerce/common');

// Retrieve general platform statistics for Admin Dashboard
const getAdminAnalytics = async (req, res) => {
  let summary = await GlobalMetric.findOne({ key: 'global_summary' });
  if (!summary) {
    summary = new GlobalMetric({
      totalUsers: 0,
      totalVendors: 0,
      totalProducts: 0,
      totalOrders: 0,
      totalSales: 0,
      platformCommission: 0
    });
    await summary.save();
  }

  // Fetch last 30 days of daily metrics to render charts (sales, commissions, registrations)
  const chartData = await DailyMetric.find({})
    .sort({ date: -1 })
    .limit(30);

  // Return chronologically (oldest to newest)
  chartData.reverse();

  res.status(200).send({
    summary,
    charts: chartData
  });
};

// Retrieve Vendor metrics (mocked or aggregated daily orders summary)
const getVendorAnalytics = async (req, res) => {
  // Mock data for graphs if no live orders are present to render charts nicely in development
  const mockVendorCharts = [
    { date: '2026-05-28', totalSales: 120, totalOrders: 3, platformCommission: 12 },
    { date: '2026-05-29', totalSales: 240, totalOrders: 5, platformCommission: 24 },
    { date: '2026-05-30', totalSales: 180, totalOrders: 4, platformCommission: 18 },
    { date: '2026-05-31', totalSales: 350, totalOrders: 7, platformCommission: 35 },
    { date: '2026-06-01', totalSales: 500, totalOrders: 9, platformCommission: 50 },
    { date: '2026-06-02', totalSales: 410, totalOrders: 8, platformCommission: 41 },
    { date: '2026-06-03', totalSales: 620, totalOrders: 11, platformCommission: 62 }
  ];

  res.status(200).send({
    summary: {
      totalSales: 2420,
      totalOrders: 47,
      bestSellingProducts: [
        { title: 'Wireless Noise Cancelling Headphones', salesCount: 15 },
        { title: 'Smart Fitness Tracker Band', salesCount: 12 }
      ]
    },
    charts: mockVendorCharts
  });
};

module.exports = {
  getAdminAnalytics,
  getVendorAnalytics
};

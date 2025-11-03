// API routes for SR performance dashboard
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import DatabaseService from '../services/database.js';

const router = express.Router();

// Configure multer for image uploads (temp storage, will be moved later)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use a temp folder, actual destination determined by route
    const uploadPath = path.join(process.cwd(), 'public/temp-uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `upload-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all SRs with performance data
router.get('/srs', async (req, res) => {
  try {
    const { dateRange = 'all' } = req.query;
    const srs = await DatabaseService.getSRs(dateRange);
    
    // Format data to match frontend expectations
    const formattedSRs = srs.map(sr => ({
      id: sr.id,
      name: sr.name,
      referralCode: sr.referral_code,
      profileImage: getSRProfileImage(sr.referral_code),
      phone: sr.phone,
      email: sr.email,
      joinDate: sr.joinDate,
      totalCustomersRegistered: parseInt(sr.totalCustomersRegistered),
      totalOrders: parseInt(sr.totalOrders),
      totalOrderValue: parseFloat(sr.totalOrderValue),
    }));

    res.json(formattedSRs);
  } catch (error) {
    console.error('Error fetching SRs:', error);
    res.status(500).json({ error: 'Failed to fetch SR data' });
  }
});

// Get single SR by ID
router.get('/srs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { dateRange = '30d' } = req.query;
    
    // Get SR with performance data for the specified date range
    const srs = await DatabaseService.getSRs(dateRange);
    
    // Format the SRs data first (same as main /srs route)
    const formattedSRs = srs.map(sr => ({
      id: sr.id,
      name: sr.name,
      referralCode: sr.referral_code,
      profileImage: getSRProfileImage(sr.referral_code),
      phone: sr.phone,
      email: sr.email,
      joinDate: sr.joinDate,
      totalCustomersRegistered: parseInt(sr.totalCustomersRegistered),
      totalOrders: parseInt(sr.totalOrders),
      totalOrderValue: parseFloat(sr.totalOrderValue),
    }));
    
    const sr = formattedSRs.find(sr => sr.id.toString() === id || sr.referralCode === id);
    
    if (!sr) {
      return res.status(404).json({ error: 'SR not found' });
    }

    // Get daily activity for this SR
    const dailyActivity = await DatabaseService.getDailyActivity(dateRange);
    const srActivity = dailyActivity.filter(activity => activity.srCode === sr.referralCode);
    
    const formattedSR = {
      id: sr.id,
      name: sr.name,
      referralCode: sr.referralCode,
      profileImage: getSRProfileImage(sr.referralCode),
      phone: sr.phone,
      email: sr.email,
      joinDate: sr.joinDate,
      totalCustomersRegistered: parseInt(sr.totalCustomersRegistered),
      totalOrders: parseInt(sr.totalOrders),
      totalOrderValue: parseFloat(sr.totalOrderValue),
      dailyData: formatDailyData(srActivity),
    };

    res.json(formattedSR);
  } catch (error) {
    console.error('Error fetching SR:', error);
    res.status(500).json({ error: 'Failed to fetch SR data' });
  }
});

// Upload SR profile image
router.post('/srs/:id/upload-image', upload.single('image'), async (req, res) => {
  try {
    console.log('Upload request received for SR ID:', req.params.id);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const srId = req.params.id;
    const imageUrl = `/sr-images/${req.file.filename}`;
    
    console.log('File uploaded:', req.file.filename);
    console.log('SR ID:', srId);
    console.log('Image URL:', imageUrl);
    
    // Store image association in server-side JSON file
    try {
      const mappingPath = path.join(process.cwd(), 'sr-images-mapping.json');
      let imageMapping = {};
      
      console.log('Mapping file path:', mappingPath);
      
      // Read existing mappings
      if (fs.existsSync(mappingPath)) {
        const mappingData = fs.readFileSync(mappingPath, 'utf8');
        imageMapping = JSON.parse(mappingData);
        console.log('Existing mapping:', imageMapping);
      } else {
        console.log('Mapping file does not exist, creating new one');
      }
      
      // Update mapping for this SR
      imageMapping[srId] = imageUrl;
      console.log('Updated mapping:', imageMapping);
      
      // Write back to file
      fs.writeFileSync(mappingPath, JSON.stringify(imageMapping, null, 2));
      console.log('Mapping saved successfully');
      
      res.json({ 
        success: true, 
        imageUrl,
        message: 'Image uploaded and associated successfully' 
      });
    } catch (mappingError) {
      console.error('Error saving image mapping:', mappingError);
      res.status(500).json({ error: 'Failed to save image association' });
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Get dashboard summary
router.get('/dashboard/summary', async (req, res) => {
  try {
    const { dateRange = '7d' } = req.query;
    const summary = await DatabaseService.getDashboardSummary(dateRange);
    
    res.json({
      totalRegistrations: parseInt(summary.totalRegistrations) || 0,
      totalOrders: parseInt(summary.totalOrders) || 0,
      totalOrderValue: parseFloat(summary.totalOrderValue) || 0,
      totalActiveSRs: parseInt(summary.totalActiveSRs) || 0,
      averageOrderValue: summary.totalOrders > 0 
        ? parseFloat(summary.totalOrderValue / summary.totalOrders).toFixed(2) 
        : 0,
      conversionRate: summary.totalRegistrations > 0 
        ? ((summary.totalOrders / summary.totalRegistrations) * 100).toFixed(1)
        : 0
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// Get trend data for charts
router.get('/dashboard/trends', async (req, res) => {
  try {
    const { dateRange = '7d' } = req.query;
    const dailyActivity = await DatabaseService.getDailyActivity(dateRange);
    
    // Group by date for chart display
    const trendData = {};
    
    dailyActivity.forEach(activity => {
      const date = activity.date;
      if (!trendData[date]) {
        trendData[date] = { date, registrations: 0, orders: 0, revenue: 0 };
      }
      
      if (activity.type === 'registrations') {
        trendData[date].registrations += activity.count;
      } else if (activity.type === 'orders') {
        trendData[date].orders += activity.count;
        trendData[date].revenue += parseFloat(activity.value);
      }
    });
    
    const trends = Object.values(trendData).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trend data' });
  }
});

// Get leaderboard data
router.get('/leaderboard', async (req, res) => {
  try {
    const { dateRange = '7d', sortBy = 'registrations' } = req.query;
    const srs = await DatabaseService.getSRs(dateRange);
    
    // Sort based on criteria
    let sortedSRs = [...srs];
    switch (sortBy) {
      case 'revenue':
        sortedSRs.sort((a, b) => parseFloat(b.totalOrderValue) - parseFloat(a.totalOrderValue));
        break;
      case 'orders':
        sortedSRs.sort((a, b) => parseInt(b.totalOrders) - parseInt(a.totalOrders));
        break;
      case 'conversion':
        sortedSRs.sort((a, b) => {
          const aConversion = a.totalCustomersRegistered > 0 ? (a.totalOrders / a.totalCustomersRegistered) : 0;
          const bConversion = b.totalCustomersRegistered > 0 ? (b.totalOrders / b.totalCustomersRegistered) : 0;
          return bConversion - aConversion;
        });
        break;
      default: // registrations
        sortedSRs.sort((a, b) => parseInt(b.totalCustomersRegistered) - parseInt(a.totalCustomersRegistered));
    }
    
    const formattedSRs = sortedSRs.map((sr, index) => ({
      ...sr,
      profileImage: getSRProfileImage(sr.referral_code),
      rank: index + 1,
      conversionRate: sr.totalCustomersRegistered > 0 
        ? ((sr.totalOrders / sr.totalCustomersRegistered) * 100).toFixed(1)
        : 0
    }));
    
    res.json(formattedSRs);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
});

// Get ALL platform registration summary
router.get('/registrations/summary', async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    const summary = await DatabaseService.getAllRegistrationSummary(dateRange);
    
    res.json({
      totalRegistrations: parseInt(summary.totalRegistrations) || 0,
      uniqueReferralCodes: parseInt(summary.uniqueReferralCodes) || 0,
      activeDays: parseInt(summary.activeDays) || 0,
      avgRegistrationsPerDay: parseFloat(summary.avgRegistrationsPerDay) || 0,
      validSRLinkedRegistrations: parseInt(summary.validSRLinkedRegistrations) || 0,
      directRegistrations: parseInt(summary.directRegistrations) || 0,
      srLinkedPercentage: summary.totalRegistrations > 0 
        ? ((summary.validSRLinkedRegistrations / summary.totalRegistrations) * 100).toFixed(1)
        : 0
    });
  } catch (error) {
    console.error('Error fetching registration summary:', error);
    res.status(500).json({ error: 'Failed to fetch registration summary' });
  }
});

// Get ALL platform registration trends
router.get('/registrations/trends', async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    const trends = await DatabaseService.getAllRegistrationTrends(dateRange);
    
    const formattedTrends = trends.map(trend => ({
      date: trend.date,
      totalRegistrations: parseInt(trend.totalRegistrations),
      srLinkedRegistrations: parseInt(trend.srLinkedRegistrations),
      directRegistrations: parseInt(trend.directRegistrations),
      dayName: trend.dayName
    }));
    
    res.json(formattedTrends);
  } catch (error) {
    console.error('Error fetching registration trends:', error);
    res.status(500).json({ error: 'Failed to fetch registration trends' });
  }
});

// Get registration source breakdown
router.get('/registrations/sources', async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    const sources = await DatabaseService.getRegistrationSources(dateRange);
    
    const formattedSources = sources.map(source => ({
      source: source.source,
      registrations: parseInt(source.registrations),
      percentage: parseFloat(source.percentage)
    }));
    
    res.json(formattedSources);
  } catch (error) {
    console.error('Error fetching registration sources:', error);
    res.status(500).json({ error: 'Failed to fetch registration sources' });
  }
});

// Get enhanced sales summary
router.get('/sales/summary', async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    const summary = await DatabaseService.getEnhancedSalesSummary(dateRange);
    
    res.json({
      totalOrders: parseInt(summary.totalOrders) || 0,
      totalOrderValue: parseFloat(summary.totalOrderValue) || 0,
      totalDeliveryCharges: parseFloat(summary.totalDeliveryCharges) || 0,
      totalRevenue: parseFloat(summary.totalRevenue) || 0,
      uniqueCustomers: parseInt(summary.uniqueCustomers) || 0,
      uniqueReferralCodes: parseInt(summary.uniqueReferralCodes) || 0,
      avgOrderValue: parseFloat(summary.avgOrderValue) || 0,
      avgOrderTotal: parseFloat(summary.avgOrderTotal) || 0,
      avgDeliveryCharge: parseFloat(summary.avgDeliveryCharge) || 0,
      activeDays: parseInt(summary.activeDays) || 0,
      srLinkedOrders: parseInt(summary.srLinkedOrders) || 0,
      srLinkedOrderTotal: parseFloat(summary.srLinkedOrderTotal) || 0,
      srLinkedDeliveryCharges: parseFloat(summary.srLinkedDeliveryCharges) || 0,
      srLinkedRevenue: parseFloat(summary.srLinkedRevenue) || 0,
      srLinkedPercentage: summary.totalOrders > 0 
        ? ((summary.srLinkedOrders / summary.totalOrders) * 100).toFixed(1)
        : 0
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({ error: 'Failed to fetch sales summary' });
  }
});

// Get enhanced sales trends
router.get('/sales/trends', async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    const trends = await DatabaseService.getEnhancedSalesTrends(dateRange);
    
    const formattedTrends = trends.map(trend => ({
      date: trend.date,
      totalOrders: parseInt(trend.totalOrders),
      totalOrderValue: parseFloat(trend.totalOrderValue),
      totalDeliveryCharges: parseFloat(trend.totalDeliveryCharges),
      totalRevenue: parseFloat(trend.totalRevenue),
      uniqueCustomers: parseInt(trend.uniqueCustomers),
      avgOrderValue: parseFloat(trend.avgOrderValue),
      avgOrderTotal: parseFloat(trend.avgOrderTotal),
      avgDeliveryCharge: parseFloat(trend.avgDeliveryCharge),
      srLinkedOrders: parseInt(trend.srLinkedOrders),
      srLinkedOrderTotal: parseFloat(trend.srLinkedOrderTotal),
      srLinkedDeliveryCharges: parseFloat(trend.srLinkedDeliveryCharges),
      srLinkedRevenue: parseFloat(trend.srLinkedRevenue),
      dayName: trend.dayName
    }));
    
    res.json(formattedTrends);
  } catch (error) {
    console.error('Error fetching sales trends:', error);
    res.status(500).json({ error: 'Failed to fetch sales trends' });
  }
});

// Export data
router.get('/export', async (req, res) => {
  try {
    const { dateRange = '30d', format = 'csv' } = req.query;
    const data = await DatabaseService.getExportData(dateRange, 'detailed');

    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sr-performance-${dateRange}-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.json(data);
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// ==========================================
// DRIVERS DASHBOARD ROUTES
// ==========================================

// Get all active drivers based on order_statuses (REWRITTEN - Phase 7)
router.get('/drivers', async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    const drivers = await DatabaseService.getDrivers(dateRange);

    const formattedDrivers = drivers.map(driver => ({
      id: driver.id,
      name: driver.name,
      mobile: driver.mobile,
      adminId: driver.admin_id,
      profileImage: getDriverProfileImage(driver.id),
      joinDate: driver.joinDate,
      status: driver.status,
      isAvailable: driver.is_available,

      // Delivery Activity Metrics
      outForDeliveryCount: parseInt(driver.outForDeliveryCount) || 0,
      deliveredCount: parseInt(driver.deliveredCount) || 0,
      totalOrdersAssigned: parseInt(driver.totalOrdersAssigned) || 0,
      cancelledCount: parseInt(driver.cancelledCount) || 0,
      returnedCount: parseInt(driver.returnedCount) || 0,

      // Delivery Time Metrics
      avgDeliveryTimeMinutes: parseFloat(driver.avgDeliveryTimeMinutes) || 0,
      avgDeliveryTimeHours: parseFloat(driver.avgDeliveryTimeHours) || 0,
      minDeliveryTimeMinutes: parseInt(driver.minDeliveryTimeMinutes) || 0,
      maxDeliveryTimeMinutes: parseInt(driver.maxDeliveryTimeMinutes) || 0,

      // Productivity Metrics
      activeDays: parseInt(driver.activeDays) || 0,
      avgOrdersPerDay: parseFloat(driver.avgOrdersPerDay) || 0,

      // Success Rate
      deliverySuccessRate: parseFloat(driver.deliverySuccessRate) || 0
    }));

    res.json(formattedDrivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers data' });
  }
});

// Get driver trends
router.get('/drivers/trends', async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    const trends = await DatabaseService.getDriverDailyActivity(dateRange);

    res.json(trends);
  } catch (error) {
    console.error('Error fetching driver trends:', error);
    res.status(500).json({ error: 'Failed to fetch driver trends' });
  }
});

// Upload driver profile image
router.post('/drivers/:id/upload-image', upload.single('image'), async (req, res) => {
  try {
    console.log('Upload request received for Driver ID:', req.params.id);

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const driverId = req.params.id;

    // First, delete any existing image for this driver (except default-avatar.png)
    try {
      const mappingPath = path.join(process.cwd(), 'driver-images-mapping.json');
      let imageMapping = {};

      if (fs.existsSync(mappingPath)) {
        const mappingData = fs.readFileSync(mappingPath, 'utf8');
        imageMapping = JSON.parse(mappingData);

        // Delete old image file if it exists and is not default-avatar
        const oldImagePath = imageMapping[driverId];
        if (oldImagePath && !oldImagePath.includes('default-avatar.png')) {
          const oldFilePath = path.join(process.cwd(), 'public', oldImagePath);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log('Deleted old image:', oldFilePath);
          }
        }
      }
    } catch (cleanupError) {
      console.error('Error cleaning up old image:', cleanupError);
      // Continue with upload even if cleanup fails
    }

    // Save new image with driver-specific filename
    const ext = path.extname(req.file.originalname);
    const newFilename = `driver-${driverId}${ext}`;
    const oldPath = req.file.path;
    const newPath = path.join(process.cwd(), 'public/driver-images', newFilename);

    // Move/rename the uploaded file
    fs.renameSync(oldPath, newPath);
    console.log('File saved as:', newFilename);

    const imageUrl = `/driver-images/${newFilename}`;
    console.log('Driver ID:', driverId);
    console.log('Image URL:', imageUrl);

    // Update image mapping
    try {
      const mappingPath = path.join(process.cwd(), 'driver-images-mapping.json');
      let imageMapping = {};

      if (fs.existsSync(mappingPath)) {
        const mappingData = fs.readFileSync(mappingPath, 'utf8');
        imageMapping = JSON.parse(mappingData);
      }

      // Update mapping for this driver
      imageMapping[driverId] = imageUrl;
      console.log('Updated mapping:', imageMapping);

      // Write back to file
      fs.writeFileSync(mappingPath, JSON.stringify(imageMapping, null, 2));
      console.log('Mapping saved successfully');

      res.json({
        success: true,
        imageUrl,
        message: 'Image uploaded and associated successfully'
      });
    } catch (mappingError) {
      console.error('Error saving image mapping:', mappingError);
      res.status(500).json({ error: 'Failed to save image association' });
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// ==========================================
// CSR IMAGE UPLOAD
// ==========================================

router.post('/csr/:id/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const csrId = req.params.id;
    const mappingPath = path.join(process.cwd(), 'csr-images-mapping.json');

    let imageMapping = {};
    try {
      const mappingData = fs.readFileSync(mappingPath, 'utf8');
      imageMapping = JSON.parse(mappingData);
    } catch (error) {
      console.log('No existing CSR image mapping found, creating new one');
    }

    // Delete old image if exists
    const oldImagePath = imageMapping[csrId];
    if (oldImagePath && !oldImagePath.includes('default-avatar.png')) {
      try {
        const oldFullPath = path.join(process.cwd(), 'public', oldImagePath);
        if (fs.existsSync(oldFullPath)) {
          fs.unlinkSync(oldFullPath);
        }
      } catch (deleteError) {
        console.error('Error deleting old image:', deleteError);
      }
    }

    // Save new image with CSR-specific filename
    const ext = path.extname(req.file.originalname);
    const newFilename = `csr-${csrId}${ext}`;
    const oldPath = req.file.path;
    const newPath = path.join(process.cwd(), 'public/csr-images', newFilename);

    fs.renameSync(oldPath, newPath);

    // Update mapping
    imageMapping[csrId] = `/csr-images/${newFilename}`;

    try {
      fs.writeFileSync(mappingPath, JSON.stringify(imageMapping, null, 2));
      res.json({
        success: true,
        imagePath: `/csr-images/${newFilename}`,
        message: 'CSR image uploaded successfully'
      });
    } catch (mappingError) {
      console.error('Error saving image mapping:', mappingError);
      res.status(500).json({ error: 'Failed to save image association' });
    }
  } catch (error) {
    console.error('Error uploading CSR image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// ==========================================
// CSR DASHBOARD ROUTES
// ==========================================

// Get all CSR staff with performance data
router.get('/csr', async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    const csrStaff = await DatabaseService.getCSRStaff(dateRange);

    const formattedCSR = csrStaff.map(csr => ({
      id: csr.id,
      name: csr.name,
      email: csr.email,
      profileImage: getCSRProfileImage(csr.id),
      joinDate: csr.joinDate,
      status: csr.status,

      // Quantity Metrics
      totalInteractions: parseInt(csr.totalInteractions) || 0,
      newOrderCalls: parseInt(csr.newOrderCalls) || 0,
      complaintCalls: parseInt(csr.complaintCalls) || 0,
      orderInquiryCalls: parseInt(csr.orderInquiryCalls) || 0,
      successfulOrders: parseInt(csr.successfulOrders) || 0,
      successfulRegistrations: parseInt(csr.successfulRegistrations) || 0,
      complaintsResolved: parseInt(csr.complaintsResolved) || 0,
      informationProvided: parseInt(csr.informationProvided) || 0,
      totalOrderValue: parseFloat(csr.totalOrderValue) || 0,

      // Timing/Performance Metrics
      avgCallDuration: parseFloat(csr.avgCallDuration) || 0,
      avgResponseTimeSeconds: parseFloat(csr.avgResponseTimeSeconds) || 0,
      avgResponseTimeMinutes: ((parseFloat(csr.avgResponseTimeSeconds) || 0) / 60).toFixed(2),
      avgOrderProcessingTimeSeconds: parseFloat(csr.avgOrderProcessingTimeSeconds) || 0,
      avgOrderProcessingTimeMinutes: ((parseFloat(csr.avgOrderProcessingTimeSeconds) || 0) / 60).toFixed(2),

      // Productivity Metrics
      activeDays: parseInt(csr.activeDays) || 0,
      avgInteractionsPerDay: parseFloat(csr.avgInteractionsPerDay) || 0,

      // Success Rates
      successRate: csr.newOrderCalls > 0
        ? ((csr.successfulOrders / csr.newOrderCalls) * 100).toFixed(1)
        : 0,
      conversionRate: csr.totalInteractions > 0
        ? ((csr.successfulOrders / csr.totalInteractions) * 100).toFixed(1)
        : 0,
      registrationRate: csr.totalInteractions > 0
        ? ((csr.successfulRegistrations / csr.totalInteractions) * 100).toFixed(1)
        : 0,
      avgOrderValue: csr.successfulOrders > 0
        ? (parseFloat(csr.totalOrderValue) / csr.successfulOrders).toFixed(2)
        : 0
    }));

    res.json(formattedCSR);
  } catch (error) {
    console.error('Error fetching CSR staff:', error);
    res.status(500).json({ error: 'Failed to fetch CSR data' });
  }
});

// Get CSR trends (ENHANCED - Phase 2)
router.get('/csr/trends', async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    const trends = await DatabaseService.getCSRDailyActivity(dateRange);

    res.json(trends);
  } catch (error) {
    console.error('Error fetching CSR trends:', error);
    res.status(500).json({ error: 'Failed to fetch CSR trends' });
  }
});

// Get CSR hourly performance breakdown (NEW - Phase 2)
router.get('/csr/hourly-performance', async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    const hourlyData = await DatabaseService.getCSRHourlyPerformance(dateRange);

    res.json(hourlyData);
  } catch (error) {
    console.error('Error fetching CSR hourly performance:', error);
    res.status(500).json({ error: 'Failed to fetch CSR hourly performance' });
  }
});

// Get CSR interaction breakdown by type (NEW - Phase 2)
router.get('/csr/:id/interaction-breakdown', async (req, res) => {
  try {
    const { id } = req.params;
    const { dateRange = '30d' } = req.query;
    const breakdown = await DatabaseService.getCSRInteractionBreakdown(parseInt(id), dateRange);

    res.json(breakdown);
  } catch (error) {
    console.error('Error fetching CSR interaction breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch CSR interaction breakdown' });
  }
});

// ==========================================
// PACKING IMAGE UPLOAD
// ==========================================

router.post('/packing/:id/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const packerId = req.params.id;
    const mappingPath = path.join(process.cwd(), 'packing-images-mapping.json');

    let imageMapping = {};
    try {
      const mappingData = fs.readFileSync(mappingPath, 'utf8');
      imageMapping = JSON.parse(mappingData);
    } catch (error) {
      console.log('No existing Packing image mapping found, creating new one');
    }

    // Delete old image if exists
    const oldImagePath = imageMapping[packerId];
    if (oldImagePath && !oldImagePath.includes('default-avatar.png')) {
      try {
        const oldFullPath = path.join(process.cwd(), 'public', oldImagePath);
        if (fs.existsSync(oldFullPath)) {
          fs.unlinkSync(oldFullPath);
        }
      } catch (deleteError) {
        console.error('Error deleting old image:', deleteError);
      }
    }

    // Save new image with packer-specific filename
    const ext = path.extname(req.file.originalname);
    const newFilename = `packing-${packerId}${ext}`;
    const oldPath = req.file.path;
    const newPath = path.join(process.cwd(), 'public/packing-images', newFilename);

    fs.renameSync(oldPath, newPath);

    // Update mapping
    imageMapping[packerId] = `/packing-images/${newFilename}`;

    try {
      fs.writeFileSync(mappingPath, JSON.stringify(imageMapping, null, 2));
      res.json({
        success: true,
        imagePath: `/packing-images/${newFilename}`,
        message: 'Packing staff image uploaded successfully'
      });
    } catch (mappingError) {
      console.error('Error saving image mapping:', mappingError);
      res.status(500).json({ error: 'Failed to save image association' });
    }
  } catch (error) {
    console.error('Error uploading packing image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// ==========================================
// PACKING DASHBOARD ROUTES
// ==========================================

// Get all packing staff with performance data (ENHANCED - Phase 4)
router.get('/packing', async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    const packingStaff = await DatabaseService.getPackingStaff(dateRange);

    const formattedPacking = packingStaff.map(packer => ({
      id: packer.id,
      name: packer.name,
      email: packer.email,
      profileImage: getPackingProfileImage(packer.id),
      joinDate: packer.joinDate,
      status: packer.status,

      // Quantity Metrics
      totalOrdersPacked: parseInt(packer.totalOrdersPacked) || 0,
      ordersShipped: parseInt(packer.ordersShipped) || 0,
      ordersDelivered: parseInt(packer.ordersDelivered) || 0,
      ordersReturned: parseInt(packer.ordersReturned) || 0,

      // Timing Metrics
      avgPackingTimeMinutes: parseFloat(packer.avgPackingTimeMinutes) || 0,
      avgPackingTimeHours: ((parseFloat(packer.avgPackingTimeMinutes) || 0) / 60).toFixed(2),
      avgTimeToShipMinutes: parseFloat(packer.avgTimeToShipMinutes) || 0,
      avgTimeToShipHours: ((parseFloat(packer.avgTimeToShipMinutes) || 0) / 60).toFixed(2),

      // Productivity Metrics
      activeDays: parseInt(packer.activeDays) || 0,
      avgOrdersPerDay: parseFloat(packer.avgOrdersPerDay) || 0,

      // Success Rates
      deliverySuccessRate: parseFloat(packer.deliverySuccessRate) || 0,
      successRate: packer.totalOrdersPacked > 0
        ? ((packer.ordersDelivered / packer.totalOrdersPacked) * 100).toFixed(1)
        : 0,
      shippingRate: packer.totalOrdersPacked > 0
        ? ((packer.ordersShipped / packer.totalOrdersPacked) * 100).toFixed(1)
        : 0
    }));

    res.json(formattedPacking);
  } catch (error) {
    console.error('Error fetching packing staff:', error);
    res.status(500).json({ error: 'Failed to fetch packing data' });
  }
});

// Get packing trends (ENHANCED - Phase 4)
router.get('/packing/trends', async (req, res) => {
  try {
    const { dateRange = '30d' } = req.query;
    const trends = await DatabaseService.getPackingDailyActivity(dateRange);

    res.json(trends);
  } catch (error) {
    console.error('Error fetching packing trends:', error);
    res.status(500).json({ error: 'Failed to fetch packing trends' });
  }
});

// Get packing timing breakdown (NEW - Phase 4)
router.get('/packing/:id/timing-breakdown', async (req, res) => {
  try {
    const { id } = req.params;
    const { dateRange = '30d' } = req.query;
    const breakdown = await DatabaseService.getPackingTimingBreakdown(parseInt(id), dateRange);

    res.json(breakdown);
  } catch (error) {
    console.error('Error fetching packing timing breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch packing timing breakdown' });
  }
});

// Helper functions
function getSRProfileImage(srId) {
  try {
    const mappingPath = path.join(process.cwd(), 'sr-images-mapping.json');
    if (fs.existsSync(mappingPath)) {
      const mappingData = fs.readFileSync(mappingPath, 'utf8');
      const imageMapping = JSON.parse(mappingData);
      return imageMapping[srId] || `/sr-images/default-avatar.png`;
    }
  } catch (error) {
    console.error('Error reading image mapping:', error);
  }
  return `/sr-images/default-avatar.png`;
}

function getDriverProfileImage(driverId) {
  try {
    const mappingPath = path.join(process.cwd(), 'driver-images-mapping.json');
    if (fs.existsSync(mappingPath)) {
      const mappingData = fs.readFileSync(mappingPath, 'utf8');
      const imageMapping = JSON.parse(mappingData);
      return imageMapping[driverId] || `/driver-images/default-avatar.png`;
    }
  } catch (error) {
    console.error('Error reading driver image mapping:', error);
  }
  return `/driver-images/default-avatar.png`;
}

function getCSRProfileImage(csrId) {
  try {
    const mappingPath = path.join(process.cwd(), 'csr-images-mapping.json');
    if (fs.existsSync(mappingPath)) {
      const mappingData = fs.readFileSync(mappingPath, 'utf8');
      const imageMapping = JSON.parse(mappingData);
      return imageMapping[csrId] || `/csr-images/default-avatar.png`;
    }
  } catch (error) {
    console.error('Error reading CSR image mapping:', error);
  }
  return `/csr-images/default-avatar.png`;
}

function getPackingProfileImage(packerId) {
  try {
    const mappingPath = path.join(process.cwd(), 'packing-images-mapping.json');
    if (fs.existsSync(mappingPath)) {
      const mappingData = fs.readFileSync(mappingPath, 'utf8');
      const imageMapping = JSON.parse(mappingData);
      return imageMapping[packerId] || `/packing-images/default-avatar.png`;
    }
  } catch (error) {
    console.error('Error reading packing image mapping:', error);
  }
  return `/packing-images/default-avatar.png`;
}

function formatDailyData(dailyActivity) {
  const dailyMap = {};
  
  dailyActivity.forEach(activity => {
    const date = activity.date;
    if (!dailyMap[date]) {
      dailyMap[date] = { date, registrations: 0, orders: 0, orderValue: 0 };
    }
    
    if (activity.type === 'registrations') {
      dailyMap[date].registrations = activity.count;
    } else if (activity.type === 'orders') {
      dailyMap[date].orders = activity.count;
      dailyMap[date].orderValue = parseFloat(activity.value);
    }
  });
  
  return Object.values(dailyMap).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}

// ==========================================
// LEADERBOARD ROUTES - Phase 5
// ==========================================

// Get CSR leaderboard
router.get('/leaderboard/csr', async (req, res) => {
  try {
    const { dateRange = '30d', sortBy = 'interactions' } = req.query;
    const leaderboard = await DatabaseService.getCSRLeaderboard(dateRange, sortBy);

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching CSR leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch CSR leaderboard' });
  }
});

// Get driver leaderboard (UPDATED - Phase 7)
router.get('/leaderboard/drivers', async (req, res) => {
  try {
    const { dateRange = '30d', sortBy = 'deliveries' } = req.query;
    const leaderboard = await DatabaseService.getDriverLeaderboard(dateRange, sortBy);

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching driver leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch driver leaderboard' });
  }
});

// Get packing leaderboard
router.get('/leaderboard/packing', async (req, res) => {
  try {
    const { dateRange = '30d', sortBy = 'packed' } = req.query;
    const leaderboard = await DatabaseService.getPackingLeaderboard(dateRange, sortBy);

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching packing leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch packing leaderboard' });
  }
});

// DEBUG ENDPOINT - Investigate data issues
router.get('/debug/investigate', async (req, res) => {
  try {
    const pool = DatabaseService.pool;

    // Check CSR IDs 9 and 24 in call_centre_interactions
    const [csrCheck] = await pool.execute(`
      SELECT
        operator_id,
        COUNT(*) as interaction_count
      FROM call_centre_interactions
      WHERE operator_id IN (9, 24)
      GROUP BY operator_id
    `);

    // Check all driver IDs in orders table
    const [driverCheck] = await pool.execute(`
      SELECT
        delivery_boy_id,
        COUNT(*) as order_count,
        COUNT(DISTINCT active_status) as status_count
      FROM orders
      WHERE delivery_boy_id IN (33, 37, 40, 42)
      GROUP BY delivery_boy_id
    `);

    // Check all delivery_boy_id values that exist
    const [allDrivers] = await pool.execute(`
      SELECT DISTINCT delivery_boy_id, COUNT(*) as order_count
      FROM orders
      WHERE delivery_boy_id IS NOT NULL
      GROUP BY delivery_boy_id
      ORDER BY order_count DESC
      LIMIT 20
    `);

    // Sample call_centre_interactions structure
    const [callSample] = await pool.execute(`
      SELECT * FROM call_centre_interactions
      LIMIT 3
    `);

    // Check admins status for IDs 9, 24
    const [adminCheck] = await pool.execute(`
      SELECT id, username, email, role_id, status
      FROM admins
      WHERE id IN (9, 24, 33, 37, 40, 42, 31)
    `);

    res.json({
      csrInteractions: csrCheck,
      driverOrders: driverCheck,
      allDriversInOrders: allDrivers,
      callSample: callSample,
      adminStatus: adminCheck
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
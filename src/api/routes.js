// API routes for SR performance dashboard
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import DatabaseService from '../services/database.js';

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'public/sr-images');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `sr-${Date.now()}${ext}`;
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
      profileImage: sr.profileImage || `/sr-images/default-avatar.png`,
      phone: sr.phone,
      email: sr.email,
      joinDate: sr.joinDate,
      totalCustomersRegistered: parseInt(sr.totalCustomersRegistered),
      totalOrders: parseInt(sr.totalOrders),
      totalOrderValue: parseFloat(sr.totalOrderValue),
      achievements: generateAchievements(sr)
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
      profileImage: sr.profileImage || `/sr-images/default-avatar.png`,
      phone: sr.phone,
      email: sr.email,
      joinDate: sr.joinDate,
      totalCustomersRegistered: parseInt(sr.totalCustomersRegistered),
      totalOrders: parseInt(sr.totalOrders),
      totalOrderValue: parseFloat(sr.totalOrderValue),
      achievements: generateAchievements(sr)
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
      profileImage: sr.profileImage || `/sr-images/default-avatar.png`,
      phone: sr.phone,
      email: sr.email,
      joinDate: sr.joinDate,
      totalCustomersRegistered: parseInt(sr.totalCustomersRegistered),
      totalOrders: parseInt(sr.totalOrders),
      totalOrderValue: parseFloat(sr.totalOrderValue),
      dailyData: formatDailyData(srActivity),
      achievements: generateAchievements(sr)
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
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageUrl = `/sr-images/${req.file.filename}`;
    
    // In a real app, you'd update the database here
    // For now, just return the image URL
    res.json({ 
      success: true, 
      imageUrl,
      message: 'Image uploaded successfully' 
    });
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

// Helper functions
function generateAchievements(sr) {
  const achievements = [];
  
  if (sr.totalCustomersRegistered >= 80) {
    achievements.push('Top Performer');
  }
  if (sr.totalOrders >= 25) {
    achievements.push('Sales Champion');
  }
  if (sr.totalCustomersRegistered > 0 && (sr.totalOrders / sr.totalCustomersRegistered) >= 0.3) {
    achievements.push('High Conversion Rate');
  }
  if (achievements.length === 0) {
    achievements.push('Rising Star');
  }
  
  return achievements;
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

export default router;
// CSV Parser utility for SR data import
export const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }
  
  return data;
};

export const validateSRData = (data) => {
  const errors = [];
  const requiredFields = ['name', 'referral_code', 'registrations', 'orders', 'revenue'];
  
  data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because index starts at 0 and we skip header
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || row[field] === '') {
        errors.push(`Row ${rowNumber}: Missing ${field}`);
      }
    });
    
    // Validate numeric fields
    const numericFields = ['registrations', 'orders', 'revenue'];
    numericFields.forEach(field => {
      if (row[field] && isNaN(parseFloat(row[field]))) {
        errors.push(`Row ${rowNumber}: ${field} must be a number`);
      }
    });
    
    // Validate referral code format
    if (row.referral_code && !/^[A-Z0-9]{6}$/.test(row.referral_code)) {
      errors.push(`Row ${rowNumber}: Referral code must be 6 characters (letters and numbers)`);
    }
  });
  
  return errors;
};

export const transformCSVToSRData = (csvData) => {
  return csvData.map((row, index) => {
    const registrations = parseInt(row.registrations) || 0;
    const orders = parseInt(row.orders) || 0;
    const revenue = parseFloat(row.revenue) || 0;
    
    // Generate performance history (mock data based on current stats)
    const generateHistory = (total, days = 7) => {
      const history = [];
      const avgPerDay = total / days;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const variation = (Math.random() - 0.5) * 0.4; // ±20% variation
        const value = Math.max(0, Math.round(avgPerDay * (1 + variation)));
        
        history.push({
          date: date.toISOString().split('T')[0],
          registrations: i === 0 ? total - history.reduce((sum, h) => sum + h.registrations, 0) : value,
          revenue: i === 0 ? revenue - history.reduce((sum, h) => sum + h.revenue, 0) : value * 5.5
        });
      }
      
      return history;
    };
    
    return {
      id: index + 1,
      name: row.name,
      referralCode: row.referral_code.toUpperCase(),
      profileImage: row.profile_image || `/src/assets/default-profile.jpg`,
      totalCustomersRegistered: registrations,
      totalOrders: orders,
      totalOrderValue: revenue,
      conversionRate: registrations > 0 ? ((orders / registrations) * 100).toFixed(1) : '0.0',
      performanceHistory: generateHistory(registrations),
      achievements: generateAchievements(registrations, orders, revenue),
      joinDate: row.join_date || new Date().toISOString().split('T')[0],
      phone: row.phone || '',
      email: row.email || '',
      location: row.location || ''
    };
  });
};

const generateAchievements = (registrations, orders, revenue) => {
  const achievements = [];
  
  if (registrations >= 50) achievements.push({ name: 'Registration Master', icon: '🏆', description: '50+ customer registrations' });
  if (registrations >= 25) achievements.push({ name: 'Growth Champion', icon: '📈', description: '25+ customer registrations' });
  if (registrations >= 10) achievements.push({ name: 'Rising Star', icon: '⭐', description: '10+ customer registrations' });
  
  if (orders >= 10) achievements.push({ name: 'Order Expert', icon: '🛒', description: '10+ successful orders' });
  if (orders >= 5) achievements.push({ name: 'Sales Pro', icon: '💼', description: '5+ successful orders' });
  
  if (revenue >= 100) achievements.push({ name: 'Revenue Leader', icon: '💰', description: '$100+ in revenue' });
  if (revenue >= 50) achievements.push({ name: 'Money Maker', icon: '💵', description: '$50+ in revenue' });
  
  const conversionRate = registrations > 0 ? (orders / registrations) * 100 : 0;
  if (conversionRate >= 20) achievements.push({ name: 'Conversion King', icon: '🎯', description: '20%+ conversion rate' });
  if (conversionRate >= 10) achievements.push({ name: 'Efficiency Expert', icon: '⚡', description: '10%+ conversion rate' });
  
  return achievements;
};

export const generateSampleCSV = () => {
  const headers = [
    'name',
    'referral_code', 
    'registrations',
    'orders',
    'revenue',
    'profile_image',
    'join_date',
    'phone',
    'email',
    'location'
  ];
  
  const sampleData = [
    [
      'Raaqiya Abdirahman Abdullaahi',
      '11D8A9',
      '11',
      '2',
      '29.55',
      '/src/assets/RaaqiyoMaalcoSR.jpg',
      '2024-01-15',
      '+252-61-234-5678',
      'raaqiya@maalco.com',
      'Mogadishu'
    ],
    [
      'Nimco Ahmed Mohamed',
      '6D155F',
      '18',
      '1',
      '26.75',
      '/src/assets/naciimoMaalcoSR.jpg',
      '2024-02-01',
      '+252-61-345-6789',
      'nimco@maalco.com',
      'Hargeisa'
    ],
    [
      'Fardowsa Ahmed Cilmi',
      '561D2C',
      '19',
      '1',
      '5.50',
      '/src/assets/FardowsoMaalcosr.jpg',
      '2024-01-20',
      '+252-61-456-7890',
      'fardowsa@maalco.com',
      'Bosaso'
    ]
  ];
  
  const csvContent = [headers.join(','), ...sampleData.map(row => row.join(','))].join('\n');
  return csvContent;
};


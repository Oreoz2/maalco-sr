// SR Data based on the performance report from August 14-19, 2025

import RaaqiyoImage from '../assets/RaaqiyoMaalcoSR.jpg';
import NaciimoImage from '../assets/naciimoMaalcoSR.jpg';
import FardowsoImage from '../assets/FardowsoMaalcosr.jpg';

export const srs = [
  {
    id: 1,
    name: "Raaqiya Abdirahman Abdullaahi",
    referralCode: "11D8A9",
    profileImage: RaaqiyoImage,
    totalCustomersRegistered: 11,
    totalOrders: 2,
    totalOrderValue: 29.55,
    dailyData: [
      { date: "2025-08-19", registrations: 10, orders: 0, orderValue: 0 },
      { date: "2025-08-18", registrations: 1, orders: 1, orderValue: 12.30 },
      { date: "2025-08-17", registrations: 0, orders: 1, orderValue: 17.25 },
      { date: "2025-08-16", registrations: 0, orders: 0, orderValue: 0 },
      { date: "2025-08-15", registrations: 0, orders: 0, orderValue: 0 },
      { date: "2025-08-14", registrations: 0, orders: 0, orderValue: 0 }
    ],
    achievements: ["Top Performer Today", "50+ Registrations Goal"]
  },
  {
    id: 2,
    name: "Nimco Ahmed Mohamed",
    referralCode: "6D155F",
    profileImage: NaciimoImage,
    totalCustomersRegistered: 18,
    totalOrders: 1,
    totalOrderValue: 26.75,
    dailyData: [
      { date: "2025-08-19", registrations: 4, orders: 0, orderValue: 0 },
      { date: "2025-08-18", registrations: 0, orders: 0, orderValue: 0 },
      { date: "2025-08-17", registrations: 4, orders: 1, orderValue: 26.75 },
      { date: "2025-08-16", registrations: 10, orders: 0, orderValue: 0 },
      { date: "2025-08-15", registrations: 4, orders: 0, orderValue: 0 },
      { date: "2025-08-14", registrations: 0, orders: 0, orderValue: 0 }
    ],
    achievements: ["Consistent Performer", "First Order Generated"]
  },
  {
    id: 3,
    name: "Fardowsa Ahmed Cilmi",
    referralCode: "561D2C",
    profileImage: FardowsoImage,
    totalCustomersRegistered: 19,
    totalOrders: 1,
    totalOrderValue: 5.50,
    dailyData: [
      { date: "2025-08-19", registrations: 4, orders: 0, orderValue: 0 },
      { date: "2025-08-18", registrations: 0, orders: 0, orderValue: 0 },
      { date: "2025-08-17", registrations: 3, orders: 1, orderValue: 5.50 },
      { date: "2025-08-16", registrations: 12, orders: 0, orderValue: 0 },
      { date: "2025-08-15", registrations: 0, orders: 0, orderValue: 0 },
      { date: "2025-08-14", registrations: 0, orders: 0, orderValue: 0 }
    ],
    achievements: ["Registration Champion", "Team Player"]
  }
];

export const customers = [
  {
    id: 1,
    name: "diini xassan cabdi",
    phone: "617545441",
    registrationDate: "2025-08-17",
    srReferralCode: "11D8A9",
    orders: [
      {
        id: 1,
        date: "2025-08-17",
        totalValue: 17.25
      }
    ]
  },
  {
    id: 2,
    name: "Farhia ibrahim elmi",
    phone: "613906229",
    registrationDate: "2025-08-18",
    srReferralCode: "11D8A9",
    orders: [
      {
        id: 2,
        date: "2025-08-18",
        totalValue: 12.30
      }
    ]
  },
  {
    id: 3,
    name: "muna Mohamed Hussein",
    phone: "614474845",
    registrationDate: "2025-08-17",
    srReferralCode: "6D155F",
    orders: [
      {
        id: 3,
        date: "2025-08-17",
        totalValue: 26.75
      }
    ]
  },
  {
    id: 4,
    name: "Ina asli",
    phone: "615684422",
    registrationDate: "2025-08-17",
    srReferralCode: "561D2C",
    orders: [
      {
        id: 4,
        date: "2025-08-17",
        totalValue: 5.50
      }
    ]
  }
];

// Helper functions
export const getTotalRegistrations = () => {
  return srs.reduce((total, sr) => total + sr.totalCustomersRegistered, 0);
};

export const getTotalOrders = () => {
  return srs.reduce((total, sr) => total + sr.totalOrders, 0);
};

export const getTotalOrderValue = () => {
  return srs.reduce((total, sr) => total + sr.totalOrderValue, 0);
};

export const getTopPerformers = (limit = 3) => {
  return [...srs]
    .sort((a, b) => {
      // Primary sort by registrations
      if (b.totalCustomersRegistered !== a.totalCustomersRegistered) {
        return b.totalCustomersRegistered - a.totalCustomersRegistered;
      }
      // Tie-breaker by orders
      return b.totalOrders - a.totalOrders;
    })
    .slice(0, limit);
};

export const getSRById = (id) => {
  return srs.find(sr => sr.id === parseInt(id));
};

export const getRegistrationTrend = (days = 7) => {
  const dates = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates.map(date => {
    const totalRegistrations = srs.reduce((total, sr) => {
      const dayData = sr.dailyData.find(d => d.date === date);
      return total + (dayData ? dayData.registrations : 0);
    }, 0);
    
    return {
      date,
      registrations: totalRegistrations
    };
  });
};

// Function to update SR data (for CSV import)
export const updateSRData = (newData) => {
  // Clear existing data and replace with new data
  srs.length = 0;
  srs.push(...newData);
};

// Function to get current SR data
export const getSRData = () => srs;


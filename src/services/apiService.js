// API service to replace hardcoded data
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3001/api';

class ApiService {
  // Get all SRs with performance data
  async getSRs(dateRange = 'all') {
    const response = await fetch(`${API_BASE_URL}/srs?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch SRs');
    }
    return response.json();
  }

  // Get single SR by ID with daily performance data
  async getSRById(id, dateRange = '30d') {
    const response = await fetch(`${API_BASE_URL}/srs/${id}?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch SR');
    }
    return response.json();
  }

  // Upload SR profile image
  async uploadSRImage(srId, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_BASE_URL}/srs/${srId}/upload-image`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    return response.json();
  }

  // Upload driver profile image
  async uploadDriverImage(driverId, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/upload-image`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload driver image');
    }
    return response.json();
  }

  // Upload CSR profile image
  async uploadCSRImage(csrId, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_BASE_URL}/csr/${csrId}/upload-image`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload CSR image');
    }
    return response.json();
  }

  // Upload packing staff profile image
  async uploadPackingImage(packerId, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_BASE_URL}/packing/${packerId}/upload-image`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload packing image');
    }
    return response.json();
  }

  // Get dashboard summary
  async getDashboardSummary(dateRange = '7d') {
    const response = await fetch(`${API_BASE_URL}/dashboard/summary?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard summary');
    }
    return response.json();
  }

  // Get trend data for charts
  async getTrends(dateRange = '7d') {
    const response = await fetch(`${API_BASE_URL}/dashboard/trends?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch trends');
    }
    return response.json();
  }

  // Get leaderboard data
  async getLeaderboard(sortBy = 'registrations', dateRange = '7d') {
    const response = await fetch(`${API_BASE_URL}/leaderboard?sortBy=${sortBy}&dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    return response.json();
  }

  // Export data
  async exportData(dateRange = '30d', format = 'csv') {
    const response = await fetch(`${API_BASE_URL}/export?dateRange=${dateRange}&format=${format}`);
    if (!response.ok) {
      throw new Error('Failed to export data');
    }

    if (format === 'csv') {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `sr-performance-${dateRange}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      return { success: true, message: 'File downloaded successfully' };
    } else {
      return response.json();
    }
  }

  // Helper functions that replicate the old srData.js exports
  async getTotalRegistrations(dateRange = 'all') {
    const summary = await this.getDashboardSummary(dateRange);
    return summary.totalRegistrations;
  }

  async getTotalOrders(dateRange = 'all') {
    const summary = await this.getDashboardSummary(dateRange);
    return summary.totalOrders;
  }

  async getTotalOrderValue(dateRange = 'all') {
    const summary = await this.getDashboardSummary(dateRange);
    return summary.totalOrderValue;
  }

  async getTopPerformers(limit = 3, sortBy = 'registrations', dateRange = 'all') {
    const leaderboard = await this.getLeaderboard(sortBy, dateRange);
    return leaderboard.slice(0, limit);
  }

  async getRegistrationTrend(days = 7) {
    const trends = await this.getTrends(`${days}d`);
    return trends.map(trend => ({
      date: trend.date,
      registrations: trend.registrations
    }));
  }

  // New Registration Tab API methods
  async getRegistrationSummary(dateRange = '30d') {
    const response = await fetch(`${API_BASE_URL}/registrations/summary?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch registration summary');
    }
    return response.json();
  }

  async getRegistrationTrends(dateRange = '30d') {
    const response = await fetch(`${API_BASE_URL}/registrations/trends?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch registration trends');
    }
    return response.json();
  }

  async getRegistrationSources(dateRange = '30d') {
    const response = await fetch(`${API_BASE_URL}/registrations/sources?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch registration sources');
    }
    return response.json();
  }

  // New Sales Tab API methods
  async getSalesSummary(dateRange = '30d') {
    const response = await fetch(`${API_BASE_URL}/sales/summary?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sales summary');
    }
    return response.json();
  }

  async getSalesTrends(dateRange = '30d') {
    const response = await fetch(`${API_BASE_URL}/sales/trends?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sales trends');
    }
    return response.json();
  }

  // ==========================================
  // DRIVERS DASHBOARD API METHODS
  // ==========================================

  async getDrivers(dateRange = '30d') {
    const response = await fetch(`${API_BASE_URL}/drivers?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch drivers');
    }
    return response.json();
  }

  async getDriverTrends(dateRange = '30d') {
    const response = await fetch(`${API_BASE_URL}/drivers/trends?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch driver trends');
    }
    return response.json();
  }

  // ==========================================
  // CSR DASHBOARD API METHODS
  // ==========================================

  async getCSRStaff(dateRange = '30d') {
    const response = await fetch(`${API_BASE_URL}/csr?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch CSR staff');
    }
    return response.json();
  }

  async getCSRTrends(dateRange = '30d') {
    const response = await fetch(`${API_BASE_URL}/csr/trends?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch CSR trends');
    }
    return response.json();
  }

  // ==========================================
  // PACKING DASHBOARD API METHODS
  // ==========================================

  async getPackingStaff(dateRange = '30d') {
    const response = await fetch(`${API_BASE_URL}/packing?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch packing staff');
    }
    return response.json();
  }

  async getPackingTrends(dateRange = '30d') {
    const response = await fetch(`${API_BASE_URL}/packing/trends?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch packing trends');
    }
    return response.json();
  }

  // ==========================================
  // ENHANCED API METHODS - Phase 2, 5 & 6
  // ==========================================

  // CSR Enhanced Methods
  async getCSRHourlyPerformance(dateRange = '30d') {
    const response = await fetch(`${API_BASE_URL}/csr/hourly-performance?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch CSR hourly performance');
    }
    return response.json();
  }

  async getCSRInteractionBreakdown(csrId, dateRange = '30d') {
    const response = await fetch(`${API_BASE_URL}/csr/${csrId}/interaction-breakdown?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch CSR interaction breakdown');
    }
    return response.json();
  }

  // Packing Enhanced Methods
  async getPackingTimingBreakdown(packerId, dateRange = '30d') {
    const response = await fetch(`${API_BASE_URL}/packing/${packerId}/timing-breakdown?dateRange=${dateRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch packing timing breakdown');
    }
    return response.json();
  }

  // ==========================================
  // LEADERBOARD API METHODS - Phase 5
  // ==========================================

  async getCSRLeaderboard(dateRange = '30d', sortBy = 'interactions') {
    const response = await fetch(`${API_BASE_URL}/leaderboard/csr?dateRange=${dateRange}&sortBy=${sortBy}`);
    if (!response.ok) {
      throw new Error('Failed to fetch CSR leaderboard');
    }
    return response.json();
  }

  async getDriverLeaderboard(dateRange = '30d', sortBy = 'deliveries') {
    const response = await fetch(`${API_BASE_URL}/leaderboard/drivers?dateRange=${dateRange}&sortBy=${sortBy}`);
    if (!response.ok) {
      throw new Error('Failed to fetch driver leaderboard');
    }
    return response.json();
  }

  async getPackingLeaderboard(dateRange = '30d', sortBy = 'packed') {
    const response = await fetch(`${API_BASE_URL}/leaderboard/packing?dateRange=${dateRange}&sortBy=${sortBy}`);
    if (!response.ok) {
      throw new Error('Failed to fetch packing leaderboard');
    }
    return response.json();
  }
}

export default new ApiService();
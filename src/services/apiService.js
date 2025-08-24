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
}

export default new ApiService();
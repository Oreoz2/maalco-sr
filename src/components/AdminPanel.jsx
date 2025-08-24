import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { 
  Shield, 
  UserPlus, 
  Users, 
  ShoppingCart, 
  Upload,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Settings,
  Database,
  TrendingUp,
  FileSpreadsheet,
  Download,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { srs, updateSRData } from '../data/srData';
import { parseCSV, validateSRData, transformCSVToSRData, generateSampleCSV } from '../utils/csvParser';

function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [alerts, setAlerts] = useState([]);

  // Form states
  const [srForm, setSrForm] = useState({
    name: '',
    referralCode: '',
    profileImage: null
  });

  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    registrationDate: new Date().toISOString().split('T')[0],
    srReferralCode: ''
  });

  const [orderForm, setOrderForm] = useState({
    customerPhone: '',
    orderValue: '',
    deliveryCharge: ''
  });

  // CSV Upload states
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [csvPreview, setCsvPreview] = useState([]);
  const [isProcessingCSV, setIsProcessingCSV] = useState(false);

  const ADMIN_PASSWORD = 'maalco2025'; // In production, this should be properly secured

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError('');
      addAlert('Successfully logged in to admin panel', 'success');
    } else {
      setLoginError('Invalid password. Please try again.');
    }
  };

  const addAlert = (message, type = 'info') => {
    const newAlert = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setAlerts(prev => [newAlert, ...prev.slice(0, 4)]); // Keep only last 5 alerts
    
    // Auto-remove alert after 5 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== newAlert.id));
    }, 5000);
  };

  const handleSRSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would make an API call
    console.log('New SR:', srForm);
    addAlert(`SR ${srForm.name} added successfully`, 'success');
    setSrForm({ name: '', referralCode: '', profileImage: null });
  };

  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would make an API call
    console.log('New Customer:', customerForm);
    addAlert(`Customer ${customerForm.name} registered successfully`, 'success');
    setCustomerForm({
      name: '',
      phone: '',
      registrationDate: new Date().toISOString().split('T')[0],
      srReferralCode: ''
    });
  };

  const handleOrderSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would make an API call
    const totalValue = parseFloat(orderForm.orderValue) + parseFloat(orderForm.deliveryCharge || 0);
    console.log('New Order:', { ...orderForm, totalValue });
    addAlert(`Order for $${totalValue.toFixed(2)} added successfully`, 'success');
    setOrderForm({
      customerPhone: '',
      orderValue: '',
      deliveryCharge: ''
    });
  };

  // CSV Upload handlers
  const handleCSVFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setCsvErrors([]);
      setCsvData([]);
      setCsvPreview([]);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csvText = event.target.result;
          const parsedData = parseCSV(csvText);
          const errors = validateSRData(parsedData);
          
          setCsvData(parsedData);
          setCsvErrors(errors);
          setCsvPreview(parsedData.slice(0, 5)); // Show first 5 rows for preview
          
          if (errors.length === 0) {
            addAlert('CSV file parsed successfully! Ready to import.', 'success');
          } else {
            addAlert(`CSV file has ${errors.length} validation errors. Please fix them before importing.`, 'error');
          }
        } catch (error) {
          addAlert('Error parsing CSV file. Please check the format.', 'error');
          setCsvErrors(['Invalid CSV format']);
        }
      };
      reader.readAsText(file);
    } else {
      addAlert('Please select a valid CSV file', 'error');
    }
  };

  const handleCSVImport = async () => {
    if (csvErrors.length > 0) {
      addAlert('Please fix validation errors before importing', 'error');
      return;
    }

    setIsProcessingCSV(true);
    
    try {
      // Transform CSV data to SR format
      const transformedData = transformCSVToSRData(csvData);
      
      // Update the SR data (in a real app, this would be an API call)
      updateSRData(transformedData);
      
      addAlert(`Successfully imported ${transformedData.length} SR records!`, 'success');
      
      // Reset CSV upload state
      setCsvFile(null);
      setCsvData([]);
      setCsvErrors([]);
      setCsvPreview([]);
      
      // Reset file input
      const fileInput = document.getElementById('csv-upload');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      addAlert('Error importing CSV data. Please try again.', 'error');
    } finally {
      setIsProcessingCSV(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'maalco-sr-data-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    addAlert('Sample CSV template downloaded!', 'success');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Admin Access
              </CardTitle>
              <p className="text-gray-600">
                Enter password to access the admin panel
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin password"
                      className="pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {loginError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      {loginError}
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                  <Shield className="w-4 h-4 mr-2" />
                  Access Admin Panel
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>Demo password: <code className="bg-gray-100 px-2 py-1 rounded">maalco2025</code></p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="w-8 h-8 mr-3 text-red-600" />
            Admin Panel
          </h1>
          <p className="text-gray-600 mt-1">Data entry and management dashboard</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setIsAuthenticated(false);
            setPassword('');
            addAlert('Logged out successfully', 'info');
          }}
          className="text-red-600 border-red-600 hover:bg-red-50"
        >
          <Shield className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </motion.div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {alerts.map((alert) => (
            <Alert
              key={alert.id}
              className={`${
                alert.type === 'success' 
                  ? 'border-green-200 bg-green-50' 
                  : alert.type === 'error'
                  ? 'border-red-200 bg-red-50'
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              <CheckCircle className={`h-4 w-4 ${
                alert.type === 'success' ? 'text-green-600' : 
                alert.type === 'error' ? 'text-red-600' : 'text-blue-600'
              }`} />
              <AlertDescription className={`${
                alert.type === 'success' ? 'text-green-700' : 
                alert.type === 'error' ? 'text-red-700' : 'text-blue-700'
              }`}>
                <span className="font-medium">{alert.timestamp}</span> - {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4" />
              <span>CSV Import</span>
            </TabsTrigger>
            <TabsTrigger value="sr" className="flex items-center space-x-2">
              <UserPlus className="w-4 h-4" />
              <span>Add SR</span>
            </TabsTrigger>
            <TabsTrigger value="customer" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Add Customer</span>
            </TabsTrigger>
            <TabsTrigger value="order" className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span>Add Order</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-700">
                    Total SRs
                  </CardTitle>
                  <Users className="h-5 w-5 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-800">{srs.length}</div>
                  <p className="text-xs text-red-600 mt-1">Active representatives</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-700">
                    Total Registrations
                  </CardTitle>
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-800">
                    {srs.reduce((sum, sr) => sum + sr.totalCustomersRegistered, 0)}
                  </div>
                  <p className="text-xs text-yellow-600 mt-1">Customer registrations</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">
                    Total Revenue
                  </CardTitle>
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">
                    ${srs.reduce((sum, sr) => sum + sr.totalOrderValue, 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-green-600 mt-1">Generated revenue</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Current SRs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {srs.map((sr) => (
                    <div key={sr.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={sr.profileImage}
                        alt={sr.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold">{sr.name}</h4>
                        <p className="text-sm text-gray-600">Code: {sr.referralCode}</p>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium">{sr.totalCustomersRegistered} registrations</div>
                        <div className="text-gray-600">${sr.totalOrderValue.toFixed(2)} revenue</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CSV Import Tab */}
          <TabsContent value="csv" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSpreadsheet className="w-5 h-5 mr-2 text-blue-600" />
                  Import SR Data from CSV
                </CardTitle>
                <p className="text-gray-600">Upload a CSV file to update all SR statistics at once</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Download Template */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <h4 className="font-medium text-blue-800">Need a template?</h4>
                    <p className="text-sm text-blue-600">Download the CSV template with the correct format and sample data</p>
                  </div>
                  <Button
                    onClick={downloadSampleCSV}
                    variant="outline"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="csv-upload">Upload CSV File</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleCSVFileChange}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-gray-500">
                    CSV should contain: name, referral_code, registrations, orders, revenue, profile_image, join_date, phone, email, location
                  </p>
                </div>

                {/* Validation Errors */}
                {csvErrors.length > 0 && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      <div className="font-medium mb-2">Validation Errors ({csvErrors.length}):</div>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {csvErrors.slice(0, 10).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {csvErrors.length > 10 && (
                          <li className="font-medium">... and {csvErrors.length - 10} more errors</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Preview */}
                {csvPreview.length > 0 && csvErrors.length === 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-green-800">Preview (First 5 rows):</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Code</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Registrations</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Orders</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.map((row, index) => (
                            <tr key={index} className="border-t border-gray-200">
                              <td className="px-4 py-2 text-sm">{row.name}</td>
                              <td className="px-4 py-2 text-sm font-mono">{row.referral_code}</td>
                              <td className="px-4 py-2 text-sm">{row.registrations}</td>
                              <td className="px-4 py-2 text-sm">{row.orders}</td>
                              <td className="px-4 py-2 text-sm">${row.revenue}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Import Button */}
                {csvData.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <h4 className="font-medium text-green-800">Ready to Import</h4>
                      <p className="text-sm text-green-600">
                        {csvData.length} SR records will be imported. This will update all existing data.
                      </p>
                    </div>
                    <Button
                      onClick={handleCSVImport}
                      disabled={csvErrors.length > 0 || isProcessingCSV}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isProcessingCSV ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Import Data
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add SR Tab */}
          <TabsContent value="sr">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 text-red-600" />
                  Add New SR Profile
                </CardTitle>
                <p className="text-gray-600">Create a new Senior Representative profile</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSRSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="sr-name">SR Full Name *</Label>
                      <Input
                        id="sr-name"
                        value={srForm.name}
                        onChange={(e) => setSrForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter full name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sr-code">Referral Code *</Label>
                      <Input
                        id="sr-code"
                        value={srForm.referralCode}
                        onChange={(e) => setSrForm(prev => ({ ...prev, referralCode: e.target.value.toUpperCase() }))}
                        placeholder="e.g., ABC123"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sr-image">Profile Image</Label>
                    <Input
                      id="sr-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSrForm(prev => ({ ...prev, profileImage: e.target.files[0] }))}
                    />
                    <p className="text-sm text-gray-500">Upload a professional profile photo</p>
                  </div>

                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create SR Profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Customer Tab */}
          <TabsContent value="customer">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-yellow-600" />
                  Register New Customer
                </CardTitle>
                <p className="text-gray-600">Add a new customer registration</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCustomerSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="customer-name">Customer Name *</Label>
                      <Input
                        id="customer-name"
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter customer name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer-phone">Phone Number *</Label>
                      <Input
                        id="customer-phone"
                        value={customerForm.phone}
                        onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="registration-date">Registration Date *</Label>
                      <Input
                        id="registration-date"
                        type="date"
                        value={customerForm.registrationDate}
                        onChange={(e) => setCustomerForm(prev => ({ ...prev, registrationDate: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sr-referral">SR Referral Code *</Label>
                      <Select
                        value={customerForm.srReferralCode}
                        onValueChange={(value) => setCustomerForm(prev => ({ ...prev, srReferralCode: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select SR" />
                        </SelectTrigger>
                        <SelectContent>
                          {srs.map((sr) => (
                            <SelectItem key={sr.id} value={sr.referralCode}>
                              {sr.referralCode} - {sr.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700">
                    <Users className="w-4 h-4 mr-2" />
                    Register Customer
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Order Tab */}
          <TabsContent value="order">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2 text-green-600" />
                  Add New Order
                </CardTitle>
                <p className="text-gray-600">Record a new customer order</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleOrderSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="customer-phone-order">Customer Phone Number *</Label>
                    <Input
                      id="customer-phone-order"
                      value={orderForm.customerPhone}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                      placeholder="Enter customer phone number"
                      required
                    />
                    <p className="text-sm text-gray-500">This will link the order to the customer and their referring SR</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="order-value">Order Value *</Label>
                      <Input
                        id="order-value"
                        type="number"
                        step="0.01"
                        min="0"
                        value={orderForm.orderValue}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, orderValue: e.target.value }))}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="delivery-charge">Delivery Charge</Label>
                      <Input
                        id="delivery-charge"
                        type="number"
                        step="0.01"
                        min="0"
                        value={orderForm.deliveryCharge}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, deliveryCharge: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {orderForm.orderValue && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2">Order Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Order Value:</span>
                          <span>${parseFloat(orderForm.orderValue || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery Charge:</span>
                          <span>${parseFloat(orderForm.deliveryCharge || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-medium text-green-800 border-t border-green-300 pt-1">
                          <span>Total Order Value:</span>
                          <span>${(parseFloat(orderForm.orderValue || 0) + parseFloat(orderForm.deliveryCharge || 0)).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add Order
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

export default AdminPanel;


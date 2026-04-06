import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AddProject from './pages/AddProject';
import AddClientQuotation from './pages/AddClientQuotation';

// --- IMPORT SEMUA COMPONENT VENDOR DISINI ---
import VendorMenu from './pages/VendorMenu'; 
import AddVendor from './pages/AddVendor';
import ExistingVendors from './pages/ExistingVendors'; 
import AddItem from './pages/AddItem'; 
import ExistingItems from './pages/ExistingItems';

import AddSupplierQuotation from './pages/AddSupplierQuotation';

function App() {
  return (
    <Router>
      <div className="App font-sans">
        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* --- PROTECTED ROUTES (GENERAL) --- */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* --- MARKETING MODULE --- */}
          <Route 
            path="/add-project" 
            element={
              <ProtectedRoute allowRoles={['Marketing', 'Admin']}>
                <AddProject />
              </ProtectedRoute>
            } 
          />

          {/* --- PROCUREMENT MODULE (ALUR VENDOR) --- */}
          
          {/* 1. Sub-Menu: Ini yang lo klik dari Dashboard (Card Vendor & Items) */}
          <Route 
            path="/vendor" 
            element={
              <ProtectedRoute allowRoles={['Procurement', 'Admin']}>
                <VendorMenu />
              </ProtectedRoute>
            } 
          />

          {/* 2. Add Vendor Baru */}
          <Route 
            path="/add-vendor" 
            element={
              <ProtectedRoute allowRoles={['Procurement', 'Admin']}>
                <AddVendor />
              </ProtectedRoute>
            } 
          />

          {/* 3. Existing Vendor List */}
          <Route 
            path="/existing-vendors" 
            element={
              <ProtectedRoute allowRoles={['Procurement', 'Admin']}>
                <ExistingVendors />
              </ProtectedRoute>
            } 
          />

          {/* 4. Add Item */}
          <Route 
            path="/add-item" 
            element={
              <ProtectedRoute allowRoles={['Procurement', 'Admin']}>
                <AddItem />
              </ProtectedRoute>
            } 
          />

          {/* 5. Existing Item List */}
          <Route 
            path="/existing-items" 
            element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}>
                <ExistingItems />
              </ProtectedRoute>
            } 
          />

           {/* Add Supplier Quotation */} 
            <Route 
              path="/supplier-quote" 
              element={
                <ProtectedRoute allowRoles={['Procurement', 'Admin']}>
                  <AddSupplierQuotation />
                </ProtectedRoute>
              } 
            />

            <Route path="/client-quote" 
              element={<AddClientQuotation />} />

          {/* Catch-all Route */}
          <Route path="*" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
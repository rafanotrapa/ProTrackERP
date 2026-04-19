import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- CORE & AUTH COMPONENTS ---
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// --- ADMIN MODULE ---
import UserManagement from './pages/UserManagement';
import SystemLogs from './pages/SystemLogs';

// --- MARKETING MODULE ---
import AddProject from './pages/AddProject';
import AddClientQuotation from './pages/AddClientQuotation';
import AddClientInvoice from './pages/AddClientInvoice'; 

// --- PROCUREMENT MODULE ---
import VendorMenu from './pages/VendorMenu'; 
import AddVendor from './pages/AddVendor';
import ExistingVendors from './pages/ExistingVendors'; 
import AddSupplierQuotation from './pages/AddSupplierQuotation'; 
import InvoiceSubmission from './pages/SupplierInvoice'; 
import CreatePO from './pages/CreatePO';           // <-- NEW IMPORT
import ReceiveQCGoods from './pages/ReceiveQCGoods';  // <-- IMPORT YANG BENAR UNTUK QC

// --- MONITORING & TIMELINE MODULE ---
import ProjectList from './pages/ProjectList';
import ProjectTimeline from './pages/ProjectTimeline';

function App() {
  return (
    <Router>
      <div className="App font-sans">
        <Routes>
          
          {/* 1. PUBLIC ROUTES */}
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* 2. GENERAL DASHBOARD */}
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
          />

          {/* 3. ADMIN & AUDIT MODULE */}
          <Route 
            path="/register" 
            element={<ProtectedRoute allowRoles={['Admin']}><Register /></ProtectedRoute>} 
          />
          <Route 
            path="/manage-users" 
            element={<ProtectedRoute allowRoles={['Admin']}><UserManagement /></ProtectedRoute>} 
          />
          <Route 
            path="/logs" 
            element={<ProtectedRoute allowRoles={['Admin', 'Manager', 'Owner']}><SystemLogs /></ProtectedRoute>} 
          />

          {/* 4. MARKETING MODULE */}
          <Route 
            path="/add-project" 
            element={<ProtectedRoute allowRoles={['Marketing', 'Admin', 'Manager', 'Owner']}><AddProject /></ProtectedRoute>} 
          />
          <Route 
            path="/client-quote" 
            element={<ProtectedRoute allowRoles={['Marketing', 'Admin', 'Manager', 'Owner']}><AddClientQuotation /></ProtectedRoute>} 
          />
          <Route 
            path="/client-invoice" 
            element={<ProtectedRoute allowRoles={['Marketing', 'Admin', 'Manager', 'Owner']}><AddClientInvoice /></ProtectedRoute>} 
          />

          {/* 5. PROCUREMENT MODULE */}
          <Route 
            path="/vendor" 
            element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Manager', 'Owner']}><VendorMenu /></ProtectedRoute>} 
          />
          <Route 
            path="/add-vendor" 
            element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><AddVendor /></ProtectedRoute>} 
          />
          <Route 
            path="/existing-vendors" 
            element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Manager', 'Owner']}><ExistingVendors /></ProtectedRoute>} 
          />
          <Route 
            path="/add-supplier-quotation" 
            element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><AddSupplierQuotation /></ProtectedRoute>} 
          />
          <Route 
            path="/upload-to-finance" 
            element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><InvoiceSubmission /></ProtectedRoute>} 
          />
          
          {/* --- NEW PROCUREMENT ROUTES (SUDAH DISINKRONKAN DENGAN DASHBOARD) --- */}
          <Route 
            path="/create-po" 
            element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><CreatePO /></ProtectedRoute>} 
          />
          <Route 
            path="/receive-qc" 
            element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><ReceiveQCGoods /></ProtectedRoute>} 
          />

          {/* 6. MONITORING & TIMELINE */}
          <Route 
            path="/timeline" 
            element={<ProtectedRoute allowRoles={['Marketing', 'Procurement', 'Finance', 'Admin', 'Manager', 'Owner']}><ProjectList /></ProtectedRoute>} 
          />
          <Route 
            path="/timeline/:projectId" 
            element={<ProtectedRoute allowRoles={['Marketing', 'Procurement', 'Finance', 'Admin', 'Manager', 'Owner']}><ProjectTimeline /></ProtectedRoute>} 
          />

          {/* 7. OWNER & FINANCE INSIGHT */}
          <Route 
            path="/owner-insight" 
            element={<ProtectedRoute allowRoles={['Owner', 'Admin']}><div className="p-20 text-center font-black italic uppercase text-slate-300">Executive Summary Insight Module</div></ProtectedRoute>} 
          />

          {/* 8. CATCH-ALL */}
          <Route path="*" element={<Login />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
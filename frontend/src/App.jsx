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
import InputPayment from './pages/InputPayment';

// --- PROCUREMENT & LOGISTICS MODULE ---
import VendorMenu from './pages/VendorMenu'; 
import AddVendor from './pages/AddVendor';
import ExistingVendors from './pages/ExistingVendors'; 
import AddSupplierQuotation from './pages/AddSupplierQuotation'; 
import InvoiceSubmission from './pages/SupplierInvoice'; 
import CreatePO from './pages/CreatePO';           
import ReceiveQCGoods from './pages/ReceiveQCGoods';  
import DeliveryManagement from './pages/DeliveryManagement'; 

import SupplierPayment from './pages/SupplierPayment';
import FinancialReport from './pages/financialReport';
import PaymentVerification from './pages/PaymentVerification';
import PaymentVerifyDetail from './pages/PaymentVerifyDetail';

// --- MONITORING & TIMELINE MODULE ---
import ProjectList from './pages/ProjectList';
import ProjectTimeline from './pages/ProjectTimeline';

// --- MANAGEMENT MODULE (NEW) ---
import SupplierApproval from './pages/SupplierApproval';
import QuotationApproval from './pages/QuotationApproval';
import QuotationDetailReview from './pages/QuotationDetailReview';
import ClientQuotationApproval from './pages/ClientQuotationApproval';
import ClientQuotationDetailReview from './pages/ClientQuotationDetailReview';

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
            element={<ProtectedRoute allowRoles={['Admin', 'Management', 'Owner']}><SystemLogs /></ProtectedRoute>} 
          />

          {/* 4. MARKETING & FINANCE MODULE (COMBINED ACCESS) */}
          <Route 
            path="/add-project" 
            element={<ProtectedRoute allowRoles={['Marketing', 'Admin', 'Management', 'Owner']}><AddProject /></ProtectedRoute>} 
          />
          <Route 
            path="/client-quote" 
            element={<ProtectedRoute allowRoles={['Marketing', 'Admin', 'Management', 'Owner']}><AddClientQuotation /></ProtectedRoute>} 
          />
          
          {/* FIX: GABUNGKAN ROLE DISINI BIAR FINANCE GAK MENTAL */}
          <Route path="/create-invoice" element={<ProtectedRoute allowRoles={['Marketing', 'Admin']}><AddClientInvoice /></ProtectedRoute>} />
          
          <Route 
            path="/input-payment" 
            element={<ProtectedRoute allowRoles={['Marketing', 'Admin']}><InputPayment /></ProtectedRoute>} 
          />



          {/* 5. PROCUREMENT & LOGISTICS MODULE */}
          <Route 
            path="/vendor" 
            element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']}><VendorMenu /></ProtectedRoute>} 
          />
          <Route 
            path="/add-vendor" 
            element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><AddVendor /></ProtectedRoute>} 
          />
          <Route 
            path="/existing-vendors" 
            element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']}><ExistingVendors /></ProtectedRoute>} 
          />
          <Route 
            path="/add-supplier-quotation" 
            element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><AddSupplierQuotation /></ProtectedRoute>} 
          />
          <Route 
            path="/upload-to-finance" 
            element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><InvoiceSubmission /></ProtectedRoute>} 
          />
          
          <Route 
            path="/create-po" 
            element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><CreatePO /></ProtectedRoute>} 
          />
          <Route 
            path="/receive-qc" 
            element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><ReceiveQCGoods /></ProtectedRoute>} 
          />
          <Route 
            path="/delivery-management" 
            element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><DeliveryManagement /></ProtectedRoute>} 
          />

          {/* 6. MONITORING & TIMELINE */}
          <Route 
            path="/timeline" 
            element={<ProtectedRoute allowRoles={['Marketing', 'Procurement', 'Finance', 'Admin', 'Management', 'Owner']}><ProjectList /></ProtectedRoute>} 
          />
          <Route 
            path="/timeline/:projectId" 
            element={<ProtectedRoute allowRoles={['Marketing', 'Procurement', 'Finance', 'Admin', 'Management', 'Owner']}><ProjectTimeline /></ProtectedRoute>} 
          />

          {/* 7. OWNER & FINANCE INSIGHT */}
          <Route 
            path="/owner-insight" 
            element={<ProtectedRoute allowRoles={['Owner', 'Admin']}><div className="p-20 text-center font-black italic uppercase text-slate-300">Executive Summary Insight Module</div></ProtectedRoute>} 
          />
          <Route 
             path="/supplier-payment" 
             element={<ProtectedRoute allowRoles={['Finance', 'Admin']}><SupplierPayment /></ProtectedRoute>} 
          />
          <Route 
            path="/financial-report" 
            element={<ProtectedRoute allowRoles={['Finance', 'Owner', 'Admin']}><FinancialReport /></ProtectedRoute>} 
          />

          <Route 
            path="/verify-payment" 
            element={<ProtectedRoute allowRoles={['Finance', 'Admin',]}><PaymentVerification /></ProtectedRoute>} 
          />

          <Route 
            path="/verify-payment/:id" 
            element={<ProtectedRoute allowRoles={['Finance', 'Admin']}><PaymentVerifyDetail /></ProtectedRoute>} 
          />

          {/* 8. MANAGEMENT APPROVAL MODULE */}
          <Route 
            path="/approve-supplier" 
            element={<ProtectedRoute allowRoles={['Management', 'Admin']}><SupplierApproval /></ProtectedRoute>} 
          />

          <Route 
            path="/quotation-approval" 
            element={<ProtectedRoute allowRoles={['Management', 'Admin']}><QuotationApproval /></ProtectedRoute>} 
          />

          <Route 
            path="/quotation-approval/:id" 
            element={<ProtectedRoute allowRoles={['Management', 'Admin']}><QuotationDetailReview /></ProtectedRoute>} 
          />

          
          <Route path="/client-quotation-approval" element={<ProtectedRoute allowRoles={['Management', 'Admin']}><ClientQuotationApproval /></ProtectedRoute>} />
          
          <Route 
            path="/client-quotation-approval/:id" 
            element={<ProtectedRoute allowRoles={['Management', 'Admin']}><ClientQuotationDetailReview /></ProtectedRoute>} 
          />

          {/* 9. CATCH-ALL */}
          <Route path="*" element={<Login />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
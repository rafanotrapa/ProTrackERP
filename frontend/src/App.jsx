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
import QuotationCenter from './pages/QuotationCenter';
import QuotationLog from './pages/QuotationLog';
import QuotationLogDetail from './pages/QuotationLogDetail';
import InvoiceCenter from './pages/InvoiceCenter';
import InvoiceLog from './pages/InvoiceLog';
import InvoiceLogDetail from './pages/InvoiceLogDetail';

// --- PROCUREMENT & LOGISTICS MODULE ---
import VendorMenu from './pages/VendorMenu'; 
import AddVendor from './pages/AddVendor';
import ExistingVendors from './pages/ExistingVendors'; 

import SupplierQuotationMenu from './pages/SupplierQuotationMenu';
import SupplierQuotationRecord from './pages/SupplierQuotationRecord';
import AddSupplierQuotation from './pages/AddSupplierQuotation'; 

import POMenu from './pages/POMenu';
import PORecord from './pages/PORecord';
import CreatePO from './pages/CreatePO';           

// --- NEW SUPPLIER INVOICE MODULES ---
import SupplierInvoiceMenu from './pages/SupplierInvoiceMenu';
import SupplierInvoiceRecord from './pages/SupplierInvoiceRecord';
import InvoiceSubmission from './pages/SupplierInvoice'; 
// ------------------------------------

import ReceiveQCGoods from './pages/ReceiveQCGoods';  
import DeliveryManagement from './pages/DeliveryManagement'; 

import SupplierPayment from './pages/SupplierPayment';
import FinancialReport from './pages/financialReport';
import PaymentVerification from './pages/PaymentVerification';
import PaymentVerifyDetail from './pages/PaymentVerifyDetail';
import ProjectBilling from './pages/ProjectBilling';
import ProjectBillingDetail from './pages/ProjectBillingDetail';
import FinanceInputPayment from './pages/FinanceInputPayment';
import SupplierPaymentDetail from './pages/SupplierPaymentDetail';

// --- MONITORING & TIMELINE MODULE ---
import ProjectList from './pages/ProjectList';
import ProjectTimeline from './pages/ProjectTimeline';

// --- MANAGEMENT MODULE (NEW) ---
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
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* 3. ADMIN & AUDIT MODULE */}
          <Route path="/register" element={<ProtectedRoute allowRoles={['Admin']}><Register /></ProtectedRoute>} />
          <Route path="/manage-users" element={<ProtectedRoute allowRoles={['Admin']}><UserManagement /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute allowRoles={['Admin', 'Management', 'Owner']}><SystemLogs /></ProtectedRoute>} />

          {/* 4. MARKETING & FINANCE MODULE (COMBINED ACCESS) */}
          <Route path="/add-project" element={<ProtectedRoute allowRoles={['Marketing', 'Admin', 'Management', 'Owner']}><AddProject /></ProtectedRoute>} />
          <Route path="/client-quote" element={<ProtectedRoute allowRoles={['Marketing', 'Admin', 'Management', 'Owner']}><AddClientQuotation /></ProtectedRoute>} />
          <Route path="/create-invoice" element={<ProtectedRoute allowRoles={['Marketing', 'Admin']}><AddClientInvoice /></ProtectedRoute>} />
          <Route path="/input-payment" element={<ProtectedRoute allowRoles={['Marketing', 'Admin']}><InputPayment /></ProtectedRoute>} />
          <Route path="/quotation-center" element={<ProtectedRoute allowRoles={['Marketing', 'Admin']}><QuotationCenter /></ProtectedRoute>} />
          <Route path="/quotation-log" element={<ProtectedRoute allowRoles={['Marketing', 'Admin']}><QuotationLog /></ProtectedRoute>} />
          <Route path="/quotation-log-detail/:id" element={<ProtectedRoute allowRoles={['Marketing', 'Admin']}><QuotationLogDetail /></ProtectedRoute>} />
          <Route path="/invoice-center" element={<ProtectedRoute allowRoles={['Marketing', 'Admin', 'Finance']}><InvoiceCenter /></ProtectedRoute>} />
          <Route path="/invoice-log" element={<ProtectedRoute allowRoles={['Marketing', 'Admin', 'Finance']}><InvoiceLog /></ProtectedRoute>} />
          <Route path="/invoice-log-detail/:id" element={<ProtectedRoute allowRoles={['Marketing', 'Admin', 'Finance']}><InvoiceLogDetail /></ProtectedRoute>} />

          {/* 5. PROCUREMENT & LOGISTICS MODULE */}
          <Route path="/vendor" element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']}><VendorMenu /></ProtectedRoute>} />
          <Route path="/add-vendor" element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><AddVendor /></ProtectedRoute>} />
          <Route path="/existing-vendors" element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']}><ExistingVendors /></ProtectedRoute>} />
          
          <Route path="/supplier-quotation-menu" element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']}><SupplierQuotationMenu /></ProtectedRoute>} />
          <Route path="/supplier-quotation-record" element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']}><SupplierQuotationRecord /></ProtectedRoute>} />
          <Route path="/add-supplier-quotation" element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><AddSupplierQuotation /></ProtectedRoute>} />
          
          <Route path="/po-menu" element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']}><POMenu /></ProtectedRoute>} />
          <Route path="/po-record" element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']}><PORecord /></ProtectedRoute>} />
          <Route path="/create-po" element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><CreatePO /></ProtectedRoute>} />
          
          {/* --- SUPPLIER INVOICE ROUTES --- */}
          <Route path="/supplier-invoice-menu" element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']}><SupplierInvoiceMenu /></ProtectedRoute>} />
          <Route path="/supplier-invoice-record" element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']}><SupplierInvoiceRecord /></ProtectedRoute>} />
          <Route path="/upload-to-finance" element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><InvoiceSubmission /></ProtectedRoute>} />
          {/* ------------------------------- */}

          <Route path="/receive-qc" element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><ReceiveQCGoods /></ProtectedRoute>} />
          <Route path="/delivery-management" element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><DeliveryManagement /></ProtectedRoute>} />

          {/* 6. MONITORING & TIMELINE */}
          <Route path="/timeline" element={<ProtectedRoute allowRoles={['Marketing', 'Owner']}><ProjectList /></ProtectedRoute>} />
          <Route path="/timeline/:projectId" element={<ProtectedRoute allowRoles={['Marketing', 'Owner']}><ProjectTimeline /></ProtectedRoute>} />

          {/* 7. OWNER & FINANCE INSIGHT */}
          <Route path="/owner-insight" element={<ProtectedRoute allowRoles={['Owner', 'Admin']}><div className="p-20 text-center font-black italic uppercase text-slate-300">Executive Summary Insight Module</div></ProtectedRoute>} />
          <Route path="/supplier-payment" element={<ProtectedRoute allowRoles={['Finance', 'Admin']}><SupplierPayment /></ProtectedRoute>} />
          <Route path="/financial-report" element={<ProtectedRoute allowRoles={['Finance', 'Owner', 'Admin']}><FinancialReport /></ProtectedRoute>} />
          <Route path="/verify-payment" element={<ProtectedRoute allowRoles={['Finance', 'Admin']}><PaymentVerification /></ProtectedRoute>} />
          <Route path="/verify-payment/:id" element={<ProtectedRoute allowRoles={['Finance', 'Admin']}><PaymentVerifyDetail /></ProtectedRoute>} />

          {/* 8. MANAGEMENT APPROVAL MODULE */}
          <Route path="/quotation-approval" element={<ProtectedRoute allowRoles={['Management', 'Admin']}><QuotationApproval /></ProtectedRoute>} />
          <Route path="/quotation-approval/:id" element={<ProtectedRoute allowRoles={['Management', 'Admin']}><QuotationDetailReview /></ProtectedRoute>} />
          <Route path="/client-quotation-approval" element={<ProtectedRoute allowRoles={['Management', 'Admin']}><ClientQuotationApproval /></ProtectedRoute>} />
          <Route path="/client-quotation-approval/:id" element={<ProtectedRoute allowRoles={['Management', 'Admin']}><ClientQuotationDetailReview /></ProtectedRoute>} />
          <Route path="/project-billing" element={<ProtectedRoute allowRoles={['Finance', 'Admin']}><ProjectBilling /></ProtectedRoute>} />
          <Route path="/project-billing/:projectId" element={<ProtectedRoute allowRoles={['Finance', 'Admin']}><ProjectBillingDetail /></ProtectedRoute>} />
          <Route path="/finance-input-payment" element={<ProtectedRoute allowRoles={['Finance', 'Admin']}><FinanceInputPayment /></ProtectedRoute>} />
          <Route path="/supplier-payment-detail/:id" element={<ProtectedRoute allowRoles={['Finance', 'Admin']}><SupplierPaymentDetail /></ProtectedRoute>} />

          {/* 9. CATCH-ALL */}
          <Route path="*" element={<Login />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
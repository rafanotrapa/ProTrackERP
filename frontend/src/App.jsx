import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './i18n';

import UserManagement from './pages/UserManagement';
import SystemLogs from './pages/SystemLogs';

import ProjectCenter from './pages/ProjectCenter';
import AddProject from './pages/AddProject';
import ProjectLog from './pages/ProjectLog';
import AddClientQuotation from './pages/AddClientQuotation';
import AddClientInvoice from './pages/AddClientInvoice';
import InputPayment from './pages/InputPayment';
import InputPaymentCenter from './pages/InputPaymentCenter';
import InputPaymentLog from './pages/InputPaymentLog';
import QuotationCenter from './pages/QuotationCenter';
import QuotationLog from './pages/QuotationLog';
import QuotationLogDetail from './pages/QuotationLogDetail';
import InvoiceCenter from './pages/InvoiceCenter';
import InvoiceLog from './pages/InvoiceLog';
import InvoiceLogDetail from './pages/InvoiceLogDetail';

import VendorMenu from './pages/VendorMenu';
import AddVendor from './pages/AddVendor';
import ExistingVendors from './pages/ExistingVendors';

import SupplierQuotationMenu from './pages/SupplierQuotationMenu';
import SupplierQuotationRecord from './pages/SupplierQuotationRecord';
import AddSupplierQuotation from './pages/AddSupplierQuotation';

import POMenu from './pages/POMenu';
import PORecord from './pages/PORecord';
import CreatePO from './pages/CreatePO';

import SupplierInvoiceMenu from './pages/SupplierInvoiceMenu';
import SupplierInvoiceRecord from './pages/SupplierInvoiceRecord';
import InvoiceSubmission from './pages/SupplierInvoice';

import ReceiveQCGoods from './pages/ReceiveQCGoods';
import DeliveryManagement from './pages/DeliveryManagement';
import Inventory from './pages/Inventory';

import SupplierPayment from './pages/SupplierPayment';
import FinancialReport from './pages/financialReport';
import PaymentVerification from './pages/PaymentVerification';
import FinancePaymentCenter from './pages/FinancePaymentCenter';
import PaymentVerifyDetail from './pages/PaymentVerifyDetail';
import ProjectBilling from './pages/ProjectBilling';
import ProjectBillingDetail from './pages/ProjectBillingDetail';
import FinanceInputPayment from './pages/FinanceInputPayment';
import SupplierPaymentDetail from './pages/SupplierPaymentDetail';

import ProjectList from './pages/ProjectList';
import ProjectTimeline from './pages/ProjectTimeline';

import ExpenseSubmissionMenu from './pages/ExpenseSubmissionMenu';
import AddExpenseSubmission from './pages/AddExpenseSubmission';
import ExpenseSubmissionLog from './pages/ExpenseSubmissionLog';

import QuotationApproval from './pages/QuotationApproval';
import QuotationDetailReview from './pages/QuotationDetailReview';
import ClientQuotationApproval from './pages/ClientQuotationApproval';
import ClientQuotationDetailReview from './pages/ClientQuotationDetailReview';

function App() {
  return (
    <Router>
      <div className="App font-sans">
        {/* LanguageProvider berada DI LUAR ErrorBoundary karena layar error itu
            sendiri perlu diterjemahkan. */}
        <LanguageProvider>
        {/* Menahan error render satu halaman supaya tidak membongkar seluruh
            aplikasi jadi layar putih tanpa pesan. */}
        <ErrorBoundary>
        <Routes>

          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          <Route path="/register" element={<ProtectedRoute allowRoles={['Admin']}><Register /></ProtectedRoute>} />
          <Route path="/manage-users" element={<ProtectedRoute allowRoles={['Admin']}><UserManagement /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute allowRoles={['Admin', 'Management', 'Owner']} modul="System Logs"><SystemLogs /></ProtectedRoute>} />

          <Route path="/project-center" element={<ProtectedRoute allowRoles={['Marketing', 'Admin', 'Management', 'Owner']}><ProjectCenter /></ProtectedRoute>} />
          <Route path="/add-project" element={<ProtectedRoute allowRoles={['Marketing', 'Admin', 'Management', 'Owner']}><AddProject /></ProtectedRoute>} />
          <Route path="/project-log" element={<ProtectedRoute allowRoles={['Marketing', 'Admin', 'Management', 'Owner']} modul="Project"><ProjectLog /></ProtectedRoute>} />
          <Route path="/client-quote" element={<ProtectedRoute allowRoles={['Marketing', 'Admin', 'Management', 'Owner']}><AddClientQuotation /></ProtectedRoute>} />
          <Route path="/create-invoice" element={<ProtectedRoute allowRoles={['Marketing', 'Admin']}><AddClientInvoice /></ProtectedRoute>} />
          <Route path="/input-payment-center" element={<ProtectedRoute allowRoles={['Marketing', 'Admin']}><InputPaymentCenter /></ProtectedRoute>} />
          <Route path="/input-payment" element={<ProtectedRoute allowRoles={['Marketing', 'Admin']}><InputPayment /></ProtectedRoute>} />
          <Route path="/input-payment-log" element={<ProtectedRoute allowRoles={['Marketing', 'Admin']} modul="Client Payment"><InputPaymentLog /></ProtectedRoute>} />
          <Route path="/quotation-center" element={<ProtectedRoute allowRoles={['Marketing', 'Admin']}><QuotationCenter /></ProtectedRoute>} />
          <Route path="/quotation-log" element={<ProtectedRoute allowRoles={['Marketing', 'Admin']} modul="Client Quotation"><QuotationLog /></ProtectedRoute>} />
          <Route path="/quotation-log-detail/:id" element={<ProtectedRoute allowRoles={['Marketing', 'Admin']} modul="Client Quotation"><QuotationLogDetail /></ProtectedRoute>} />
          <Route path="/invoice-center" element={<ProtectedRoute allowRoles={['Marketing', 'Admin', 'Finance']}><InvoiceCenter /></ProtectedRoute>} />
          <Route path="/invoice-log" element={<ProtectedRoute allowRoles={['Marketing', 'Admin', 'Finance']} modul="Client Invoice"><InvoiceLog /></ProtectedRoute>} />
          <Route path="/invoice-log-detail/:id" element={<ProtectedRoute allowRoles={['Marketing', 'Admin', 'Finance']} modul="Client Invoice"><InvoiceLogDetail /></ProtectedRoute>} />

          <Route path="/vendor" element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']}><VendorMenu /></ProtectedRoute>} />
          <Route path="/add-vendor" element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><AddVendor /></ProtectedRoute>} />
          <Route path="/existing-vendors" element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']} modul="Vendor"><ExistingVendors /></ProtectedRoute>} />

          <Route path="/supplier-quotation-menu" element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']}><SupplierQuotationMenu /></ProtectedRoute>} />
          <Route path="/supplier-quotation-record" element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']} modul="Supplier Quotation"><SupplierQuotationRecord /></ProtectedRoute>} />
          <Route path="/add-supplier-quotation" element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><AddSupplierQuotation /></ProtectedRoute>} />

          <Route path="/po-menu" element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']}><POMenu /></ProtectedRoute>} />
          <Route path="/po-record" element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']} modul="Purchase Order"><PORecord /></ProtectedRoute>} />
          <Route path="/create-po" element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><CreatePO /></ProtectedRoute>} />

          <Route path="/supplier-invoice-menu" element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']}><SupplierInvoiceMenu /></ProtectedRoute>} />
          <Route path="/supplier-invoice-record" element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']} modul="Supplier Invoice"><SupplierInvoiceRecord /></ProtectedRoute>} />
          <Route path="/upload-to-finance" element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><InvoiceSubmission /></ProtectedRoute>} />

          <Route path="/receive-qc" element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><ReceiveQCGoods /></ProtectedRoute>} />
          <Route path="/delivery-management" element={<ProtectedRoute allowRoles={['Procurement', 'Admin']}><DeliveryManagement /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute allowRoles={['Procurement', 'Admin', 'Management', 'Owner']} modul="Inventory"><Inventory /></ProtectedRoute>} />

          <Route path="/timeline" element={<ProtectedRoute allowRoles={['Marketing', 'Owner']} modul="Project Timeline"><ProjectList /></ProtectedRoute>} />
          <Route path="/timeline/:projectId" element={<ProtectedRoute allowRoles={['Marketing', 'Owner']} modul="Project Timeline"><ProjectTimeline /></ProtectedRoute>} />

          <Route path="/owner-insight" element={<ProtectedRoute allowRoles={['Owner', 'Admin']}><div className="p-20 text-center font-black italic uppercase text-slate-300">Executive Summary Insight Module</div></ProtectedRoute>} />
          <Route path="/supplier-payment" element={<ProtectedRoute allowRoles={['Finance', 'Admin']}><SupplierPayment /></ProtectedRoute>} />
          <Route path="/financial-report" element={<ProtectedRoute allowRoles={['Finance', 'Owner', 'Admin']} modul="Financial Report"><FinancialReport /></ProtectedRoute>} />
          <Route path="/finance-payment-center" element={<ProtectedRoute allowRoles={['Finance', 'Admin']}><FinancePaymentCenter /></ProtectedRoute>} />
          <Route path="/verify-payment" element={<ProtectedRoute allowRoles={['Finance', 'Admin']}><PaymentVerification /></ProtectedRoute>} />
          <Route path="/verify-payment/:id" element={<ProtectedRoute allowRoles={['Finance', 'Admin']}><PaymentVerifyDetail /></ProtectedRoute>} />

          <Route path="/quotation-approval" element={<ProtectedRoute allowRoles={['Management', 'Admin']}><QuotationApproval /></ProtectedRoute>} />
          {/* Procurement dan Owner masuk lewat daftar record sebagai tampilan
              baca-saja; tombol setujui/tolak disembunyikan di dalam halamannya. */}
          <Route path="/quotation-approval/:id" element={<ProtectedRoute allowRoles={['Management', 'Admin', 'Procurement', 'Owner']} modul="Supplier Quotation"><QuotationDetailReview /></ProtectedRoute>} />
          <Route path="/client-quotation-approval" element={<ProtectedRoute allowRoles={['Management', 'Admin']}><ClientQuotationApproval /></ProtectedRoute>} />
          <Route path="/client-quotation-approval/:id" element={<ProtectedRoute allowRoles={['Management', 'Admin']}><ClientQuotationDetailReview /></ProtectedRoute>} />
          <Route path="/project-billing" element={<ProtectedRoute allowRoles={['Finance', 'Admin']}><ProjectBilling /></ProtectedRoute>} />
          <Route path="/project-billing/:projectId" element={<ProtectedRoute allowRoles={['Finance', 'Admin']}><ProjectBillingDetail /></ProtectedRoute>} />
          <Route path="/finance-input-payment" element={<ProtectedRoute allowRoles={['Finance', 'Admin']}><FinanceInputPayment /></ProtectedRoute>} />
          <Route path="/supplier-payment-detail/:id" element={<ProtectedRoute allowRoles={['Finance', 'Admin']}><SupplierPaymentDetail /></ProtectedRoute>} />

          <Route path="/expense-submission-menu" element={<ProtectedRoute allowRoles={['Marketing', 'Procurement', 'Finance', 'Admin', 'Owner', 'Management']}><ExpenseSubmissionMenu /></ProtectedRoute>} />
          <Route path="/add-expense-submission" element={<ProtectedRoute allowRoles={['Marketing', 'Procurement', 'Finance', 'Admin', 'Owner', 'Management']}><AddExpenseSubmission /></ProtectedRoute>} />
          <Route path="/expense-submission-log" element={<ProtectedRoute allowRoles={['Marketing', 'Procurement', 'Finance', 'Admin', 'Owner', 'Management']} modul="Expense Submission"><ExpenseSubmissionLog /></ProtectedRoute>} />

          <Route path="*" element={<Login />} />

        </Routes>
        </ErrorBoundary>
        </LanguageProvider>
      </div>
    </Router>
  );
}

export default App;
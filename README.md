# ProTrackERP

An ERP system for procurement project management — handling the full workflow from quotations, purchase orders, invoices, payments, and inventory through to financial reporting, with role-based access per division.

Built on the **MERN** stack (MongoDB, Express, React, Node.js).

---

## Tech Stack

**Backend**
- Node.js + Express 5
- MongoDB + Mongoose
- JWT (authentication) + bcryptjs (password hashing)
- Multer (file uploads) + Nodemailer (password-reset emails)

**Frontend**
- React 19 + Vite
- React Router
- Tailwind CSS
- Axios, SweetAlert2, jsPDF (PDF generation), lucide-react (icons)

---

## Key Features (by Division)

| Division | Features |
|----------|----------|
| **Marketing** | Project Center, Create Quotation, Create Invoice, Input Payment, Project Timeline |
| **Procurement** | Vendor Directory, Supplier Quotation, Purchase Order, Receive & QC Goods, Invoice Submission, Delivery Management (+ BAST PDF), Inventory Storage |
| **Finance** | Project Billing (2x–6x installments), Client Payment, Payment Verification, Supplier Payment, Financial Report |
| **Management** | Supplier Quotation & Client Quotation approval |
| **Owner** | Financial Report, Project Timeline |
| **Admin** | User Management, System Logs (cross-module audit) |

Cross-division modules: Expense Submission, cash-flow report, monthly trend, and receivables.

---

## Prerequisites

- **Node.js** v18 or newer
- **MongoDB** (local or MongoDB Atlas)
- **npm** and **git**

---

## Installation & Running

### 1. Clone the repository
```bash
git clone https://github.com/rafanotrapa/ProTrackERP.git
cd ProTrackERP
```

### 2. Backend
```bash
npm install
```

Create a `.env` file in the root (see the example below), then run:
```bash
node server.js
```
The server runs at `http://localhost:5000`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend runs at `http://localhost:5173`.

---

## Environment Variables (`.env`)

Create a `.env` file in the project root with the following:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/
JWT_SECRET=<random-secret-for-jwt>
EMAIL_HOST=<smtp-host>
EMAIL_PORT=<smtp-port>
EMAIL_USER=<smtp-user>
EMAIL_PASS=<smtp-password>
FRONTEND_URL=http://localhost:5173
PORT=5000
```

> The email credentials are used for the forgot/reset-password feature (SMTP, e.g. Mailtrap for development).

---

## Project Structure

```
ProTrackERP/
├── config/          Database connection
├── controllers/     Business logic per module
├── middleware/      Authentication (JWT) + file upload
├── models/          Mongoose schemas
├── routes/          API endpoints
├── utils/           Shared helpers (e.g. payment-terms parser)
├── uploads/         Uploaded files
├── server.js        Backend entry point
└── frontend/        React application (Vite)
    └── src/
        ├── pages/       Feature pages
        ├── components/  Shared components
        └── utils/       Frontend helpers
```

---

## Roles & Access

There are 6 roles: **Marketing, Procurement, Finance, Management, Owner, Admin**. Every endpoint is protected by JWT, and frontend pages are restricted per role. Accounts are created by an Admin through the User Management page.

---

## Production Build (Frontend)

```bash
cd frontend
npm run build
```
The build output is generated in `frontend/dist/`.

---

## Notes

- On macOS, port 5000 is sometimes used by AirPlay Receiver. If the backend is unreachable, disable it via System Settings → General → AirDrop & Handoff → AirPlay Receiver.
- Payment progress supports flexible installment schemes: DP + final payment, or 2x up to 6x installments (must total 100%).

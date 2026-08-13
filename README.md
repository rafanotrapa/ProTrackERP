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
MONGO_URI=your_mongo_uri
JWT_SECRET=your_jwt_secret
EMAIL_HOST=your_smtp_host
EMAIL_PORT=your_smtp_port
EMAIL_USER=<your_smtp_user
EMAIL_PASS=your_smtp_password
FRONTEND_URL=your_url
PORT=your_port
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

There are 8 roles: **Marketing, Procurement, Finance, Management, Owner, Administrator**, plus two view-only roles — **Super Admin** (one account only, reads every module) and **Viewer** (reads just the modules ticked on the account). Every endpoint is protected by JWT, and frontend pages are restricted per role. Accounts are created by an Administrator through the User Management page.

---

## Production Build & Deploy

Use the build script — **not** `npm run build` on its own:

```bash
./deploy-build.sh
```

The API address is written literally as `http://localhost:5000` throughout
`frontend/src`, and there is no frontend `.env` to override it. A plain
`npm run build` therefore produces a bundle that asks the *visitor's* machine
for the API, which surfaces as "Login Gagal" plus `ERR_CONNECTION_REFUSED` in
the console. `deploy-build.sh` rewrites that address to the production API,
builds, writes the SPA `.htaccess`, and packs both ZIPs:

- `ProTrackERP-frontend.zip` → extract into `public_html/`
- `ProTrackERP-backend.zip` → extract into `public_html/api/`, then restart the Node app

Override the target with `API_URL=https://api.example.com ./deploy-build.sh`.
The script requires `frontend/src` to be clean in git, because it restores the
source afterwards with `git checkout`.

For local development, `cd frontend && npm run build` still works; the output
lands in `frontend/dist/` but points at localhost.

---

## Notes

- On macOS, port 5000 is sometimes used by AirPlay Receiver. If the backend is unreachable, disable it via System Settings → General → AirDrop & Handoff → AirPlay Receiver.
- Payment progress supports flexible installment schemes: DP + final payment, or 2x up to 6x installments (must total 100%).

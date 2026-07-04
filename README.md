# Smart Health – AI-Driven Health Center & Supply Chain Management

Smart Health is an AI-powered healthcare ecosystem and supply chain automation platform. It is designed to bridge the clinical and logistic divide in healthcare systems.

## ✨ Core Key Features

1. **Patient Triage**: Gemini-powered AI symptom checks mapping patients to recommended specialized clinics and diagnosing emergency thresholds immediately.
2. **Clinical Diagnosis Helper**: Automated diagnostic treatment paths, medicine suggestions, and drug safety reviews.
3. **Pharmacy checkouts**: Digital E-prescription lockers, stock levels verification, and barcode-based inventory dispatching.
4. **Predictive Supply Chain**: AI monthly demand forecasting (minimizing drug stockout), automated reorder alerts, and GPS dispatch milestones tracking.
5. **Hospital Admin Analytics**: occupancy reports, total patient indicators, real-time revenue analytics, and branch stock redistribution optimization.

---

## 🚀 Setup & Installation

### Prerequisite
Make sure you have **Node.js** (v18+) and **MongoDB** (running locally or using MongoDB Atlas) installed.

### 1. Install Workspace Dependencies
Install root dependencies and trigger bulk installer for frontend and backend:
```bash
npm run install:all
```

### 2. Configure Environment variables
Navigate into `/backend` and configure your environment credentials in `.env`:
```bash
# /backend/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart_health
JWT_SECRET=supersecretjwtkey12345
GEMINI_API_KEY=your_gemini_api_key_here
```
*Note: If `GEMINI_API_KEY` is not provided, the platform automatically activates a robust local mockup AI simulator.*

### 3. Seed Realistic Database Records
Populate users, doctors, medicines, and delivery routes so the platform dashboards are instantly loaded:
```bash
npm run seed --prefix backend
```

### 4. Run Development Servers
Launch both Vite React frontend and Express backend concurrently:
```bash
npm run dev
```

The application will launch on:
* **Frontend**: `http://localhost:5173`
* **Backend API**: `http://localhost:5000`

---

## 👥 Seed User Roles for Demo (Password: `password123`)

For simple testing, we provide a **Demo Role Switcher Pill** in the top navigation bar of the application. Clicking it switches your active dashboard context immediately. For manual logins, you can use:

* **Patient**: `patient@smarthealth.com`
* **Doctor**: `doctor@smarthealth.com`
* **Pharmacist**: `pharmacist@smarthealth.com`
* **Hospital Administrator**: `admin@smarthealth.com`
* **Supplier**: `supplier@smarthealth.com`

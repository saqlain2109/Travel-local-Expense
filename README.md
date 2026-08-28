# ✈️ Travel & Local Expense Claim Management System

A full-stack enterprise Expense & Travel Claim Management System built with **React**, **Tailwind CSS**, **Node.js/Express**, and **SQLite (Sequelize)**. Designed for desktop, tablet, and mobile with a touch-friendly interface, multi-level department approval matrix, and automated SMTP email alerts.

---

## 🌟 Key Features

* **📱 Mobile-First UI & Responsive Design:**
  * Native-like mobile bottom navigation bar with floating action button `(+)`.
  * Touch-optimized cards for approvals, claim histories, and employee directories.
  * Responsive KPI dashboard and interactive Recharts data visualizations.
* **🏢 Dynamic Approval Matrix & Multi-Level Workflows:**
  * Multi-level hierarchy (Direct Manager $\rightarrow$ Department Head $\rightarrow$ Finance Director).
  * Auto-routing of submitted claims to department approvers based on business rules.
* **📬 Automated Email Notifications (Nodemailer SMTP):**
  * Instant email notifications to requesters upon submission and status updates.
  * Approver alerts with claim summary and direct action links.
  * Self-service password reset with temporary secure credentials.
* **📊 Analytics, Excel Export & PDF Vouchers:**
  * Department spending breakdown and budget vs actual charts.
  * One-click Excel report export (`.xlsx`) and printable PDF claim vouchers.
* **🔐 Role-Based Access Control (RBAC):**
  * Admin accounts for user management, role activation, and workflow settings.
  * User/Employee accounts for claim submissions and personal history tracking.

---

## 🛠️ Tech Stack

* **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, GSAP Animations, Recharts, jsPDF, html-to-image, SheetJS (XLSX).
* **Backend:** Node.js, Express, Sequelize ORM, SQLite, Nodemailer, CORS.

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/travel-local-expense-claim.git
cd travel-local-expense-claim
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your port and SMTP details if needed
node index.js
```

### 3. Frontend Setup
```bash
cd ../client
npm install
npm run dev
```

### 4. Default Demo Accounts
| Role | Username | Password |
|---|---|---|
| **Admin** | `admin` | `password` |
| **Manager (Finance)** | `sarah` | `password` |
| **Employee** | `john` | `password` |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

# 🚀 Attendance Management System (Node.js + Express)

A full-featured **Mobile-Based Attendance Management System** built with **Node.js, Express, PostgreSQL, and EJS**.

This system supports secure employee tracking with location validation, PIN login, biometric punch, dashboards, and monthly reporting.

🔗 Live Demo: https://attendancesystemmobile.vercel.app/

---

## 📌 Features

- 🔐 Admin & Employee Login (Password + PIN)
- 📍 GPS Location-based Punch In/Out
- 🧑‍💼 Employee Management (Add / Delete / Search)
- 📊 Real-Time Dashboard with Charts (Chart.js)
- 📅 Monthly Attendance Reports
- 📱 Mobile API Support
- 🧬 Biometric Punch Endpoint
- 🕒 IST (Asia/Kolkata) Timezone Handling
- 📝 Leave Management System
- 🚨 Absent Marking System

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| Template Engine | EJS |
| Authentication | express-session |
| Password Hashing | bcryptjs |
| Timezone | Luxon |
| Charts | Chart.js |
| Deployment | Vercel |

---

# File Tree: nodejs

**Root Path:** `attendance_system_mobile`

```
├── 📁 api
│   └── 📄 index.js
├── 📁 public
│   ├── 📁 css
│   │   └── 🎨 style.css
│   ├── 📁 images
│   │   └── 🖼️ logo.png
│   ├── 📁 js
│   │   ├── 📄 main.js
│   │   └── 📄 webauthn.js
│   └── 📄 favicon.ico
├── 📁 src
│   ├── 📁 config
│   │   ├── 📄 db.js
│   │   └── 📄 supabase.js
│   ├── 📁 controllers
│   │   ├── 📄 admin.controller.js
│   │   ├── 📄 auth.controller.js
│   │   ├── 📄 employee.controller.js
│   │   ├── 📄 mobile.controller.js
│   │   └── 📄 reports.controller.js
│   ├── 📁 middleware
│   │   ├── 📄 auth.js
│   │   ├── 📄 session.js
│   │   └── 📄 upload.js
│   ├── 📁 routes
│   │   ├── 📄 admin.routes.js
│   │   ├── 📄 auth.routes.js
│   │   ├── 📄 employee.routes.js
│   │   ├── 📄 mobile.routes.js
│   │   └── 📄 reports.routes.js
│   ├── 📁 services
│   │   ├── 📄 attendance.service.js
│   │   ├── 📄 employee.service.js
│   │   ├── 📄 location.service.js
│   │   ├── 📄 photo.service.js
│   │   └── 📄 report.service.js
│   ├── 📁 utils
│   │   ├── 📄 fileValidation.js
│   │   ├── 📄 helpers.js
│   │   ├── 📄 password.js
│   │   └── 📄 timezone.js
│   └── 📄 app.js
├── 📁 views
│   ├── 📄 admin_dashboard.ejs
│   ├── 📄 base.ejs
│   ├── 📄 employee_dashboard.ejs
│   ├── 📄 index.ejs
│   ├── 📄 login.ejs
│   ├── 📄 monthly_report.ejs
│   └── 📄 reports.ejs
├── ⚙️ .env.example
├── ⚙️ .gitignore
├── 📝 README.md
├── ⚙️ package-lock.json
├── ⚙️ package.json
├── 📄 server.js
└── ⚙️ vercel.json
```

---

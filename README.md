# JJS Track

JJS Track is a full-stack order, booking, inventory, staff, invoice, chat, and notification system for JJS Sportswear. The repository is split into three runnable applications:

- `backend`: Express, MongoDB, Cloudinary, email, REST API, and WebSocket services.
- `frontend`: Customer-facing React/Vite app for accounts, bookings, orders, appointments, invoices, and profile management.
- `admin`: Admin and staff React/Vite app for dashboards, order operations, inventory, QR workflows, staff accounts, analytics, archives, and staff task views.

## Table of Contents

- [Project Structure](#project-structure)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup))
- [Realtime Features](#realtime-features)

## Project Structure

```text
JJS-Track/
|-- admin/                    # Admin and staff dashboard app
|   |-- src/
|   |   |-- components/        # Shared admin UI components
|   |   |-- context/           # Admin-level contexts
|   |   |-- hooks/             # Admin realtime hooks
|   |   |-- layout/            # Admin shell/navigation
|   |   |-- pages/             # Admin pages and booking forms
|   |   |-- services/          # Admin API clients
|   |   |-- staff/             # Staff portal routes, pages, utilities
|   |   `-- utils/             # Helpers, auth/session, Cloudinary, alerts
|   |-- package.json
|   `-- vercel.json
|-- backend/                   # Express API and websocket server
|   |-- assets/                # Backend static assets
|   |-- config/                # MongoDB and Cloudinary config
|   |-- controllers/           # Route handlers
|   |-- middleware/            # Auth and role middleware
|   |-- models/                # Mongoose models
|   |-- routes/                # Express route definitions
|   |-- utils/                 # Sockets, notifications, email, workflow helpers
|   |-- package.json
|   |-- server.js
|   `-- vercel.json
|-- frontend/                  # Customer-facing app
|   |-- config/                # Firebase configuration
|   |-- public/                # PWA assets, manifest, sitemap
|   |-- services/              # Customer API clients
|   |-- src/
|   |   |-- assets/            # Images and design assets
|   |   |-- components/        # Shared customer UI components
|   |   |-- context/           # Customer app contexts
|   |   |-- hooks/             # Customer realtime hooks
|   |   |-- layouts/           # Customer app shell
|   |   |-- pages/             # Landing, auth, booking, order, invoice pages
|   |   |-- styles/            # CSS modules/global styles
|   |   `-- utils/             # Tracking, Cloudinary, pricing, export helpers
|   |-- package.json
|   `-- vercel.json
`-- README.md
```

## Core Features

### Customer App

- Public landing page, designs page, terms, privacy, and account-removal confirmation.
- Email/password and Google sign-in flows.
- Email verification, forgot password, and reset password flows.
- Customer dashboard with active orders and order reminders.
- Appointment booking and slot availability.
- Repair booking form.
- Team jersey and organization booking forms.
- Order tracking with status, pickup date, invoice details, and realtime updates.
- Customer invoices.
- Customer profile management.
- Support/order chat and notification feed.

### Admin App

- Admin login and protected admin routes.
- Dashboard for bookings, inventory, appointments, and operational summaries.
- Analytics/reporting pages.
- Appointment management.
- Order management for bookings and converted orders.
- Status filters including approval, pending, in-progress, completed, overdue, cancelled, released, and all records.
- Order detail pages with workflow progress, assignment controls, production timeline, roster, summaries, and QR workflows.
- QR scanner for release/pickup flows.
- Released and archived records.
- Staff management.
- Inventory management with categories, stock adjustments, archiving, restore flow, FIFO batch preview, inventory history, and stock alerts.
- Service and pricing management.
- Admin profile.
- Realtime order, inventory, and notification updates.

### Staff App

- Staff login and protected staff routes under `/staff`.
- Staff dashboard.
- Assigned order/task views.
- Staff order details.
- Staff archives.
- Staff inventory access and usage history.
- Staff profile.
- QR scanner.
- Staff notifications.

### Backend

- JWT authentication for users, admins, and staff.
- MongoDB persistence through Mongoose models.
- Booking, order, appointment, invoice, service, pricing, inventory, staff, chat, and notification APIs.
- Cloudinary integration for image upload support.
- Email sending through SMTP or Resend.
- QR code generation and QR release/pickup actions.
- WebSocket support for order feed, inventory updates, and notifications.
- Scheduled notification/reminder utilities.

## Tech Stack

### Frontend and Admin

- React 19
- Vite 7
- React Router 7
- Tailwind CSS 3
- Axios
- Lucide React and React Icons
- Sonner and React Toastify for notifications
- Firebase in the customer app
- Recharts, jsPDF, jspdf-autotable, docx, html-to-image, QR scanner tools in the admin app

### Backend

- Node.js
- Express 5
- MongoDB with Mongoose
- JWT
- bcrypt
- Cloudinary
- Nodemailer or Resend
- Multer
- QRCode
- `ws` WebSockets

## Prerequisites

- Node.js 20 or newer.
- npm.
- MongoDB connection string, either local MongoDB or MongoDB Atlas.
- Cloudinary account for backend image configuration.
- Email provider credentials for verification, reset-password, and reminder emails.
- Firebase project configuration for the customer app if Google/Firebase-backed features are enabled.

## Local Setup

Install dependencies separately for each app:

```powershell
cd backend
npm install
```

```powershell
cd frontend
npm install
```

```powershell
cd admin
npm install
```

Create local environment files:

```text
backend/.env
frontend/.env
admin/.env
```

Do not commit real `.env` files. Keep production secrets in the hosting provider's environment variable settings.

## Realtime Features

The backend attaches WebSocket servers to the same HTTP server used by Express.

Current realtime areas include:

- Inventory updates.
- Notification updates.
- Order feed/tracking updates.

The frontend/admin clients derive WebSocket URLs from the configured API base URL. In local development, `http://localhost:4000/api` becomes a matching `ws://localhost:4000/...` socket URL.

## License

The backend package currently declares `ISC`. If the full repository should use a specific license, add a root `LICENSE` file and update this section.

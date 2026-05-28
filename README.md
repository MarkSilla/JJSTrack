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
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Running the Apps](#running-the-apps)
- [Available Scripts](#available-scripts)
- [Application Routes](#application-routes)
- [Backend API Overview](#backend-api-overview)
- [Realtime Features](#realtime-features)
- [Deployment Notes](#deployment-notes)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

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

## Environment Variables

### Backend `.env`

```env
PORT=4000
MONGODB_URL=mongodb+srv://USER:PASSWORD@HOST/DATABASE
JWT_SECRET=replace-with-a-long-random-secret

ADMIN_USERNAME=admin@example.com
ADMIN_PASSWORD=replace-with-secure-password

CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

FRONTEND_URL=http://localhost:5173
CLIENT_URL=http://localhost:5173
EMAIL_LOGO_URL=http://localhost:5173/pwa-icon.png
EMAIL_SEND_TIMEOUT_MS=30000

# Option A: SMTP
EMAIL_PROVIDER=smtp
EMAIL_FROM="JJS Track <noreply@example.com>"
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=your-smtp-password

# Option B: Resend
# EMAIL_PROVIDER=resend
# RESEND_API_KEY=re_xxxxxxxxx
# RESEND_FROM="JJS Track <noreply@example.com>"
# RESEND_API_URL=https://api.resend.com/emails
```

Notes:

- `MONGODB_URL`, `JWT_SECRET`, and Cloudinary variables are required for normal backend startup.
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` enable the configured admin login.
- The backend code falls back to `secret_key` if `JWT_SECRET` is missing, but production must always set a strong secret.
- Email can use SMTP or Resend. Run `npm run verify:email` inside `backend` to check email configuration.

### Frontend `.env`

```env
VITE_BACKEND_URL=http://localhost:4000/api

VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

Notes:

- If `VITE_BACKEND_URL` is not set in development, the customer app uses `http://localhost:4000/api`.
- In production, the customer app falls back to the configured production API URL in `frontend/services/api.js`.

### Admin `.env`

```env
VITE_BACKEND_URL=http://localhost:4000/api
```

Notes:

- If `VITE_BACKEND_URL` is not set in development, the admin app uses `http://localhost:4000/api`.
- In production, the admin app falls back to the configured production API URL in `admin/src/utils/apiBaseUrl.js`.

## Running the Apps

Start the backend:

```powershell
cd backend
npm run server
```

The backend defaults to:

```text
http://localhost:4000
```

Start the customer app:

```powershell
cd frontend
npm run dev
```

Vite usually starts at:

```text
http://localhost:5173
```

Start the admin/staff app:

```powershell
cd admin
npm run dev
```

If the frontend is already using port `5173`, Vite will offer the next available port, commonly:

```text
http://localhost:5174
```

Recommended local flow:

1. Start `backend` first.
2. Start `frontend`.
3. Start `admin`.
4. Visit the customer app at `/`.
5. Visit admin login at `/admin/login`.
6. Visit staff login at `/staff/login`.

## Available Scripts

### Backend

Run from `backend/`.

```powershell
npm run server
```

Starts the Express server with Nodemon.

```powershell
npm start
```

Starts the Express server with Node.

```powershell
npm run verify:email
```

Checks the active email provider configuration.

### Frontend

Run from `frontend/`.

```powershell
npm run dev
npm run build
npm run preview
npm run lint
```

### Admin

Run from `admin/`.

```powershell
npm run dev
npm run build
npm run preview
npm run lint
```

## Application Routes

### Customer App Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/login` | Customer login |
| `/signup` | Customer signup |
| `/verify-email` | Email verification |
| `/forgot-password` | Forgot password |
| `/reset-password` | Reset password |
| `/account-removal/confirm` | Account removal confirmation |
| `/terms-of-use` | Terms of use |
| `/privacy-policy` | Privacy policy |
| `/designs` | Designs gallery |
| `/home` | Protected customer dashboard |
| `/appointment` | Protected appointment page |
| `/invoices` | Protected invoice list/details |
| `/invoices/:id` | Protected invoice detail route |
| `/repair-booking` | Protected repair booking form |
| `/order` | Protected customer orders |
| `/order/:orderId` | Protected customer order detail |
| `/profile` | Protected customer profile |

### Admin Routes

| Route | Purpose |
| --- | --- |
| `/` | Role-based entry page |
| `/admin/login` | Admin login |
| `/admin/dashboard` | Admin dashboard |
| `/admin/report` | Analytics/reporting |
| `/admin/appointment` | Appointment management |
| `/admin/orders` | Order and booking list |
| `/admin/orders/:orderId` | Order detail |
| `/admin/qr-scanner` | QR scanner |
| `/admin/released` | Released records |
| `/admin/archives` | Archived records |
| `/admin/staff` | Staff management |
| `/admin/inventory` | Inventory management |
| `/admin/inventory/history` | Inventory activity history |
| `/admin/services-pricing` | Service and pricing management |
| `/admin/profile` | Admin profile |

### Staff Routes

| Route | Purpose |
| --- | --- |
| `/staff/login` | Staff login |
| `/staff/dashboard` | Staff dashboard |
| `/staff/orders` | Staff order list |
| `/staff/orders/:orderId` | Staff order detail |
| `/staff/archives` | Staff archives |
| `/staff/inventory` | Staff inventory |
| `/staff/inventory/history` | Staff inventory history |
| `/staff/profile` | Staff profile |
| `/staff/qr-scanner` | Staff QR scanner |

## Backend API Overview

The backend root health check is:

```text
GET /
```

Expected response:

```text
JJSTrack Backend is running
```

All application APIs are mounted under `/api`.

### API Groups

| Base Path | Area |
| --- | --- |
| `/api/users` | Customer, admin, staff auth, profiles, account lifecycle |
| `/api/orders` | Orders, status, steps, assignment, QR release |
| `/api/bookings` | Bookings, slot availability, status, QR pickup, archive/unarchive, conversion |
| `/api/invoices` | Invoice CRUD, invoice stats, invoice status |
| `/api/appointments` | Appointment CRUD, appointment stats, slot availability |
| `/api/services` | Service catalog |
| `/api/pricing` | Pricing records by service type |
| `/api/inventory` | Inventory CRUD, settings, stats, search, FIFO, activity |
| `/api/staff` | Staff accounts and account status actions |
| `/api/chat` | Chat conversations and messages |
| `/api/notifications` | Notification listing and read status |

### Common Auth Notes

- Most API endpoints require a JWT through the auth middleware.
- Admin-only actions use admin middleware.
- Staff-only conversion actions use staff middleware.
- Frontend and admin API clients attach stored auth/session data where required.

### High-Level Route Examples

Users:

```text
POST /api/users/register
POST /api/users/login
POST /api/users/google-auth
POST /api/users/verify-email
POST /api/users/forgot-password
POST /api/users/reset-password
POST /api/users/admin/login
POST /api/users/staff/login
GET  /api/users/profile
PUT  /api/users/profile
```

Bookings:

```text
GET  /api/bookings/slots/available/:date
GET  /api/bookings/slots/summary
POST /api/bookings
GET  /api/bookings
GET  /api/bookings/:id
PUT  /api/bookings/:id
PUT  /api/bookings/:id/status
PUT  /api/bookings/:id/cancel
GET  /api/bookings/:id/qr
POST /api/bookings/qr/pickup
POST /api/bookings/:id/archive
POST /api/bookings/:id/unarchive
POST /api/bookings/:id/convert
```

Orders:

```text
GET  /api/orders
GET  /api/orders/stats
GET  /api/orders/:id
PUT  /api/orders/:id
PUT  /api/orders/:id/steps
PUT  /api/orders/:id/assign
PUT  /api/orders/:id/cancel
GET  /api/orders/:id/qr
POST /api/orders/qr/release
```

Inventory:

```text
GET    /api/inventory
GET    /api/inventory/settings
GET    /api/inventory/activity
GET    /api/inventory/stats
GET    /api/inventory/search
GET    /api/inventory/category/:category
GET    /api/inventory/:id
GET    /api/inventory/:id/fifo-preview
POST   /api/inventory
PUT    /api/inventory/settings
PUT    /api/inventory/:id
PATCH  /api/inventory/:id/adjust
PATCH  /api/inventory/:id/archive
PATCH  /api/inventory/:id/restore
DELETE /api/inventory/:id
```

Chat and notifications:

```text
GET    /api/chat/conversations
POST   /api/chat/conversations/order
POST   /api/chat/conversations/support
GET    /api/chat/messages
POST   /api/chat/messages
PATCH  /api/chat/messages/read
PATCH  /api/chat/messages/:messageId
DELETE /api/chat/messages/:messageId/everyone
DELETE /api/chat/messages/:messageId/me

GET    /api/notifications
PATCH  /api/notifications/read-all
PATCH  /api/notifications/:id/read
```

## Realtime Features

The backend attaches WebSocket servers to the same HTTP server used by Express.

Current realtime areas include:

- Inventory updates.
- Notification updates.
- Order feed/tracking updates.

The frontend/admin clients derive WebSocket URLs from the configured API base URL. In local development, `http://localhost:4000/api` becomes a matching `ws://localhost:4000/...` socket URL.

## Deployment Notes

### Backend

- `backend/vercel.json` is configured to deploy `server.js` with `@vercel/node`.
- The code also uses long-lived WebSocket behavior; deploy to a host that supports WebSockets if realtime features are required.
- Set all backend environment variables in the deployment provider.
- Confirm the deployed backend responds to `GET /`.

### Frontend

- `frontend/vercel.json` rewrites all app routes to `index.html` for React Router.
- Static assets are cached with long-lived headers.
- Set `VITE_BACKEND_URL` in production if the default production API URL should be overridden.
- Set all Firebase `VITE_FIREBASE_*` values in the hosting provider.

### Admin

- `admin/vercel.json` rewrites all app routes to the app entry.
- Set `VITE_BACKEND_URL` in production if the default production API URL should be overridden.
- The same app contains both admin routes under `/admin` and staff routes under `/staff`.

## Development Workflow

Recommended checks before merging or deploying:

```powershell
cd backend
npm start
```

```powershell
cd frontend
npm run lint
npm run build
```

```powershell
cd admin
npm run lint
npm run build
```

There is no dedicated automated test suite defined in the current package scripts. Use lint/build checks plus manual verification for workflows such as:

- Customer registration, login, verification, booking, order tracking, and invoices.
- Admin login, order filters, order detail updates, QR release/pickup flows, and inventory adjustments.
- Staff login, assigned order views, staff inventory deduction, and staff notifications.
- Realtime updates after changing orders, inventory, or notifications.

## Important Implementation Notes

- The backend uses `dotenv.config()` in `server.js`, so local backend environment variables should live in `backend/.env`.
- The frontend and admin apps are separate Vite apps, so each needs its own `.env`.
- The admin app has both admin and staff areas.
- Customer and admin API clients default to local API URLs in development.
- Production API fallbacks are hardcoded in the app API base URL utilities. Review those before changing deployment domains.
- Cloudinary unsigned upload details are present in frontend/admin utility files, while the backend also expects Cloudinary server credentials.
- Several features rely on derived order status helpers, so status changes should be checked in both list and detail views.
- QR flows depend on backend-generated QR payloads and authenticated release/pickup endpoints.

## Troubleshooting

### Backend cannot start

- Confirm `backend/.env` exists.
- Confirm `MONGODB_URL` is correct and reachable.
- Confirm your IP/network is allowed by MongoDB Atlas if using Atlas.
- Confirm Cloudinary credentials are present.
- Check that port `4000` is not already in use.

### Frontend or admin cannot reach the API

- Confirm the backend is running.
- Confirm `VITE_BACKEND_URL=http://localhost:4000/api` in the app `.env`.
- Restart the Vite dev server after editing `.env`.
- Check browser console/network tab for CORS or auth errors.

### Login fails

- For customer login, verify the user exists and is verified when verification is required.
- For admin login, confirm `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `backend/.env`.
- For staff login, confirm the staff account exists and is active.
- Confirm `JWT_SECRET` is stable between server restarts.

### Email verification or password reset does not send

- Run `npm run verify:email` from `backend`.
- Confirm SMTP or Resend variables are set.
- Check spam/junk folders.
- Confirm `FRONTEND_URL` or `CLIENT_URL` points to the correct customer app URL.

### Realtime updates do not appear

- Confirm the backend host supports WebSockets.
- Confirm the API base URL points to the correct backend.
- Check browser console for socket connection errors.
- If using production hosting, ensure socket routes are not blocked by the platform or proxy.

### Vite starts on a different port

This is normal when another app is already using `5173`. Use the URL printed by Vite in the terminal.

## License

The backend package currently declares `ISC`. If the full repository should use a specific license, add a root `LICENSE` file and update this section.

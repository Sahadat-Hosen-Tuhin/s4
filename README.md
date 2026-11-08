# S4 Style & Journeys

S4 is a responsive storefront for discovering fashion products and curated travel, Hajj, and Umrah packages. Customers can browse collections, contact the team, or submit an order enquiry. Administrators manage the catalog, orders, payment verification, and team access through a protected dashboard.

**Live website:** [https://s4-coral.vercel.app/](https://s4-coral.vercel.app/)

## Features

- Product and travel-package listings with category/provider filters and search
- Product and package detail pages with image galleries and WhatsApp enquiries
- Customer contact form and order submission
- Configurable delivery fees, payment methods, and advance amounts
- Admin order management and manual payment verification
- Protected admin dashboard for products, packages, settings, and employees
- Employee accounts with assigned posts and admin-reviewed edit/delete requests
- Manual sales records and sales dashboard
- Responsive layouts and animated page elements

## Tech stack

- **Frontend:** React, React Router, Vite, Tailwind CSS, Lucide
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Media storage:** Cloudinary
- **Authentication:** JWT-based protected admin and employee access

## Project structure

```text
backend/
  config/       Database connection
  controllers/  API handlers
  middleware/   Authentication, uploads, and error handling
  models/       MongoDB models
  routes/       API routes
  scripts/      Admin account setup
frontend/
  public/       Logos, banners, and category images
  src/          React application, styles, and API client
```

## Requirements

- Node.js and npm
- MongoDB connection string
- Cloudinary account for product/package image uploads

## Local development

1. Install backend dependencies and configure its environment:

   ```powershell
   cd backend
   npm install
   Copy-Item .env.example .env
   ```

   Set the following values in `backend/.env`:

   | Variable | Purpose |
   | --- | --- |
   | `MONGODB_URI` | MongoDB connection string (`MONGO_URI` is also accepted) |
   | `JWT_SECRET` | Secret used for authentication tokens; must be at least 32 characters |
   | `JWT_EXPIRES_IN` | Token lifetime, for example `1d` |
   | `FRONTEND_URL` | Frontend origin allowed by CORS, e.g. `http://localhost:5173` |
   | `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
   | `CLOUDINARY_API_KEY` | Cloudinary API key |
   | `CLOUDINARY_API_SECRET` | Cloudinary API secret |
   | `ADMIN_EMAIL` | Email for the admin account created by the seed script |
   | `ADMIN_PASSWORD` | Password for that admin account |
   | `PORT` | API port; defaults to `5000` |
   | `WHATSAPP_NUMBER` | Default WhatsApp contact number |

2. Create or update the admin account:

   ```powershell
   npm run seed:admin
   ```

3. Start the API:

   ```powershell
   npm run dev
   ```

   The API runs at `http://localhost:5000`; its health endpoint is `http://localhost:5000/health`.

4. In a separate terminal, install and configure the frontend:

   ```powershell
   cd frontend
   npm install
   Copy-Item .env.example .env
   ```

   Set `VITE_API_URL` to the API base URL (locally: `http://localhost:5000/api`) and `VITE_WHATSAPP_NUMBER` to the WhatsApp number used for customer enquiries.

5. Start the frontend:

   ```powershell
   npm run dev
   ```

   Open `http://localhost:5173`.

## API overview

The API is mounted under `/api`. Main public endpoints include:

- `/api/products` and `/api/products/:slug`
- `/api/packages` and `/api/packages/:slug`
- `/api/orders` for order submission and pricing calculation
- `/api/contact-messages` for contact form submissions
- `/api/settings` for public store settings

Admin and employee endpoints require the appropriate authenticated session and role. The API also exposes `/health` for service health checks.

## Validation

Run the frontend checks:

```powershell
cd frontend
npm run lint
npm run build
```

Check backend JavaScript syntax:

```powershell
cd backend
node --check server.js
```

## Deployment configuration

For a deployed frontend, configure `VITE_API_URL` to point to the deployed API base URL and set the backend `FRONTEND_URL` to the deployed frontend origin. Configure MongoDB and Cloudinary credentials in the deployment environment; do not commit real `.env` files or secrets.

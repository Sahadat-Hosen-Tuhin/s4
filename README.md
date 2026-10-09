# S4

S4 is a mobile-first React and Express site for product listings and S Alam travel packages. It uses MongoDB for content and genuine manually recorded sales, Cloudinary for image files, and a protected admin workspace.

## Local setup

Copy the environment templates:

```powershell
Copy-Item .\backend\.env.example .\backend\.env
Copy-Item .\frontend\.env.example .\frontend\.env
```

Fill in `backend\.env` with the rotated MongoDB Atlas URI, a long random `JWT_SECRET`, Cloudinary credentials, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. Fill in `frontend\.env` with `VITE_WHATSAPP_NUMBER` as an international number containing digits only. Never commit real `.env` files.

Create or update the admin account:

```powershell
Set-Location .\backend
npm run seed:admin
```

Start the API:

```powershell
npm run dev
```

It runs at `http://localhost:5000`; health is available at `http://localhost:5000/health`.

In a second terminal, start the frontend:

```powershell
Set-Location ..\frontend
npm run dev
```

The website runs at `http://localhost:5173`.

## Verification

```powershell
Set-Location .\frontend
npm run lint
npm run build

Set-Location ..\backend
node --check server.js
```

The app intentionally excludes checkout, online payment, reservations, and public admin registration. Product and package detail pages use a WhatsApp enquiry link with the relevant item name pre-filled.

Sales are manual admin records only. To record a genuine paid or completed sale without adding checkout, call the protected endpoint:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/admin/sales `
  -ContentType 'application/json' `
  -WebSession $session `
  -Body '{"customerName":"Customer name","amount":2500,"status":"paid"}'
```

The dashboard counts only `paid` and `completed` records and excludes cancelled sales.
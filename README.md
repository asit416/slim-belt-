# 🏋️ FitCore Sweat Belt — eCommerce Store

A complete, production-ready single-product eCommerce website for the **Adjustable Sweat Belt (Waist Trimmer)**.

---

## 🗂️ Project Structure

```
fitcore-sweat-belt-store/
├── index.html        ← Frontend (all pages/sections)
├── style.css         ← Styles (mobile-first, premium design)
├── app.js            ← Frontend JavaScript (form, animations, WA)
├── server.js         ← Backend (Express API + order storage)
├── package.json      ← Node.js dependencies
├── orders.json       ← Auto-created: order database (JSON)
└── README.md         ← This file
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- **Node.js** v18+ — https://nodejs.org
- **npm** (comes with Node)

### Steps

```bash
# 1. Go into the project folder
cd fitcore-sweat-belt-store

# 2. Install dependencies
npm install

# 3. Start the server
npm start
# OR for auto-reload during development:
npm run dev

# 4. Open in browser
# http://localhost:3000
```

The frontend and backend are served from the same port. Orders are saved to `orders.json` automatically.

---

## 📱 WhatsApp Order Flow

1. Customer fills the checkout form
2. Frontend validates inputs (name, phone, address, pincode)
3. On submit → POST to `/api/orders` (saves to DB)
4. Server returns a WhatsApp URL with pre-filled order details
5. Customer is redirected to WhatsApp chat with your number: **+91 9354863194**
6. You receive the order message and confirm manually

---

## 🔧 Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `ADMIN_SECRET` | `fitcore2025admin` | Password to view orders at `/api/orders?secret=...` |
| `ALLOWED_ORIGIN` | `*` | CORS origin (set to your domain in production) |

Set via environment variables:
```bash
PORT=8080 ADMIN_SECRET=mysecret node server.js
```

---

## 📦 API Endpoints

### `POST /api/orders`
Place a new order.

**Request body:**
```json
{
  "name": "Rohit Sharma",
  "phone": "9876543210",
  "address": "123, MG Road, Jaipur",
  "pincode": "302001",
  "qty": "1"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "FC1701234567890123",
  "whatsappUrl": "https://wa.me/919354863194?text=...",
  "order": { ... }
}
```

### `GET /api/orders?secret=fitcore2025admin`
View all orders (admin only).

### `GET /api/health`
Health check.

---

## 🚢 Deployment Options

### Option A — Railway (Recommended, Free Tier)

1. Push project to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Set environment variables in Railway dashboard
4. Railway auto-detects Node.js and deploys

### Option B — Render

1. Push to GitHub
2. Go to https://render.com → New → Web Service
3. Connect repo, set `npm start` as start command
4. Deploy

### Option C — VPS (DigitalOcean / Hostinger)

```bash
# On your server
git clone <your-repo>
cd fitcore-sweat-belt-store
npm install --production
npm install -g pm2
pm2 start server.js --name fitcore
pm2 save
pm2 startup
```

Then point your domain/Nginx to port 3000.

### Option D — Static Frontend Only (No Backend)

The site works **without the backend**. If `/api/orders` fails, it still redirects to WhatsApp directly. Just open `index.html` in a browser or host it on:
- **Netlify** (drag & drop the folder)
- **Vercel** (static site)
- **GitHub Pages**

---

## 🔒 Security Features

- **Helmet.js** — HTTP security headers
- **Rate limiting** — 5 orders per IP per 10 minutes
- **express-validator** — Server-side input validation
- **Frontend validation** — Name, phone (10-digit), address, pincode (6-digit)
- **Spam detection** — Blocks rapid repeat submissions
- **Input length limits** — Prevents oversized payloads
- **CORS control** — Set `ALLOWED_ORIGIN` to your domain

---

## 📈 Upgrading the Database

The default `orders.json` is fine for early sales. When you grow:

**MongoDB (Atlas)**:
```js
// Replace saveOrder() with:
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI);
await client.db('fitcore').collection('orders').insertOne(order);
```

**Firebase Firestore**:
```js
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
await getFirestore().collection('orders').add(order);
```

---

## 🎨 Customization

| Change | Where |
|---|---|
| WhatsApp number | `server.js` line 11 & `app.js` line 92 |
| Product price | `index.html` (₹499/₹999) + `server.js` (qty * 499) |
| Brand name | `index.html` → `.brand` element |
| Colors | `style.css` → `:root` CSS variables |
| Product images | `index.html` → `<img src="...">` tags (replace Unsplash URLs with your own) |
| Admin secret | `ADMIN_SECRET` env variable |

---

## 📞 Support

WhatsApp: https://wa.me/919354863194

---

*Built with ❤️ for Indian D2C eCommerce. COD-first, mobile-first.*

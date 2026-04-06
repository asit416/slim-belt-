/**
 * FitCore Sweat Belt — Backend Server
 * Node.js + Express
 * Handles order storage, validation & WhatsApp redirect
 */

'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const WA_NUMBER = '919354863194';

/* ---- MIDDLEWARE ---- */
app.use(helmet({
  contentSecurityPolicy: false, // allow Google Fonts & CDN
}));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

/* ---- RATE LIMITING ---- */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 orders per 10 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many order attempts. Please wait 10 minutes.' },
});

app.use('/api/', generalLimiter);

/* ---- SIMPLE FILE-BASED DB (replace with real DB in production) ---- */
const DB_FILE = path.join(__dirname, 'orders.json');

function loadOrders() {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveOrder(order) {
  const orders = loadOrders();
  orders.push(order);
  fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2), 'utf8');
  return order;
}

/* ---- BUILD WHATSAPP URL ---- */
function buildWhatsAppUrl(order) {
  const qty = parseInt(order.qty) || 1;
  const price = qty * 499;
  const saved = qty * 500;

  const lines = [
    '🛒 *NEW ORDER — FitCore Sweat Belt*',
    '━━━━━━━━━━━━━━━━━━━',
    `*Product:* Adjustable Sweat Belt (Waist Trimmer)`,
    `*Quantity:* ${qty} unit${qty > 1 ? 's' : ''}`,
    `*Amount:* ₹${price} (COD)`,
    `*You Saved:* ₹${saved}`,
    '━━━━━━━━━━━━━━━━━━━',
    `*Customer Name:* ${order.name}`,
    `*Phone:* +91${order.phone}`,
    `*Address:* ${order.address}`,
    `*Pincode:* ${order.pincode}`,
    '━━━━━━━━━━━━━━━━━━━',
    `*Payment:* Cash on Delivery`,
    `*Order ID:* ${order.orderId}`,
    `*Date:* ${new Date(order.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
    '',
    'Please confirm this order. Thank you! 🙏',
  ];

  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}

/* ---- VALIDATION RULES ---- */
const orderValidationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters.')
    .matches(/^[a-zA-Z\s.''-]+$/).withMessage('Name contains invalid characters.'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(/^\d{10}$/).withMessage('Enter a valid 10-digit phone number.')
    .custom(v => !/^(.)\1{9}$/.test(v)).withMessage('Enter a valid phone number.'),

  body('address')
    .trim()
    .notEmpty().withMessage('Address is required.')
    .isLength({ min: 10, max: 300 }).withMessage('Address must be 10–300 characters.'),

  body('pincode')
    .trim()
    .notEmpty().withMessage('Pincode is required.')
    .matches(/^\d{6}$/).withMessage('Enter a valid 6-digit pincode.'),

  body('qty')
    .optional()
    .isIn(['1', '2', '3']).withMessage('Invalid quantity.'),
];

/* ---- ROUTES ---- */

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /api/orders — Create new order
app.post('/api/orders', orderLimiter, orderValidationRules, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }

  const { name, phone, address, pincode, qty = '1' } = req.body;
  const quantity = parseInt(qty);

  const order = {
    orderId: `FC${Date.now()}${Math.floor(Math.random() * 1000)}`,
    name,
    phone,
    address,
    pincode,
    qty: quantity,
    product: 'Adjustable Sweat Belt (Waist Trimmer)',
    price: quantity * 499,
    mrp: quantity * 999,
    saved: quantity * 500,
    paymentMode: 'COD',
    status: 'pending',
    timestamp: new Date().toISOString(),
    ip: req.ip,
  };

  try {
    saveOrder(order);
    console.log(`[ORDER] ${order.orderId} | ${order.name} | ₹${order.price} | ${order.pincode}`);
  } catch (err) {
    console.error('[DB ERROR]', err.message);
    // Don't block the user — still return success with WA URL
  }

  const waUrl = buildWhatsAppUrl(order);

  return res.status(201).json({
    success: true,
    message: 'Order received! Redirecting to WhatsApp.',
    orderId: order.orderId,
    whatsappUrl: waUrl,
    order: {
      orderId: order.orderId,
      name: order.name,
      qty: order.qty,
      price: order.price,
      status: order.status,
    },
  });
});

// GET /api/orders — Admin view (protect in production with auth!)
app.get('/api/orders', (req, res) => {
  const secret = req.query.secret;
  if (secret !== (process.env.ADMIN_SECRET || 'fitcore2025admin')) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }
  const orders = loadOrders();
  res.json({ success: true, count: orders.length, orders });
});

/* ---- SPA FALLBACK ---- */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ---- ERROR HANDLER ---- */
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

/* ---- START ---- */
app.listen(PORT, () => {
  console.log('');
  console.log('  🏋️  FitCore Sweat Belt — Server Running');
  console.log(`  📡 http://localhost:${PORT}`);
  console.log(`  📦 Orders saved to: ${DB_FILE}`);
  console.log(`  📱 WhatsApp: +${WA_NUMBER}`);
  console.log('');
});

module.exports = app;

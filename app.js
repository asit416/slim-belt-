/* =============================================
   FITCORE SWEAT BELT — app.js
   Form validation, WhatsApp redirect, UI logic
   ============================================= */

'use strict';

/* ---- HERO IMAGE SWITCHER ---- */
function switchHero(thumbEl, imgSrc) {
  const mainImg = document.getElementById('heroMain');
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
  mainImg.style.opacity = '0';
  setTimeout(() => {
    mainImg.src = imgSrc;
    mainImg.style.opacity = '1';
  }, 200);
  mainImg.style.transition = 'opacity 0.2s ease';
}

/* ---- FAQ ACCORDION ---- */
function toggleFaq(btn) {
  const allBtns = document.querySelectorAll('.faq-q');
  const allAnswers = document.querySelectorAll('.faq-a');
  const answer = btn.nextElementSibling;
  const isOpen = answer.classList.contains('open');

  // Close all
  allBtns.forEach(b => b.classList.remove('open'));
  allAnswers.forEach(a => a.classList.remove('open'));

  // Open clicked if it was closed
  if (!isOpen) {
    btn.classList.add('open');
    answer.classList.add('open');
  }
}

/* ---- SCROLL ANIMATIONS ---- */
function initScrollAnimations() {
  const elements = document.querySelectorAll(
    '.use-card, .feat-card, .review-card, .benefit-row, .gallery-item, .faq-item, .trust-item'
  );
  elements.forEach(el => el.classList.add('fade-up'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, i * 60);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}

/* ---- STICKY BAR VISIBILITY ---- */
function initStickyBar() {
  const stickyBar = document.getElementById('stickyBar');
  const hero = document.querySelector('.hero');

  const io = new IntersectionObserver(
    ([entry]) => {
      // Show sticky bar when hero is out of view
      stickyBar.style.transform = entry.isIntersecting ? 'translateY(100%)' : 'translateY(0)';
    },
    { threshold: 0 }
  );
  stickyBar.style.transition = 'transform 0.3s ease';
  stickyBar.style.transform = 'translateY(0)';
  io.observe(hero);
}

/* ---- FORM VALIDATION ---- */
function validateField(id, errorId, validator) {
  const el = document.getElementById(id);
  const errEl = document.getElementById(errorId);
  const wrap = id === 'phone' ? el.closest('.phone-wrap') : el;

  const val = el.value.trim();
  const result = validator(val);

  if (!result.valid) {
    el.classList.add('error');
    if (wrap && wrap !== el) wrap.classList.add('error');
    errEl.textContent = result.msg;
    return false;
  }

  el.classList.remove('error');
  if (wrap && wrap !== el) wrap.classList.remove('error');
  errEl.textContent = '';
  return true;
}

const validators = {
  name: (v) => {
    if (!v) return { valid: false, msg: 'Name is required.' };
    if (v.length < 2) return { valid: false, msg: 'Name must be at least 2 characters.' };
    if (!/^[a-zA-Z\s.'-]+$/.test(v)) return { valid: false, msg: 'Please enter a valid name.' };
    return { valid: true };
  },
  phone: (v) => {
    if (!v) return { valid: false, msg: 'Phone number is required.' };
    if (!/^\d{10}$/.test(v)) return { valid: false, msg: 'Enter a valid 10-digit mobile number.' };
    if (/^(.)\1{9}$/.test(v)) return { valid: false, msg: 'Please enter a real phone number.' };
    return { valid: true };
  },
  address: (v) => {
    if (!v) return { valid: false, msg: 'Address is required.' };
    if (v.length < 10) return { valid: false, msg: 'Please enter your complete address.' };
    return { valid: true };
  },
  pincode: (v) => {
    if (!v) return { valid: false, msg: 'Pincode is required.' };
    if (!/^\d{6}$/.test(v)) return { valid: false, msg: 'Enter a valid 6-digit pincode.' };
    return { valid: true };
  },
};

function validateAll() {
  const n = validateField('name', 'nameErr', validators.name);
  const p = validateField('phone', 'phoneErr', validators.phone);
  const a = validateField('address', 'addressErr', validators.address);
  const pc = validateField('pincode', 'pincodeErr', validators.pincode);
  return n && p && a && pc;
}

/* ---- SPAM PROTECTION ---- */
const submissionState = { count: 0, lastTime: 0 };

function checkSpam() {
  const now = Date.now();
  if (now - submissionState.lastTime < 5000 && submissionState.count >= 2) {
    return true; // too fast
  }
  submissionState.count++;
  submissionState.lastTime = now;
  return false;
}

/* ---- BUILD WHATSAPP MESSAGE ---- */
function buildWhatsAppMessage(data) {
  const qty = parseInt(data.qty);
  const price = qty * 499;
  const saved = qty * 500;

  const msg = [
    '🛒 *NEW ORDER — FitCore Sweat Belt*',
    '━━━━━━━━━━━━━━━━━━━',
    `*Product:* Adjustable Sweat Belt (Waist Trimmer)`,
    `*Quantity:* ${qty} unit${qty > 1 ? 's' : ''}`,
    `*Amount:* ₹${price} (COD)`,
    `*You Saved:* ₹${saved}`,
    '━━━━━━━━━━━━━━━━━━━',
    `*Customer Name:* ${data.name}`,
    `*Phone:* +91${data.phone}`,
    `*Address:* ${data.address}`,
    `*Pincode:* ${data.pincode}`,
    '━━━━━━━━━━━━━━━━━━━',
    `*Payment:* Cash on Delivery`,
    `*Date:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
    '',
    'Please confirm this order. Thank you! 🙏',
  ].join('\n');

  return encodeURIComponent(msg);
}

/* ---- SEND TO BACKEND (optional, fallback to direct WA) ---- */
async function sendToBackend(data) {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json;
  } catch (err) {
    // Backend not available — continue with WhatsApp redirect
    console.warn('Backend unavailable, proceeding with WhatsApp redirect.');
    return { success: false, fallback: true };
  }
}

/* ---- FORM SUBMIT ---- */
async function handleSubmit(e) {
  e.preventDefault();

  if (!validateAll()) {
    // Scroll to first error
    const firstError = document.querySelector('.error');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  if (checkSpam()) {
    alert('Please wait a moment before submitting again.');
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  const submitText = document.getElementById('submitText');
  const submitLoader = document.getElementById('submitLoader');

  // Loading state
  submitBtn.disabled = true;
  submitText.style.display = 'none';
  submitLoader.style.display = 'inline';

  const formData = {
    name: document.getElementById('name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    address: document.getElementById('address').value.trim(),
    pincode: document.getElementById('pincode').value.trim(),
    qty: document.getElementById('qty').value,
    product: 'Adjustable Sweat Belt (Waist Trimmer)',
    price: parseInt(document.getElementById('qty').value) * 499,
    timestamp: new Date().toISOString(),
  };

  // Try backend first
  await sendToBackend(formData);

  // Always redirect to WhatsApp
  const waNumber = '919354863194';
  const msg = buildWhatsAppMessage(formData);
  const waUrl = `https://wa.me/${waNumber}?text=${msg}`;

  // Show modal briefly then redirect
  showModal();

  setTimeout(() => {
    window.open(waUrl, '_blank');
    // Reset form
    document.getElementById('orderForm').reset();
    submitBtn.disabled = false;
    submitText.style.display = 'inline';
    submitLoader.style.display = 'none';
    submissionState.count = 0;
  }, 1500);
}

/* ---- MODAL ---- */
function showModal() {
  document.getElementById('modalOverlay').classList.add('active');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}
// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.id === 'modalOverlay') closeModal();
});

/* ---- REAL-TIME VALIDATION ---- */
function initRealtimeValidation() {
  document.getElementById('name').addEventListener('blur', () =>
    validateField('name', 'nameErr', validators.name)
  );
  document.getElementById('phone').addEventListener('blur', () =>
    validateField('phone', 'phoneErr', validators.phone)
  );
  document.getElementById('address').addEventListener('blur', () =>
    validateField('address', 'addressErr', validators.address)
  );
  document.getElementById('pincode').addEventListener('blur', () =>
    validateField('pincode', 'pincodeErr', validators.pincode)
  );

  // Only allow digits for phone and pincode
  document.getElementById('phone').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
  });
  document.getElementById('pincode').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
  });
}

/* ---- SMOOTH ANCHOR SCROLL ---- */
function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initStickyBar();
  initRealtimeValidation();
  initSmoothAnchors();
  document.getElementById('orderForm').addEventListener('submit', handleSubmit);

  // Close modal on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
});

/* ==========================================================
   SITE SETTINGS — fill these in before launch
   ========================================================== */
const CONFIG = {
  // Consultation booking page (TidyCal, Calendly, etc.). Empty = buttons scroll to the enquiry form.
  bookingUrl: '',
  // WhatsApp number in international format, digits only (e.g. 233241234567). Empty = WhatsApp links hidden.
  whatsappNumber: '233000000000',
  whatsappMessage: 'Hi Zohar Central! I’d love to chat about an upcoming celebration.',
  // Form endpoint (e.g. https://formspree.io/f/xxxxxxx). Empty = form opens a pre-filled email instead.
  formEndpoint: '',
  email: 'hello@zoharcentral.com',
  // Budget ranges shown in the enquiry form, by location (placeholders — adjust to your pricing).
  budgets: {
    Ghana: ['Under GH₵ 50,000', 'GH₵ 50,000 – 150,000', 'GH₵ 150,000 – 300,000', 'GH₵ 300,000+'],
    Canada: ['Under CA$ 15,000', 'CA$ 15,000 – 40,000', 'CA$ 40,000 – 80,000', 'CA$ 80,000+'],
    Elsewhere: ['Under US$ 10,000', 'US$ 10,000 – 30,000', 'US$ 30,000 – 60,000', 'US$ 60,000+'],
  },
};

document.documentElement.classList.add('js');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Booking & WhatsApp links ---------- */
if (CONFIG.bookingUrl) {
  document.querySelectorAll('[data-book]').forEach((a) => {
    a.href = CONFIG.bookingUrl;
    a.target = '_blank';
    a.rel = 'noopener';
  });
}
const waLinks = document.querySelectorAll('[data-whatsapp]');
if (CONFIG.whatsappNumber) {
  const waHref = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(CONFIG.whatsappMessage)}`;
  waLinks.forEach((a) => { a.href = waHref; a.target = '_blank'; a.rel = 'noopener'; });
} else {
  waLinks.forEach((a) => (a.closest('dl > div') || a).remove());
}
const waFab = document.querySelector('.wa-fab');

/* ---------- Mobile menu ---------- */
const nav = document.querySelector('.nav');
const menuBtn = document.getElementById('menu-btn');
const navLinks = document.getElementById('nav-links');
menuBtn.addEventListener('click', () => {
  const open = menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.setAttribute('aria-expanded', String(!open));
  navLinks.classList.toggle('is-open', !open);
});
navLinks.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    menuBtn.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('is-open');
  })
);

/* ---------- Split headings into words ---------- */
function splitWords(el) {
  let i = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement('span');
          w.className = 'w';
          const inner = document.createElement('span');
          inner.textContent = part;
          inner.style.setProperty('--i', i++);
          w.appendChild(inner);
          frag.appendChild(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(el);
}
if (!reduceMotion) document.querySelectorAll('.split').forEach(splitWords);

/* ---------- Reveal on scroll ---------- */
const revealables = document.querySelectorAll('.reveal, .split, .img-reveal, .rule-draw');
let stagger = 0;
revealables.forEach((el) => {
  if (el.closest('.hero-photos')) return; // hero has its own choreography
  if (el.classList.contains('reveal') || el.classList.contains('img-reveal')) {
    el.style.setProperty('--d', `${(stagger++ % 4) * 80}ms`);
  }
});
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  revealables.forEach((el) => io.observe(el));
} else {
  revealables.forEach((el) => el.classList.add('is-visible'));
}

/* ---------- Scroll-linked motion: smart nav, parallax, drift, WhatsApp button ---------- */
const parallaxEls = [...document.querySelectorAll('[data-speed]')];
const venueImg = document.querySelector('.venue-photo img');
const stLines = [...document.querySelectorAll('.st-line')];
const statement = document.querySelector('.statement');
const enquireSection = document.getElementById('enquire');
let lastY = window.scrollY;
let ticking = false;

function progressThrough(el, vh) {
  // -1 when the element is just below the viewport, 1 when just above it
  const r = el.getBoundingClientRect();
  return (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2) * -1;
}

function onFrame() {
  ticking = false;
  const y = window.scrollY;
  const vh = window.innerHeight;

  // Smart nav
  nav.classList.toggle('is-scrolled', y > 10);
  if (Math.abs(y - lastY) > 6) {
    const hide = y > lastY && y > 400 && !navLinks.classList.contains('is-open');
    nav.classList.toggle('is-hidden', hide);
    lastY = y;
  }

  // WhatsApp button: show after the hero, step aside while the enquiry form is on screen
  if (waFab && CONFIG.whatsappNumber) {
    const er = enquireSection.getBoundingClientRect();
    const formInView = er.top < vh * 0.6 && er.bottom > vh * 0.4;
    waFab.classList.toggle('is-shown', y > vh * 0.8 && !formInView);
  }

  if (reduceMotion) return;

  // Hero arch parallax (desktop layout only), capped so it never collides with the copy above
  const wide = window.innerWidth > 860;
  if (y < vh * 1.5) {
    parallaxEls.forEach((el) => {
      const off = wide ? -Math.min(y * parseFloat(el.dataset.speed), 60) : 0;
      el.style.translate = off ? `0 ${off.toFixed(1)}px` : '';
    });
  }

  // Venue photo parallax
  if (venueImg) {
    const box = venueImg.parentElement.getBoundingClientRect();
    if (box.bottom > 0 && box.top < vh) {
      const p = Math.max(-1, Math.min(1, progressThrough(venueImg.parentElement, vh)));
      venueImg.style.translate = `0 ${(p * 7).toFixed(2)}%`;
    }
  }

  // Statement lines drift apart
  if (statement) {
    const box = statement.getBoundingClientRect();
    if (box.bottom > 0 && box.top < vh) {
      const p = Math.max(-1, Math.min(1, progressThrough(statement, vh)));
      const amp = Math.min(80, window.innerWidth * 0.05);
      stLines.forEach((line) => {
        line.style.translate = `${(p * amp * parseFloat(line.dataset.drift)).toFixed(1)}px 0`;
      });
    }
  }
}
function requestFrame() {
  if (!ticking) { ticking = true; requestAnimationFrame(onFrame); }
}
window.addEventListener('scroll', requestFrame, { passive: true });
window.addEventListener('resize', requestFrame);
onFrame();

/* ---------- Magnetic buttons ---------- */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.pill, .round-btn').forEach((el) => {
    const strength = el.classList.contains('pill--wide') ? 0.06 : 0.2;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.translate = `${(x * strength).toFixed(1)}px ${(y * strength * 1.4).toFixed(1)}px`;
    });
    el.addEventListener('mouseleave', () => { el.style.translate = ''; });
  });
}

/* ---------- Testimonials (auto-rotate, pausable) ---------- */
const kindWords = document.getElementById('kind-words');
const quotes = [...document.querySelectorAll('.quote')];
const dotsWrap = document.getElementById('q-dots');
const qTimer = document.getElementById('q-timer');
const pauseBtn = document.getElementById('q-pause');
const AUTOPLAY_MS = 6500;
let current = 0;
let timer = null;
let userPaused = reduceMotion;
let hoverPaused = false;
let inView = false;

const dots = quotes.map((q, i) => {
  const b = document.createElement('button');
  const who = q.querySelector('.who > span')?.textContent || `Testimonial ${i + 1}`;
  b.setAttribute('role', 'tab');
  b.setAttribute('aria-label', who);
  b.innerHTML = `<svg aria-hidden="true"><use href="#${q.dataset.avatar}"/></svg>`;
  b.addEventListener('click', () => { show(i); restart(); });
  dotsWrap.appendChild(b);
  return b;
});

function show(i) {
  current = (i + quotes.length) % quotes.length;
  quotes.forEach((q, n) => q.classList.toggle('is-active', n === current));
  dots.forEach((d, n) => d.setAttribute('aria-selected', String(n === current)));
}
const canPlay = () => !userPaused && !hoverPaused && inView;
function stop() {
  clearInterval(timer);
  timer = null;
  qTimer.classList.remove('run');
}
function restart() {
  stop();
  if (!canPlay()) return;
  timer = setInterval(() => { show(current + 1); runTimer(); }, AUTOPLAY_MS);
  runTimer();
}
function runTimer() {
  qTimer.classList.remove('run');
  void qTimer.offsetWidth; // restart the CSS animation
  qTimer.classList.add('run');
}
function sync() { if (canPlay() && !timer) restart(); else if (!canPlay()) stop(); }

pauseBtn.setAttribute('aria-pressed', String(userPaused));
pauseBtn.setAttribute('aria-label', userPaused ? 'Play testimonials' : 'Pause testimonials');
pauseBtn.addEventListener('click', () => {
  userPaused = !userPaused;
  pauseBtn.setAttribute('aria-pressed', String(userPaused));
  pauseBtn.setAttribute('aria-label', userPaused ? 'Play testimonials' : 'Pause testimonials');
  sync();
});
kindWords.addEventListener('mouseenter', () => { hoverPaused = true; sync(); });
kindWords.addEventListener('mouseleave', () => { hoverPaused = false; sync(); });
kindWords.addEventListener('focusin', () => { hoverPaused = true; sync(); });
kindWords.addEventListener('focusout', (e) => {
  if (!kindWords.contains(e.relatedTarget)) { hoverPaused = false; sync(); }
});
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, { threshold: 0.3 }).observe(kindWords);
} else {
  inView = true;
}
document.getElementById('q-prev').addEventListener('click', () => { show(current - 1); restart(); });
document.getElementById('q-next').addEventListener('click', () => { show(current + 1); restart(); });
show(0);
sync();

/* ---------- Pricing currency toggle ---------- */
const currencyBtns = document.querySelectorAll('[data-currency]');
function setCurrency(code, animate = true) {
  currencyBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.currency === code)));
  document.querySelectorAll('.price').forEach((el) => {
    const next = el.dataset[code];
    if (!animate || reduceMotion) { el.textContent = next; return; }
    el.classList.add('is-swapping');
    setTimeout(() => { el.textContent = next; el.classList.remove('is-swapping'); }, 220);
  });
}
currencyBtns.forEach((b) => b.addEventListener('click', () => setCurrency(b.dataset.currency)));
// Visitors in the Americas likely want Canadian dollars first
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
if (tz.startsWith('America/')) setCurrency('cad', false);

/* ---------- Enquiry form ---------- */
const form = document.getElementById('enquiry-form');
const status = document.getElementById('form-status');
const whereSel = document.getElementById('f-where');
const budgetSel = document.getElementById('f-budget');
const typeSel = document.getElementById('f-type');
const msgField = document.getElementById('f-msg');

function fillBudgets() {
  const list = CONFIG.budgets[whereSel.value] || [];
  budgetSel.innerHTML = '';
  [...list, 'Not sure yet'].forEach((label) => budgetSel.add(new Option(label, label)));
}
whereSel.addEventListener('change', fillBudgets);
if (tz.startsWith('America/')) whereSel.value = 'Canada';
fillBudgets();

// Buttons that pre-fill the enquiry (e.g. "Book the venue", pricing tiers)
document.querySelectorAll('[data-prefill]').forEach((a) => {
  a.addEventListener('click', () => {
    const key = a.dataset.prefill;
    if (key === 'venue') {
      msgField.value = 'We’d love to arrange a site visit at the Zohar Garden.';
    } else if (key === 'pricing') {
      msgField.value = 'Please send me your full pricing guide.';
    } else {
      msgField.value = `I’m interested in ${key}.`;
    }
    setTimeout(() => document.getElementById('f-name').focus({ preventScroll: true }), 700);
  });
});

function setStatus(text, isError = false) {
  status.textContent = text;
  status.classList.toggle('is-error', isError);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  let ok = true;
  form.querySelectorAll('[required]').forEach((input) => {
    const valid = input.value.trim() !== '' && input.checkValidity();
    input.closest('.field').classList.toggle('is-invalid', !valid);
    if (!valid) ok = false;
  });
  if (!ok) {
    setStatus('Please add your name and a valid email so we can reply.', true);
    form.querySelector('.is-invalid input')?.focus();
    return;
  }

  const data = new FormData(form);
  const name = String(data.get('name')).trim().split(' ')[0];
  const thanks = `Thank you, ${name} — your enquiry is on its way. We’ll be in touch within two working days. ✦`;

  // Spam trap filled → pretend success, send nothing
  if (data.get('_gotcha')) { setStatus(thanks); form.reset(); fillBudgets(); return; }

  if (CONFIG.formEndpoint) {
    form.classList.add('is-sending');
    setStatus('Sending…');
    try {
      const res = await fetch(CONFIG.formEndpoint, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus(thanks);
      form.reset();
      fillBudgets();
    } catch {
      setStatus(`Sorry — something went wrong. Please email us at ${CONFIG.email} or message us on WhatsApp.`, true);
    } finally {
      form.classList.remove('is-sending');
    }
    return;
  }

  // No endpoint yet: open a pre-filled email
  const lines = [
    `Name: ${data.get('name')}`,
    `Email: ${data.get('email')}`,
    `Phone / WhatsApp: ${data.get('phone') || '—'}`,
    `Occasion: ${data.get('occasion')}`,
    `Where: ${data.get('location')}`,
    `Budget: ${data.get('budget')}`,
    `Date: ${data.get('date') || '—'}`,
    `Guests: ${data.get('guests') || '—'}`,
    '',
    String(data.get('message') || ''),
  ];
  const subject = `Enquiry — ${data.get('occasion')} — ${data.get('name')}`;
  window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  setStatus('Opening your email app with your enquiry ready to send…');
});

/* ---------- Gallery lightbox ---------- */
const lb = document.getElementById('lightbox');
const galleryLinks = [...document.querySelectorAll('.g-link')];
if (lb && typeof lb.showModal === 'function' && galleryLinks.length) {
  const lbImg = document.getElementById('lb-img');
  const lbCap = document.getElementById('lb-cap');
  const lbCount = document.getElementById('lb-count');
  let idx = 0;
  const open = (i) => {
    idx = (i + galleryLinks.length) % galleryLinks.length;
    const link = galleryLinks[idx];
    const img = link.querySelector('img');
    lbImg.src = link.getAttribute('href');
    lbImg.alt = img.alt;
    lbImg.style.animation = 'none';
    void lbImg.offsetWidth;
    lbImg.style.animation = '';
    lbCap.textContent = link.closest('figure').querySelector('.photo-tag')?.textContent || '';
    lbCount.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(galleryLinks.length).padStart(2, '0')}`;
    if (!lb.open) { lb.showModal(); document.body.style.overflow = 'hidden'; }
  };
  galleryLinks.forEach((link, i) => link.addEventListener('click', (e) => { e.preventDefault(); open(i); }));
  document.getElementById('lb-prev').addEventListener('click', () => open(idx - 1));
  document.getElementById('lb-next').addEventListener('click', () => open(idx + 1));
  document.getElementById('lb-close').addEventListener('click', () => lb.close());
  lb.addEventListener('close', () => {
    document.body.style.overflow = '';
    galleryLinks[idx].focus({ preventScroll: true });
  });
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lb-figure')) lb.close(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') open(idx + 1);
    if (e.key === 'ArrowLeft') open(idx - 1);
  });
  // Swipe on touch screens
  let sx = null;
  lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) open(idx + (dx < 0 ? 1 : -1));
    sx = null;
  });
}

document.getElementById('year').textContent = new Date().getFullYear();

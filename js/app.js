// ============================================
// CONFIG
// ============================================
const FRAME_COUNT = 192;
const IMAGE_SCALE = 0.88;
const PRELOAD_COUNT = 10;

// ============================================
// STATE
// ============================================
const frames = [];
let currentFrame = 0;
let canvas, ctx, canvasContainer;
let bgColor = '#000000';
let loadedCount = 0;
let videoScrollActive = false;

// ============================================
// BOOT
// ============================================
window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d', { alpha: false });
  canvasContainer = document.getElementById('canvas-container');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  preloadFrames();
});

// ============================================
// CANVAS RESIZE — full viewport, fixed
// ============================================
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = window.innerWidth  * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width  = window.innerWidth  + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.scale(dpr, dpr);
  if (frames[currentFrame]) drawFrame(currentFrame);
}

// ============================================
// PRELOADER
// ============================================
function preloadFrames() {
  const fill    = document.getElementById('loader-fill');
  const percent = document.getElementById('loader-percent');

  function loadOne(i) {
    return new Promise(resolve => {
      const img = new Image();
      img.src = `frames/frame_${String(i).padStart(4,'0')}.webp`;
      img.onload = () => {
        frames[i - 1] = img;
        loadedCount++;
        const p = Math.floor((loadedCount / FRAME_COUNT) * 100);
        fill.style.width = p + '%';
        percent.textContent = p + '%';
        if (i === 1) sampleBg(img);
        resolve();
      };
      img.onerror = () => { loadedCount++; resolve(); };
    });
  }

  // First 10 fast, then rest in background
  const first = [];
  for (let i = 1; i <= PRELOAD_COUNT; i++) first.push(loadOne(i));

  Promise.all(first).then(() => {
    drawFrame(0);
    const rest = [];
    for (let i = PRELOAD_COUNT + 1; i <= FRAME_COUNT; i++) rest.push(loadOne(i));
    Promise.all(rest).then(onReady);
  });
}

function onReady() {
  const loader = document.getElementById('loader');
  loader.style.transition = 'opacity 0.6s ease';
  loader.style.opacity = '0';
  setTimeout(() => {
    loader.style.display = 'none';
    initSite();
  }, 650);
}

// ============================================
// BACKGROUND SAMPLING
// ============================================
function sampleBg(img) {
  const tmp = document.createElement('canvas');
  tmp.width = img.naturalWidth; tmp.height = img.naturalHeight;
  const tc = tmp.getContext('2d');
  tc.drawImage(img, 0, 0);
  const pts = [
    tc.getImageData(5, 5, 1, 1).data,
    tc.getImageData(img.naturalWidth - 5, 5, 1, 1).data,
    tc.getImageData(5, img.naturalHeight - 5, 1, 1).data,
    tc.getImageData(img.naturalWidth - 5, img.naturalHeight - 5, 1, 1).data
  ];
  let r=0,g=0,b=0;
  pts.forEach(p => { r+=p[0]; g+=p[1]; b+=p[2]; });
  bgColor = `rgb(${Math.floor(r/4)},${Math.floor(g/4)},${Math.floor(b/4)})`;
}

// ============================================
// DRAW FRAME
// ============================================
function drawFrame(idx) {
  const img = frames[idx];
  if (!img) return;
  const dpr = window.devicePixelRatio || 1;
  const cw = canvas.width / dpr, ch = canvas.height / dpr;
  const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight) * IMAGE_SCALE;
  const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
}

// ============================================
// INIT SITE
// ============================================
function initSite() {
  initLenis();
  animateHero();
  initVideoScroll();
  initSectionAnims();
  initCounters();
}

// ============================================
// LENIS
// ============================================
function initLenis() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

// ============================================
// HERO ANIMATION
// ============================================
function animateHero() {
  const heading = document.querySelector('.hero-heading');
  const sub     = document.querySelector('.hero-sub');
  const hint    = document.querySelector('.scroll-hint');

  gsap.fromTo(heading,
    { y: 40, opacity: 0 },
    { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', delay: 0.2 }
  );
  gsap.fromTo(sub,
    { y: 25, opacity: 0 },
    { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.6 }
  );
  gsap.fromTo(hint,
    { opacity: 0 },
    { opacity: 1, duration: 1, ease: 'power2.out', delay: 1.1 }
  );
}

// ============================================
// VIDEO SCROLL — canvas shows/hides based on
// whether user is in the #video-scroll-space
// ============================================
function initVideoScroll() {
  const hero       = document.getElementById('hero');
  const videoSpace = document.getElementById('video-scroll-space');
  const container  = document.getElementById('canvas-container');

  ScrollTrigger.create({
    trigger: videoSpace,
    start: 'top 80%',
    end: 'bottom bottom',
    scrub: true,
    onEnter:     () => container.classList.add('active'),
    onLeaveBack: () => {
      container.classList.remove('active');
      container.style.clipPath = 'inset(30% 15% 30% 15% round 24px)';
    },
    onUpdate: self => {
      const p = self.progress;

      // 1. Hero fades out in first 15% of scroll
      if (hero) {
        hero.style.opacity = Math.max(0, 1 - p * 10);
      }

      // 2. Canvas expands: starts immediately at p=0, full screen by p=0.25
      const phase   = Math.min(p / 0.25, 1);
      const insetV  = 30 * (1 - phase);
      const insetH  = 15 * (1 - phase);
      const radius  = 24 * (1 - phase);
      container.style.clipPath =
        `inset(${insetV}% ${insetH}% ${insetV}% ${insetH}% round ${radius}px)`;

      // 3. Frame scrubbing across full 300vh
      const idx = Math.min(Math.floor(p * FRAME_COUNT), FRAME_COUNT - 1);
      if (idx !== currentFrame) {
        currentFrame = idx;
        requestAnimationFrame(() => drawFrame(currentFrame));
      }
    }
  });
}

// ============================================
// SECTION ANIMATIONS (Intersection Observer)
// ============================================
function initSectionAnims() {
  // Add .anim class to all animatable elements
  const targets = document.querySelectorAll(
    '#content .label, #content h2, #content p, ' +
    '#content .card, #content .feature, #content .timeline-step, ' +
    '#content .stat-item, #content .team-card, #content .contact-item, ' +
    '#content .inno-stat, #content blockquote, #content .quote-author, ' +
    '#content .cta-btn'
  );

  targets.forEach((el, i) => {
    el.classList.add('anim');
    // Stagger siblings
    const siblings = el.parentElement.querySelectorAll('.anim');
    const idx = Array.from(siblings).indexOf(el);
    if (idx > 0 && idx <= 5) el.classList.add(`anim-delay-${idx}`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  targets.forEach(el => observer.observe(el));
}

// ============================================
// COUNTERS
// ============================================
function initCounters() {
  const nums = document.querySelectorAll('.stat-num[data-target]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      let start = 0;
      const duration = 2000;
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
      };
      requestAnimationFrame(step);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  nums.forEach(el => observer.observe(el));
}

// ============================================
// EXPANDABLE GALLERY — LIGHTBOX
// ============================================
(function () {
  const galleryImages = [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=90&fit=crop',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=90&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=90&fit=crop',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1600&q=90&fit=crop'
  ];

  let currentLightbox = null;

  const lightbox  = document.getElementById('galleryLightbox');
  const lbImg     = document.getElementById('lightboxImg');
  const lbCounter = document.getElementById('lightboxCounter');
  const lbClose   = document.getElementById('lightboxClose');
  const lbPrev    = document.getElementById('lightboxPrev');
  const lbNext    = document.getElementById('lightboxNext');

  if (!lightbox) return;

  // Open lightbox
  function openLightbox(index) {
    currentLightbox = index;
    lbImg.src = galleryImages[index];
    lbCounter.textContent = `${index + 1} / ${galleryImages.length}`;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  // Close lightbox
  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentLightbox = null;
  }

  // Navigate with fade transition
  function goTo(index) {
    const next = (index + galleryImages.length) % galleryImages.length;
    lbImg.classList.add('switching');
    setTimeout(() => {
      currentLightbox = next;
      lbImg.src = galleryImages[next];
      lbCounter.textContent = `${next + 1} / ${galleryImages.length}`;
      lbImg.classList.remove('switching');
    }, 220);
  }

  // Attach click to each gallery item
  document.querySelectorAll('.exp-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.index, 10);
      openLightbox(idx);
    });
  });

  // Controls
  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', (e) => { e.stopPropagation(); goTo(currentLightbox - 1); });
  lbNext.addEventListener('click', (e) => { e.stopPropagation(); goTo(currentLightbox + 1); });

  // Click backdrop to close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowRight')  goTo(currentLightbox + 1);
    if (e.key === 'ArrowLeft')   goTo(currentLightbox - 1);
  });
})();

// ============================================
// BEFORE & AFTER IMAGE COMPARISON SLIDER
// ============================================
(function () {
  const container = document.getElementById('imgComparison');
  if (!container) return;

  const afterImg = container.querySelector('.comparison-img--after');
  const slider   = container.querySelector('.comparison-slider');

  let isDragging = false;
  let currentPos = 50; // percentage

  function setPosition(x) {
    const rect = container.getBoundingClientRect();
    const raw  = ((x - rect.left) / rect.width) * 100;
    const pct  = Math.min(Math.max(raw, 0), 100);
    currentPos = pct;

    // Clip the AFTER image to show only the left portion
    afterImg.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    slider.style.left = `${pct}%`;
  }

  // Mouse events
  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    setPosition(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    setPosition(e.clientX);
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  // Touch events
  container.addEventListener('touchstart', (e) => {
    isDragging = true;
    setPosition(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    setPosition(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchend', () => { isDragging = false; });
})();

// ============================================
// TESTIMONIALS — duplicate cards for seamless infinite scroll
// ============================================
(function () {
  document.querySelectorAll('.testi-track').forEach(track => {
    // Clone all children and append — creates the seamless loop
    const cards = Array.from(track.children);
    cards.forEach(card => {
      const clone = card.cloneNode(true);
      track.appendChild(clone);
    });
  });
})();

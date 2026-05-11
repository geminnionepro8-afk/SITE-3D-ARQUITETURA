// ============================================
// CONFIG
// ============================================
const FRAME_COUNT = 192;
const IMAGE_SCALE = 0.88;
const PRELOAD_COUNT = 10;
const MOBILE_MEDIA_QUERY = '(max-width: 768px)';

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
  const isMobile = window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  const scaleFactor = isMobile ? 0.45 : IMAGE_SCALE;
  const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight) * scaleFactor;
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
// LENIS — smooth scroll otimizado
// ============================================
function initLenis() {
  const lenis = new Lenis({
    duration: 0.9,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(500, 33);    // tolera até 33ms de lag antes de pular
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
// VIDEO SCROLL — otimizado com RAF throttle
// ============================================
function initVideoScroll() {
  const hero       = document.getElementById('hero');
  const videoSpace = document.getElementById('video-scroll-space');
  const container  = document.getElementById('canvas-container');

  let rafPending = false;
  let lastIdx = -1;
  const isMobile = window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  const initialInsetV = isMobile ? 18 : 30;
  const initialInsetH = isMobile ? 2 : 15;
  const initialRadius = isMobile ? 16 : 24;
  const revealEnd = isMobile ? 0.18 : 0.25;

  ScrollTrigger.create({
    trigger: videoSpace,
    start: 'top bottom',
    end: 'bottom bottom',
    scrub: 0.5,                          // suaviza o scrub, reduz chamadas
    onEnter:     () => container.classList.add('active'),
    onEnterBack: () => container.classList.add('active'),
    onLeave:     () => {},
    onLeaveBack: () => {
      container.classList.remove('active');
      container.style.clipPath = `inset(${initialInsetV}% ${initialInsetH}% ${initialInsetV}% ${initialInsetH}% round ${initialRadius}px)`;
      if (hero) hero.style.opacity = '1';
      lastIdx = -1;
    },
    onUpdate: self => {
      const p = self.progress;

      // Clip-path expand
      const phase  = Math.min(p / revealEnd, 1);
      const insetV = initialInsetV * (1 - phase);
      const insetH = initialInsetH * (1 - phase);
      const radius = initialRadius * (1 - phase);
      // Hero só começa a desaparecer quando o vídeo já está aparecendo.
      const heroFade = Math.max(0, 1 - phase * 1.2);
      if (hero) hero.style.opacity = heroFade;
      container.style.clipPath =
        `inset(${insetV}% ${insetH}% ${insetV}% ${insetH}% round ${radius}px)`;

      // Frame scrub — só redesenha se o frame mudou, com RAF único
      const idx = Math.min(Math.floor(p * FRAME_COUNT), FRAME_COUNT - 1);
      if (idx !== lastIdx) {
        lastIdx = idx;
        currentFrame = idx;
        if (!rafPending) {
          rafPending = true;
          requestAnimationFrame(() => {
            drawFrame(currentFrame);
            rafPending = false;
          });
        }
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
// HEADER SCROLL - Transparente → Branco
// ============================================
(function () {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // estado inicial
})();

// ============================================
// GALLERY — expand on hover + lightbox
// ============================================
(function () {
  const track   = document.getElementById('galleryTrack');
  const prevBtn = document.getElementById('galPrev');
  const nextBtn = document.getElementById('galNext');
  if (!track) return;

  const cards = Array.from(track.querySelectorAll('.gal-card'));
  const total = cards.length;
  const perPage = 4; // cards visíveis por vez
  let page = 0;
  const totalPages = Math.ceil(total / perPage);

  function update() {
    cards.forEach((c, i) => {
      const inPage = i >= page * perPage && i < (page + 1) * perPage;
      c.style.display = inPage ? '' : 'none';
    });
    prevBtn.style.opacity = page === 0 ? '0.35' : '1';
    nextBtn.style.opacity = page >= totalPages - 1 ? '0.35' : '1';
  }

  prevBtn.addEventListener('click', () => { if (page > 0) { page--; update(); } });
  nextBtn.addEventListener('click', () => { if (page < totalPages - 1) { page++; update(); } });
  update();

  // Lightbox
  const lightbox  = document.getElementById('galleryLightbox');
  const lbImg     = document.getElementById('lightboxImg');
  const lbCounter = document.getElementById('lightboxCounter');
  const lbClose   = document.getElementById('lightboxClose');
  const lbPrev    = document.getElementById('lightboxPrev');
  const lbNext    = document.getElementById('lightboxNext');
  if (!lightbox) return;

  const images = cards.map(c => c.querySelector('img').src);
  let currentLB = 0;

  function openLB(i) {
    currentLB = i;
    lbImg.src = images[i];
    lbCounter.textContent = `${i + 1} / ${total}`;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLB() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function goLB(i) {
    const next = (i + total) % total;
    lbImg.classList.add('switching');
    setTimeout(() => {
      currentLB = next;
      lbImg.src = images[next];
      lbCounter.textContent = `${next + 1} / ${total}`;
      lbImg.classList.remove('switching');
    }, 220);
  }

  cards.forEach((card, i) => card.addEventListener('click', () => openLB(i)));
  lbClose.addEventListener('click', closeLB);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLB(); });
  lbPrev.addEventListener('click', e => { e.stopPropagation(); goLB(currentLB - 1); });
  lbNext.addEventListener('click', e => { e.stopPropagation(); goLB(currentLB + 1); });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLB();
    if (e.key === 'ArrowRight') goLB(currentLB + 1);
    if (e.key === 'ArrowLeft')  goLB(currentLB - 1);
  });
})();

// ============================================
// BEFORE & AFTER IMAGE COMPARISON SLIDER — otimizado
// ============================================
(function () {
  const container = document.getElementById('imgComparison');
  if (!container) return;

  // Usamos um wrapper interno para a imagem AFTER em vez de clip-path na imagem
  // Isso evita repaint da imagem inteira a cada movimento
  const afterImg  = container.querySelector('.comparison-img--after');
  const slider    = container.querySelector('.comparison-slider');

  let isDragging  = false;
  let rafPending  = false;
  let pendingX    = null;
  let cachedRect  = null;   // cache do getBoundingClientRect
  let currentPos  = 50;

  // Invalida o cache quando a janela redimensiona
  window.addEventListener('resize', () => { cachedRect = null; }, { passive: true });

  function getRect() {
    if (!cachedRect) cachedRect = container.getBoundingClientRect();
    return cachedRect;
  }

  function clamp(val) { return Math.min(Math.max(val, 3), 97); }

  function applyPosition() {
    rafPending = false;
    if (pendingX === null) return;

    const rect = getRect();
    const pct  = clamp(((pendingX - rect.left) / rect.width) * 100);
    currentPos = pct;
    pendingX   = null;

    // Atualiza só a variável CSS — o browser aplica via GPU sem reflow
    slider.style.left = pct + '%';
    container.style.setProperty('--split', pct + '%');
  }

  function scheduleUpdate(x) {
    pendingX = x;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(applyPosition);
    }
  }

  // Init
  container.style.setProperty('--split', '50%');
  slider.style.left = '50%';

  // Mouse
  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    cachedRect = container.getBoundingClientRect(); // captura fresco ao iniciar
    scheduleUpdate(e.clientX);
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    scheduleUpdate(e.clientX);
  }, { passive: true });

  window.addEventListener('mouseup', () => { isDragging = false; });

  // Touch
  container.addEventListener('touchstart', (e) => {
    isDragging = true;
    cachedRect = container.getBoundingClientRect();
    scheduleUpdate(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    scheduleUpdate(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchend', () => { isDragging = false; });
})();

// ============================================
// TESTIMONIALS — duplicate cards for seamless infinite scroll
// ============================================
(function () {
  const tracks = Array.from(document.querySelectorAll('.testi-col-track'));
  if (!tracks.length) return;

  function getGap(track) {
    const styles = window.getComputedStyle(track);
    const rawGap = styles.rowGap !== 'normal' ? styles.rowGap : styles.gap;
    const gap = Number.parseFloat(rawGap || '0');
    return Number.isFinite(gap) ? gap : 0;
  }

  function setScrollDistance(track) {
    const originalCount = Number.parseInt(track.dataset.originalCount || '0', 10);
    if (!originalCount) return;

    const cards = Array.from(track.children).slice(0, originalCount);
    const cardsHeight = cards.reduce((sum, card) => sum + card.offsetHeight, 0);
    const gap = getGap(track);
    const distance = cardsHeight + gap * originalCount;
    track.style.setProperty('--scroll-distance', `${distance}px`);
  }

  tracks.forEach(track => {
    if (track.dataset.loopReady === 'true') return;
    const originals = Array.from(track.children);
    track.dataset.originalCount = String(originals.length);

    originals.forEach(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    track.dataset.loopReady = 'true';
    setScrollDistance(track);
  });

  let resizeRaf = null;
  window.addEventListener('resize', () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      tracks.forEach(setScrollDistance);
      resizeRaf = null;
    });
  });

  window.addEventListener('load', () => {
    tracks.forEach(setScrollDistance);
  });
})();

// ============================================
// FORMULÁRIO — submit handler
// ============================================
function handleFormSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.form-submit-btn');
  btn.textContent = 'Enviado! ✓';
  btn.style.background = '#4caf82';
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = 'Enviar Solicitação <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    btn.style.background = '';
    btn.disabled = false;
    e.target.reset();
  }, 3000);
}


// ============================================
// VISIONARY CAROUSEL + TIMELINE
// ============================================
(function() {
  const track = document.getElementById('visionaryTrack');
  const prevBtn = document.getElementById('visionaryPrev');
  const nextBtn = document.getElementById('visionaryNext');
  const description = document.getElementById('visionaryDescription');
  const timelineSteps = document.querySelectorAll('.timeline-step');
  
  if (!track || !prevBtn || !nextBtn) return;
  
  const cards = Array.from(track.children);
  let currentIndex = 0;
  
  function updateCarousel() {
    // Move o track - cards meio termo (42%)
    const offset = currentIndex * -44.5; // 42% + 2.5% gap
    track.style.transform = `translateX(${offset}%)`;
    
    // Atualiza timeline com animação sofisticada
    timelineSteps.forEach((step, i) => {
      const number = step.querySelector('.timeline-number');
      
      if (i === currentIndex) {
        // Remove a classe primeiro para retriggerar a animação
        step.classList.remove('timeline-step--active');
        // Force reflow para garantir que a animação seja retriggered
        void step.offsetWidth;
        step.classList.add('timeline-step--active');
      } else {
        step.classList.remove('timeline-step--active');
      }
    });
    
    // Atualiza descrição com animação fluida
    const currentCard = cards[currentIndex];
    const newDesc = currentCard.getAttribute('data-description');
    if (newDesc && description) {
      description.style.opacity = '0';
      setTimeout(() => {
        description.textContent = newDesc;
        description.style.opacity = '1';
      }, 300);
    }
    
    // Atualiza escala dos cards
    cards.forEach((card, i) => {
      card.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease';
      
      if (i === currentIndex) {
        // Card ativo (esquerda) - MAIOR
        card.style.transform = 'scale(1.05)';
        card.style.opacity = '1';
        card.style.zIndex = '2';
      } else if (i === currentIndex + 1 || (currentIndex === cards.length - 1 && i === 0)) {
        // Próximo card (direita) - MENOR - com loop infinito
        card.style.transform = 'scale(0.88)';
        card.style.opacity = '0.7';
        card.style.zIndex = '1';
      } else {
        // Cards fora da view
        card.style.transform = 'scale(0.8)';
        card.style.opacity = '0';
        card.style.zIndex = '0';
      }
    });
  }
  
  function goToSlide(index) {
    // Loop infinito: se passar do último, volta pro primeiro; se voltar do primeiro, vai pro último
    if (index >= cards.length) {
      currentIndex = 0;
    } else if (index < 0) {
      currentIndex = cards.length - 1;
    } else {
      currentIndex = index;
    }
    updateCarousel();
  }
  
  prevBtn.addEventListener('click', () => {
    goToSlide(currentIndex - 1);
  });
  
  nextBtn.addEventListener('click', () => {
    goToSlide(currentIndex + 1);
  });
  
  // Timeline clicável
  timelineSteps.forEach((step, i) => {
    step.style.cursor = 'pointer';
    step.addEventListener('click', () => goToSlide(i));
  });
  
  // Inicializa
  updateCarousel();
})();

// ============================================
// TESTIMONIALS — autorotate + animação elástica
// ============================================
(function () {
  const avatarItems  = document.querySelectorAll('.testi-avatar-item');
  const quoteItems   = document.querySelectorAll('.testi-quote-item');
  const pills        = document.querySelectorAll('.testi-pill');

  if (!avatarItems.length) return;

  let active       = 0;
  let autorotate   = true;
  const TIMING     = 7000;
  let interval     = null;

  function goTo(index, stopAuto) {
    if (index === active) return;
    if (stopAuto) {
      autorotate = false;
      clearInterval(interval);
    }

    const prev = active;
    active = index;

    // Avatar: marca o anterior como "leaving" (roda para o outro lado)
    avatarItems[prev].classList.remove('active');
    avatarItems[prev].classList.add('leaving');
    setTimeout(() => avatarItems[prev].classList.remove('leaving'), 700);

    // Avatar: entra o novo
    avatarItems[active].classList.add('active');

    // Quote: marca o anterior como "leaving"
    quoteItems[prev].classList.remove('active');
    quoteItems[prev].classList.add('leaving');
    setTimeout(() => quoteItems[prev].classList.remove('leaving'), 500);

    // Quote: entra o novo
    quoteItems[active].classList.add('active');

    // Pills
    pills.forEach((p, i) => p.classList.toggle('active', i === active));
  }

  function startAutorotate() {
    clearInterval(interval);
    interval = setInterval(() => {
      const next = (active + 1) % avatarItems.length;
      goTo(next, false);
    }, TIMING);
  }

  // Pills clicáveis
  pills.forEach((pill, i) => {
    pill.addEventListener('click', () => goTo(i, true));
  });

  // Inicia autorotate
  startAutorotate();
})();

// ============================================
// FAQ ACCORDION + TABS
// ============================================
(function () {
  const items = document.querySelectorAll('.faq-item');
  const tabs  = document.querySelectorAll('.faq-tab');
  if (!items.length) return;

  // TABS — filtra por categoria
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.category;

      // Atualiza tab ativa
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Fecha todos e mostra só os da categoria
      items.forEach(item => {
        item.classList.remove('open');
        item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');

        if (item.dataset.category === cat) {
          item.classList.remove('faq-item--hidden');
        } else {
          item.classList.add('faq-item--hidden');
        }
      });
    });
  });

  // ACCORDION
  items.forEach(item => {
    const btn = item.querySelector('.faq-question');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Fecha todos os outros visíveis
      items.forEach(other => {
        if (other !== item && !other.classList.contains('faq-item--hidden')) {
          other.classList.remove('open');
          other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }
      });

      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });
})();

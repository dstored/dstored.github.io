document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMegaMenu();
  initMobileNav();
  initScrollAnimations();
  initFAQ();
  initMarquee();
  initLiveCounter();
  initStatCounters();
  initFloatingCardCycle();
  initTypewriters();
  initTypewriterCycle();
  initPhoneCarousels();
  initStreaks();
});

/* ─── Streaks — the ribbon from Emily's value posters, run behind a product
   graphic so it sits on something instead of floating (Danny, 12 Nov 2026).
   Mark the graphic's wrapper with data-streak="blurple" (paper), "pink"
   (navy) or "navy" (pink). The ribbon comes in off the edge beside the
   graphic, passes behind it and leaves through the bottom, away from the
   copy; it is redrawn whenever the layout changes. ─── */
function initStreaks() {
  const graphics = document.querySelectorAll('[data-streak]');
  if (!graphics.length) return;
  const colours = { blurple: 'var(--blurple)', pink: 'var(--hot)', navy: 'var(--ink)' };
  const NS = 'http://www.w3.org/2000/svg';

  const fmt = (p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1);
  const steps = 160;

  // Smooth (Catmull-Rom) centre line through the points
  const centreLine = (pts) => {
    const P = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
    const line = [];
    for (let k = 0; k <= steps; k++) {
      const u = (k / steps) * (pts.length - 1);
      const i = Math.min(Math.floor(u), pts.length - 2);
      const t = u - i;
      const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
      const f = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
      line.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
    return line;
  };

  // The centre line filled out to a ribbon that swells a little in the
  // middle, like the poster streaks
  const ribbon = (pts, thick) => {
    const line = centreLine(pts);
    const left = [];
    const right = [];
    line.forEach((pt, k) => {
      const a = line[Math.max(0, k - 1)];
      const b = line[Math.min(line.length - 1, k + 1)];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = -(b[1] - a[1]) / len;
      const ny = (b[0] - a[0]) / len;
      const half = (thick * (0.85 + 0.3 * Math.sin((k / steps) * Math.PI))) / 2;
      left.push([pt[0] + nx * half, pt[1] + ny * half]);
      right.push([pt[0] - nx * half, pt[1] - ny * half]);
    });
    return 'M' + left.map(fmt).join('L') + 'L' + right.reverse().map(fmt).join('L') + 'Z';
  };

  // Draws itself in when the section comes into view, as the graphic pulls in
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-drawn');
      reveal.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  graphics.forEach((graphic, n) => {
    const section = graphic.closest('section');
    if (!section) return;
    section.classList.add('has-streak');
    const wrap = document.createElement('div');
    wrap.className = 'streak';
    wrap.setAttribute('aria-hidden', 'true');
    const svg = document.createElementNS(NS, 'svg');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('fill', colours[graphic.dataset.streak] || colours.blurple);
    // The filled ribbon is revealed through a mask: a fat stroke along its
    // centre line whose dash runs from the entry edge to the exit
    const mask = document.createElementNS(NS, 'mask');
    mask.id = 'streak-mask-' + n;
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    const spine = document.createElementNS(NS, 'path');
    spine.setAttribute('class', 'streak__spine');
    spine.setAttribute('pathLength', '1');
    mask.appendChild(spine);
    path.setAttribute('mask', `url(#${mask.id})`);
    svg.append(mask, path);
    wrap.appendChild(svg);
    section.prepend(wrap);
    reveal.observe(section);

    const draw = () => {
      const s = section.getBoundingClientRect();
      if (!s.width || !s.height) return;
      // The graphic itself: the biggest child that is not the old phone frame
      let g = graphic.getBoundingClientRect();
      let best = 0;
      [...graphic.children].forEach((child) => {
        if (child.matches('.hero-blob, .cm-float')) return;
        const r = child.getBoundingClientRect();
        if (r.width * r.height > best) { best = r.width * r.height; g = r; }
      });
      const W = s.width;
      const H = s.height;
      const gw = g.width;
      const gh = g.height;
      const gl = g.left - s.left;
      const gt = g.top - s.top;
      // Mirror the route when the graphic sits on the left of the copy
      const onLeft = gl + gw / 2 < W / 2 - 1 && W > 640;
      const x = (v) => (onLeft ? W - v : v);
      const L = onLeft ? W - (gl + gw) : gl;
      // A soft S: in high off the edge, behind the graphic, out low
      const pts = [
        [W + 120, gt - 0.25 * gh],
        [L + gw * 1.02, gt + 0.12 * gh],
        [L + gw * 0.55, gt + 0.55 * gh],
        [L - 0.12 * gw, gt + 0.95 * gh],
        [L - 0.3 * gw, H + 120],
      ].map(([px, py]) => [x(px), py]);
      const thick = Math.max(44, Math.min(92, W * 0.064));
      svg.setAttribute('width', W);
      svg.setAttribute('height', H);
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      path.setAttribute('d', ribbon(pts, thick));
      spine.setAttribute('d', 'M' + centreLine(pts).map(fmt).join('L'));
      spine.setAttribute('stroke-width', thick * 1.6);
    };

    let queued = false;
    const redraw = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; draw(); });
    };
    draw();
    new ResizeObserver(redraw).observe(section);
    // Scroll-in animations move the graphic into place: redraw once they land
    section.addEventListener('transitionend', redraw);
    window.addEventListener('load', redraw);
  });
}

/* ─── Typewriter — types out text character by character on scroll-in ─── */
function initTypewriters() {
  const elements = document.querySelectorAll('[data-typewriter]');
  if (!elements.length || !('IntersectionObserver' in window)) return;

  const decode = (str) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  };

  const typeText = (el) => {
    const text = decode(el.dataset.typewriter || '');
    el.textContent = '';
    el.classList.add('is-typing');

    let i = 0;
    const delay = 220;

    const tick = () => {
      if (i >= text.length) {
        el.classList.remove('is-typing');
        const card = el.closest('.pricing-teaser__rate-card');
        const unit = card?.querySelector('.pricing-teaser__rate-unit');
        if (unit) setTimeout(() => unit.classList.add('is-visible'), 150);
        return;
      }
      el.textContent += text.charAt(i);
      i++;
      setTimeout(tick, delay);
    };

    setTimeout(tick, 300);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        typeText(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  elements.forEach(el => observer.observe(el));
}

/* ─── Typewriter Cycle — types, deletes, repeats through a list of phrases ─── */
function initTypewriterCycle() {
  const elements = document.querySelectorAll('[data-typewriter-cycle]');
  if (!elements.length) return;

  const decode = (str) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  };

  elements.forEach(el => {
    const raw = decode(el.dataset.typewriterCycle || '');
    const phrases = raw.split('|').map(p => p.trim()).filter(Boolean);
    if (!phrases.length) return;

    el.classList.add('is-cycling');

    const typeSpeed = 75;
    const deleteSpeed = 35;
    const holdAfterType = 1700;
    const holdAfterDelete = 220;

    let phraseIdx = 0;
    let charIdx = 0;
    let phase = 'typing';

    const tick = () => {
      const phrase = phrases[phraseIdx];

      if (phase === 'typing') {
        charIdx++;
        el.textContent = phrase.substring(0, charIdx);
        if (charIdx >= phrase.length) {
          phase = 'deleting';
          setTimeout(tick, holdAfterType);
        } else {
          setTimeout(tick, typeSpeed);
        }
      } else if (phase === 'deleting') {
        charIdx--;
        el.textContent = phrase.substring(0, Math.max(0, charIdx));
        if (charIdx <= 0) {
          phaseAdvance();
        } else {
          setTimeout(tick, deleteSpeed);
        }
      }
    };

    const phaseAdvance = () => {
      phase = 'typing';
      phraseIdx = (phraseIdx + 1) % phrases.length;
      charIdx = 0;
      setTimeout(tick, holdAfterDelete);
    };

    const start = () => setTimeout(tick, 350);

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            start();
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      observer.observe(el);
    } else {
      start();
    }
  });
}

/* ─── Floating card content cycling ─── */
function initFloatingCardCycle() {
  const cards = document.querySelectorAll('[data-cycle-card]');
  if (!cards.length) return;

  const hold = 5000;
  const stagger = 500;
  const cardData = [];
  const customCards = [];

  cards.forEach(card => {
    const states = card.querySelectorAll('.hero__card-state');
    if (states.length < 2) return;
    const custom = parseInt(card.dataset.cycleInterval, 10);
    if (custom) {
      customCards.push({ states, current: 0, hold: custom });
    } else {
      cardData.push({ states, current: 0 });
    }
  });

  function advance(d) {
    d.states[d.current].classList.remove('is-active');
    d.current = (d.current + 1) % d.states.length;
    d.states[d.current].classList.add('is-active');
  }

  if (cardData.length) {
    setInterval(() => {
      advance(cardData[0]);
      if (cardData.length > 1) {
        setTimeout(() => advance(cardData[1]), stagger);
      }
    }, hold);
  }

  customCards.forEach(d => setInterval(() => advance(d), d.hold));
}

/* ─── Phone carousel — on phones a [data-phone-carousel] grid becomes one
   swipeable row (home.css). Dots underneath show which card you're on; it
   moves on by itself every few seconds while on screen. Holding a card
   pauses it, swiping or tapping a dot moves it straight away, and it carries
   on by itself once they let go. ─── */
function initPhoneCarousels() {
  const phone = window.matchMedia('(max-width: 640px)');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('[data-phone-carousel]').forEach(track => {
    const cards = [...track.children];
    if (cards.length < 2) return;

    // Name the row after its section heading when the page doesn't
    if (!track.hasAttribute('aria-label')) {
      const heading = track.closest('section')?.querySelector('h2');
      if (heading) track.setAttribute('aria-label', heading.textContent.trim());
    }

    const dots = document.createElement('div');
    dots.className = 'carousel-dots';
    const buttons = cards.map((card, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'carousel-dots__dot';
      b.setAttribute('aria-label', `Show card ${i + 1} of ${cards.length}`);
      b.addEventListener('click', () => { go(i); run(); });
      dots.appendChild(b);
      return b;
    });
    track.after(dots);

    let current = 0;
    let timer = null;
    let onScreen = false;
    let held = false;

    const step = () => cards[1].offsetLeft - cards[0].offsetLeft;

    function go(i) {
      track.scrollTo({ left: step() * i, behavior: still.matches ? 'auto' : 'smooth' });
    }

    function mark() {
      const i = Math.min(cards.length - 1, Math.max(0, Math.round(track.scrollLeft / step())));
      if (i === current && buttons[i].classList.contains('is-active')) return;
      current = i;
      buttons.forEach((b, n) => {
        b.classList.toggle('is-active', n === i);
        b.setAttribute('aria-current', n === i ? 'true' : 'false');
      });
    }

    // Restarting the timer on every call means the next move always comes a
    // full interval after the visitor last touched it
    function run() {
      clearInterval(timer);
      timer = null;
      if (held || still.matches || !phone.matches || !onScreen) return;
      timer = setInterval(() => go((current + 1) % cards.length), 3500);
    }

    function hold() {
      held = true;
      run();
    }

    function release() {
      held = false;
      run();
    }

    track.addEventListener('scroll', mark, { passive: true });
    track.addEventListener('touchstart', hold, { passive: true });
    track.addEventListener('touchend', release, { passive: true });
    track.addEventListener('touchcancel', release, { passive: true });
    track.addEventListener('wheel', run, { passive: true });

    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      run();
    }, { threshold: 0.5 }).observe(track);

    phone.addEventListener('change', run);
    mark();
  });
}

/* ─── Stat counters — animate 0 → target when they scroll into view ─── */
function initStatCounters() {
  const counters = document.querySelectorAll('[data-count-to]');
  if (!counters.length || !('IntersectionObserver' in window)) return;

  const animateCount = (el) => {
    const target = parseFloat(el.dataset.countTo);
    const from = el.dataset.countFrom !== undefined ? parseFloat(el.dataset.countFrom) : 0;
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (target - from) * eased;
      el.textContent = value.toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else {
        el.textContent = el.dataset.final || (target.toFixed(decimals) + suffix);
        const old = el.parentElement?.querySelector('.pricing-teaser__rate-old');
        if (old) setTimeout(() => old.classList.add('is-visible'), 200);
      }
    };

    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(el => observer.observe(el));

  // Fade in rate-notes (account-style cards) when the pricing section enters view
  const notes = document.querySelectorAll('.pricing-teaser__rate-note');
  if (notes.length && 'IntersectionObserver' in window) {
    const noteObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('is-visible'), 200);
          noteObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    notes.forEach(el => noteObserver.observe(el));
  }
}

/* ─── Live counter — 1,945 on 2026-09-04, +18 per working day.
   Merchants go live Mon-Fri only, so weekends add nothing ─── */
function initLiveCounter() {
  const el = document.querySelector('[data-live-counter] .live-pill__count');
  if (!el) return;

  const START = Date.UTC(2026, 8, 4); // 4 Sep 2026, a Friday
  const BASE = 1945;
  const PER_WORKING_DAY = 18;

  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(0, Math.floor((today - START) / msPerDay));

  // whole weeks contribute five working days each, then walk the remainder
  const startDay = new Date(START).getUTCDay(); // 0 Sun … 6 Sat
  let workingDays = Math.floor(days / 7) * 5;
  for (let i = 1; i <= days % 7; i++) {
    const weekday = (startDay + i) % 7;
    if (weekday !== 0 && weekday !== 6) workingDays++;
  }

  const count = BASE + (workingDays * PER_WORKING_DAY);
  el.textContent = count.toLocaleString('en-GB');
}

/* ─── Header scroll behavior ─── */
function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    header.classList.toggle('is-scrolled', currentScroll > 20);
    lastScroll = currentScroll;
  }, { passive: true });
}

/* ─── Mega menu ─── */
function initMegaMenu() {
  const triggers = document.querySelectorAll('[data-mega-trigger]');
  const menus = document.querySelectorAll('.mega-menu');

  triggers.forEach(trigger => {
    const targetId = trigger.dataset.megaTrigger;
    const menu = document.getElementById(targetId);
    if (!menu) return;

    let closeTimeout;

    const open = () => {
      clearTimeout(closeTimeout);
      menus.forEach(m => m.classList.remove('is-open'));
      triggers.forEach(t => t.classList.remove('is-active'));
      menu.classList.add('is-open');
      trigger.classList.add('is-active');
    };

    const close = () => {
      closeTimeout = setTimeout(() => {
        menu.classList.remove('is-open');
        trigger.classList.remove('is-active');
      }, 150);
    };

    trigger.addEventListener('mouseenter', open);
    trigger.addEventListener('mouseleave', close);
    menu.addEventListener('mouseenter', () => clearTimeout(closeTimeout));
    menu.addEventListener('mouseleave', close);

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      if (menu.classList.contains('is-open')) {
        close();
      } else {
        open();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      menus.forEach(m => m.classList.remove('is-open'));
      triggers.forEach(t => t.classList.remove('is-active'));
    }
  });
}

/* ─── Mobile navigation ─── */
function initMobileNav() {
  const toggle = document.querySelector('.mobile-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (!toggle || !mobileNav) return;

  // Marks the menu when it is long enough to scroll, so header.css shows
  // just one line above the pinned buttons
  const checkOverflow = () => {
    mobileNav.classList.toggle('has-overflow', mobileNav.scrollHeight > mobileNav.clientHeight + 1);
  };
  window.addEventListener('resize', checkOverflow);

  const setOpen = (isOpen) => {
    toggle.classList.toggle('is-open', isOpen);
    mobileNav.classList.toggle('is-open', isOpen);
    checkOverflow();
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  toggle.addEventListener('click', () => setOpen(!toggle.classList.contains('is-open')));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.classList.contains('is-open')) setOpen(false);
  });

  // Scroll the menu so an opened section's links clear the pinned buttons
  // at the bottom, without pushing its title up under the logo
  const revealSection = (accordion) => {
    const navTop = mobileNav.getBoundingClientRect().top;
    const actions = mobileNav.querySelector('.mobile-nav__actions');
    const visibleBottom = actions
      ? actions.getBoundingClientRect().top
      : mobileNav.getBoundingClientRect().bottom;
    const rect = accordion.getBoundingClientRect();
    const overflow = rect.bottom + 8 - visibleBottom;
    const room = rect.top - (navTop + 72);
    const delta = Math.min(overflow, room);
    if (delta > 0) mobileNav.scrollBy({ top: delta, behavior: 'smooth' });
  };

  const mobileAccordions = mobileNav.querySelectorAll('[data-mobile-accordion]');
  mobileAccordions.forEach(accordion => {
    const trigger = accordion.querySelector('[data-mobile-accordion-trigger]');
    const content = accordion.querySelector('[data-mobile-accordion-content]');
    if (!trigger || !content) return;

    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', () => {
      const isOpen = accordion.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', String(isOpen));
      content.style.maxHeight = isOpen ? content.scrollHeight + 'px' : '0';
      content.addEventListener('transitionend', checkOverflow, { once: true });
      setTimeout(checkOverflow, 400);
      if (!isOpen) return;
      // Wait for the section to finish opening, then bring it into view
      let done = false;
      const reveal = () => { if (!done) { done = true; revealSection(accordion); } };
      content.addEventListener('transitionend', reveal, { once: true });
      setTimeout(reveal, 400);
    });
  });
}

/* ─── Scroll animations ─── */
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('[data-animate]');
  const staggerContainers = document.querySelectorAll('[data-stagger]');

  if (!animatedElements.length && !staggerContainers.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  animatedElements.forEach(el => observer.observe(el));
  staggerContainers.forEach(el => observer.observe(el));
}

/* ─── FAQ accordion ─── */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-item__question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      faqItems.forEach(other => {
        if (other !== item) other.classList.remove('is-open');
      });

      item.classList.toggle('is-open', !isOpen);
    });
  });
}

/* ─── Marquee duplication for seamless loop ─── */
function initMarquee() {
  const tracks = document.querySelectorAll('.marquee__track');
  tracks.forEach(track => {
    const content = track.innerHTML;
    // Render once first so we can measure the natural width
    const viewportWidth = window.innerWidth;
    // Temporarily set to single content to measure
    const trackWidth = track.scrollWidth;
    // Duplicate enough times so the duplicated set is at least 3× the viewport
    const minTotalWidth = viewportWidth * 3;
    const copies = Math.max(2, Math.ceil(minTotalWidth / trackWidth));
    track.innerHTML = content.repeat(copies);
  });
}

/* ─── Smooth scroll for anchor links ─── */
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;

  const targetId = link.getAttribute('href').slice(1);
  const target = document.getElementById(targetId);
  if (!target) return;

  e.preventDefault();
  const headerHeight = document.querySelector('.header')?.offsetHeight || 72;
  const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
  window.scrollTo({ top, behavior: 'smooth' });
});

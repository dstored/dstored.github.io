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
});

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

/* ─── Live counter — starts at 1,412 on 2026-05-20, +20 per day ─── */
function initLiveCounter() {
  const el = document.querySelector('[data-live-counter] .live-pill__count');
  if (!el) return;

  const startDate = new Date('2026-05-20T00:00:00Z');
  const today = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSince = Math.max(0, Math.floor((today - startDate) / msPerDay));
  const count = 1412 + (daysSince * 20);
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

  toggle.addEventListener('click', () => {
    const isOpen = toggle.classList.toggle('is-open');
    mobileNav.classList.toggle('is-open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  const mobileAccordions = mobileNav.querySelectorAll('[data-mobile-accordion]');
  mobileAccordions.forEach(accordion => {
    const trigger = accordion.querySelector('[data-mobile-accordion-trigger]');
    const content = accordion.querySelector('[data-mobile-accordion-content]');
    if (!trigger || !content) return;

    trigger.addEventListener('click', () => {
      const isOpen = accordion.classList.toggle('is-open');
      content.style.maxHeight = isOpen ? content.scrollHeight + 'px' : '0';
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

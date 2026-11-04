/* Cookie consent and Google Tag Manager.
 *
 * Loaded first in every page's <head>. Nothing that sets a non-essential
 * cookie runs until the visitor says yes:
 *  - Google Consent Mode v2 starts with every type of storage denied.
 *  - Google Tag Manager (GTM-K4QHX44G) only loads once the visitor has
 *    accepted Analytics or Marketing, now or on an earlier visit.
 *  - The choice is kept in the cookie_consent cookie for 12 months (as the
 *    cookie policy says), then the banner asks again.
 *
 * Categories match cookie-policy.html: Analytics (analytics_storage) and
 * Marketing (ad_storage, ad_user_data, ad_personalization). Tags added in
 * Tag Manager that aren't Google's own must be given a consent check there.
 * The footer gets a "Cookie preferences" link that reopens the choices.
 */
(function () {
  var GTM_ID = 'GTM-K4QHX44G';
  var COOKIE = 'cookie_consent';
  var VERSION = '1';
  var MAX_AGE = 60 * 60 * 24 * 365; // 12 months

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', false);

  function read() {
    var m = document.cookie.match(/(?:^|;\s*)cookie_consent=([^;]*)/);
    if (!m) return null;
    var parts = decodeURIComponent(m[1]).split('|');
    if (parts[0] !== 'v' + VERSION) return null;
    return { analytics: parts[1] === 'a1', marketing: parts[2] === 'm1' };
  }

  function write(choice) {
    var value = ['v' + VERSION, choice.analytics ? 'a1' : 'a0', choice.marketing ? 'm1' : 'm0'].join('|');
    var secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = COOKIE + '=' + encodeURIComponent(value) + '; Max-Age=' + MAX_AGE + '; Path=/; SameSite=Lax' + secure;
  }

  // Withdrawing consent also clears the cookies the tags left behind.
  function clearTracking(choice) {
    var names = document.cookie.split(';').map(function (c) { return c.split('=')[0].trim(); });
    var host = location.hostname.replace(/^www\./, '');
    names.forEach(function (name) {
      var analytics = /^_ga($|_)|^_gid$/.test(name);
      var marketing = /^_gcl_|^_fbp$|^_uet|^_li_|^li_/.test(name);
      if ((analytics && !choice.analytics) || (marketing && !choice.marketing)) {
        ['', '; Domain=' + host, '; Domain=.' + host].forEach(function (d) {
          document.cookie = name + '=; Max-Age=0; Path=/' + d;
        });
      }
    });
  }

  var gtmLoaded = false;
  function loadGtm() {
    if (gtmLoaded) return;
    gtmLoaded = true;
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    document.head.appendChild(s);
  }

  function apply(choice, isUpdate) {
    gtag('consent', 'update', {
      analytics_storage: choice.analytics ? 'granted' : 'denied',
      ad_storage: choice.marketing ? 'granted' : 'denied',
      ad_user_data: choice.marketing ? 'granted' : 'denied',
      ad_personalization: choice.marketing ? 'granted' : 'denied'
    });
    if (isUpdate) {
      window.dataLayer.push({ event: 'consent_update', consent_analytics: choice.analytics, consent_marketing: choice.marketing });
    }
    if (choice.analytics || choice.marketing) loadGtm();
  }

  var saved = read();
  if (saved) apply(saved, false);

  // ---------- Banner ----------

  var banner, panel, analyticsBox, marketingBox;

  function save(choice) {
    write(choice);
    clearTracking(choice);
    apply(choice, true);
    hide();
  }

  function hide() {
    if (banner) banner.hidden = true;
  }

  function show(openPanel) {
    if (!banner) build();
    var current = read() || { analytics: false, marketing: false };
    analyticsBox.checked = current.analytics;
    marketingBox.checked = current.marketing;
    setPanel(!!openPanel);
    banner.hidden = false;
    if (openPanel) analyticsBox.focus();
  }

  function setPanel(open) {
    panel.hidden = !open;
    banner.querySelector('[data-consent="manage"]').setAttribute('aria-expanded', String(open));
    banner.querySelector('[data-consent="save"]').hidden = !open;
    banner.querySelector('[data-consent="manage"]').hidden = open;
  }

  function build() {
    banner = document.createElement('section');
    banner.className = 'consent';
    banner.setAttribute('aria-labelledby', 'consent-title');
    banner.hidden = true;
    banner.innerHTML =
      '<div class="consent__inner">' +
        '<div class="consent__text">' +
          '<h2 class="consent__title" id="consent-title">Cookies.</h2>' +
          '<p class="consent__body">We use essential cookies to run this site. With your permission we&rsquo;d also like to use analytics cookies to see how the site is used, and marketing cookies to measure our advertising. You can change your mind at any time from the footer. <a href="/cookie-policy">Cookie policy</a></p>' +
        '</div>' +
        '<div class="consent__panel" id="consent-panel" hidden>' +
          '<label class="consent__option consent__option--locked">' +
            '<input type="checkbox" checked disabled>' +
            '<span><strong>Strictly necessary</strong> Needed for the site to work. Always on.</span>' +
          '</label>' +
          '<label class="consent__option">' +
            '<input type="checkbox" data-consent-category="analytics">' +
            '<span><strong>Analytics</strong> Shows us how visitors use the site so we can improve it.</span>' +
          '</label>' +
          '<label class="consent__option">' +
            '<input type="checkbox" data-consent-category="marketing">' +
            '<span><strong>Marketing</strong> Measures how well our advertising works.</span>' +
          '</label>' +
        '</div>' +
        '<div class="consent__actions">' +
          '<button type="button" class="consent__btn consent__btn--accept" data-consent="accept">Accept all</button>' +
          '<button type="button" class="consent__btn" data-consent="reject">Reject all</button>' +
          '<button type="button" class="consent__btn" data-consent="manage" aria-controls="consent-panel" aria-expanded="false">Manage</button>' +
          '<button type="button" class="consent__btn" data-consent="save" hidden>Save choices</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);

    panel = banner.querySelector('.consent__panel');
    analyticsBox = banner.querySelector('[data-consent-category="analytics"]');
    marketingBox = banner.querySelector('[data-consent-category="marketing"]');

    banner.addEventListener('click', function (e) {
      var action = e.target.closest('[data-consent]');
      if (!action) return;
      switch (action.getAttribute('data-consent')) {
        case 'accept': save({ analytics: true, marketing: true }); break;
        case 'reject': save({ analytics: false, marketing: false }); break;
        case 'manage': setPanel(true); analyticsBox.focus(); break;
        case 'save': save({ analytics: analyticsBox.checked, marketing: marketingBox.checked }); break;
      }
    });
  }

  function addFooterLink() {
    var cookies = document.querySelector('.footer__legal a[href$="/cookie-policy"]');
    if (!cookies || document.querySelector('[data-consent-open]')) return;
    var link = document.createElement('button');
    link.type = 'button';
    link.className = 'footer__legal-link consent-open';
    link.setAttribute('data-consent-open', '');
    link.textContent = 'Cookie preferences';
    link.addEventListener('click', function () { show(true); });
    cookies.insertAdjacentElement('afterend', link);
  }

  function start() {
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/css/consent.css?v=2';
    document.head.appendChild(css);
    addFooterLink();
    if (!saved) show(false);
  }

  window.storedConsent = { open: function () { show(true); } };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

/* Conversion events for Tag Manager.
 *
 * Tells Tag Manager when a visitor clicks a key button or sends a lead form.
 * The events wait in the dataLayer and only reach Google Analytics, Google Ads
 * or Microsoft Ads if the visitor has accepted cookies (GTM isn't loaded
 * otherwise). Buttons are recognised by where they go, so new ones are
 * tracked without any change here.
 *  - cta_click:     cta (sign_up, book_a_demo, pricing, custom_quote),
 *                   cta_text and cta_location (header, menu, mobile_menu,
 *                   hero, page, bottom_banner, footer)
 *  - generate_lead: form (book_a_demo, sign_up, contact_sales,
 *                   contact_press, partner). Contact form Support messages
 *                   are not leads. The forms open the visitor's email app,
 *                   so this means they pressed submit, not that they sent it.
 */
(function () {
  window.dataLayer = window.dataLayer || [];

  function page(path) {
    return path.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  }

  function ctaFor(link) {
    var url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return null;
    var path = page(url.pathname);
    if (/custom quote/i.test(link.textContent) || (path === '/contact' && url.searchParams.get('topic') === 'sales')) return 'custom_quote';
    return { '/sign-up': 'sign_up', '/book-a-demo': 'book_a_demo', '/pricing': 'pricing' }[path] || null;
  }

  function locationOf(el) {
    if (el.closest('.mega-menu')) return 'menu';
    if (el.closest('.mobile-nav')) return 'mobile_menu';
    if (el.closest('header')) return 'header';
    if (el.closest('footer')) return 'footer';
    if (el.closest('.cta-band')) return 'bottom_banner';
    if (el.closest('.hero, .solution-hero')) return 'hero';
    return 'page';
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href]');
    if (!link) return;
    var cta = ctaFor(link);
    if (!cta) return;
    window.dataLayer.push({
      event: 'cta_click',
      cta: cta,
      cta_text: link.textContent.replace(/\s+/g, ' ').trim(),
      cta_location: locationOf(link)
    });
  }, true);

  // Runs before each form's own script, and only once the browser has
  // accepted the form as filled in.
  var forms = { '/book-a-demo': 'book_a_demo', '/sign-up': 'sign_up', '/partners': 'partner' };
  document.addEventListener('submit', function (e) {
    var form = e.target;
    var name = null;
    if (form.hasAttribute('data-contact-form')) {
      var topic = form.topic && form.topic.value;
      if (topic === 'sales' || topic === 'press') name = 'contact_' + topic;
    } else if (form.hasAttribute('data-email-form')) {
      name = forms[page(location.pathname)] || null;
    }
    if (name) window.dataLayer.push({ event: 'generate_lead', form: name });
  }, true);
})();

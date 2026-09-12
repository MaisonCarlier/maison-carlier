/* =========================================================
   MAISON CARLIER — Interactions & animations
   Vanilla JS, aucune dépendance.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* -------------------------------------------------------
     1. INTRO
     Logo qui émerge → filet or → slogan qui se dépose →
     les bandes se retirent et découvrent le hero.
     ------------------------------------------------------- */
  var intro = $('#intro');
  var introDone = false;

  // Le hero n'est pas piloté par le scroll : il démarre à la fin de l'intro.
  var heroAnim = $$('.hero [data-reveal], .hero [data-split]');

  function startHero() {
    if (introDone) return;
    introDone = true;
    document.body.classList.add('is-ready');
    document.body.classList.remove('is-locked');
    heroAnim.forEach(function (el) { el.classList.add('is-in'); });
  }

  function endIntro() {
    if (!intro || intro.classList.contains('is-leaving')) return;
    intro.classList.add('is-leaving');

    // le hero démarre pendant que les bandes se retirent :
    // on le voit se découvrir, pan par pan
    startHero();

    // 0,7 s de transition + 0,18 s de retard maximum
    setTimeout(function () { intro.remove(); }, 950);
  }

  // Toute la chorégraphie est en CSS. Le JS ne fait qu'attendre la fin :
  // 1,2 s d'attaque + 0,8 s de dépôt d'encre + 0,25 s de pause.
  var INTRO_END = 2250;

  if (!intro) {
    startHero();
  } else if (reduced) {
    setTimeout(endIntro, 300);
  } else {
    document.body.classList.add('is-locked');
    setTimeout(endIntro, INTRO_END);
    // Filet de sécurité : l'intro ne doit jamais bloquer la page
    setTimeout(endIntro, 7000);
  }

  /* -------------------------------------------------------
     2. Placeholders d'images
     Une image absente passe en `visibility:hidden` et son
     conteneur affiche un motif + le nom du fichier attendu.
     Dès que la photo est déposée au bon nom, tout redevient normal.
     ------------------------------------------------------- */
  function markMissing(img) {
    img.classList.add('is-missing');
    var host = img.closest('.media, .hero__media, .testimonials__media') || img.parentElement;
    if (!host) return;
    host.classList.add('is-empty');
    if (!host.getAttribute('data-file')) {
      host.setAttribute('data-file', img.getAttribute('src').split('/').pop());
    }
  }
  $$('img').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) markMissing(img);
    img.addEventListener('error', function () { markMissing(img); });
  });

  /* -------------------------------------------------------
     3. Header : rétrécit au scroll, se cache vers le bas
     ------------------------------------------------------- */
  var header = $('#header');
  var progress = $('#scrollProgress');
  var lastY = 0;

  function onScroll() {
    var y = window.scrollY;

    header.classList.toggle('is-scrolled', y > 40);
    header.classList.toggle('is-hidden', y > 480 && y > lastY && !$('#nav').classList.contains('is-open'));
    lastY = y;

    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

    parallax();
    spyNav();
  }

  /* -------------------------------------------------------
     4. Parallaxe
     a) Hero à deux plans : le paysage lointain se déplace peu,
        la maison au premier plan se déplace davantage. C'est
        l'écart entre les deux vitesses qui donne la profondeur.
     b) Autres éléments marqués [data-parallax].
     ------------------------------------------------------- */
  var heroSky   = $('.hero__layer--sky');
  var heroHouse = $('.hero__layer--house');
  var heroBox   = $('.hero');

  function heroParallax() {
    if (reduced || !heroBox || !heroSky) return;
    var y = window.scrollY;
    if (y > heroBox.offsetHeight + 200) return;   // hors champ : on ne calcule plus

    // le lointain suit presque le scroll, le proche décroche
    heroSky.style.transform   = 'translate3d(-50%,' + (y * 0.30).toFixed(1) + 'px,0)';
    heroHouse.style.transform = 'translate3d(-50%,' + (y * 0.08).toFixed(1) + 'px,0)';
  }

  var parallaxItems = $$('[data-parallax]');
  function parallax() {
    if (reduced) return;
    heroParallax();

    var vh = window.innerHeight;
    parallaxItems.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
      var offset = (r.top + r.height / 2 - vh / 2) * speed;

      // Le déplacement ne peut pas dépasser la marge de débordement,
      // sinon l'image se décolle et laisse voir le fond de page.
      var host = el.parentElement;
      var slack = host ? (r.height - host.getBoundingClientRect().height) / 2 : 0;
      if (slack > 0) offset = Math.max(-slack, Math.min(slack, offset));

      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    });
  }

  /* -------------------------------------------------------
     5. Menu mobile
     ------------------------------------------------------- */
  var burger = $('#burger');
  var nav = $('#nav');

  function closeNav() {
    nav.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
  }
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
  });
  $$('.nav__link, .nav__cta, .nav__phone', nav).forEach(function (a) {
    a.addEventListener('click', closeNav);
  });

  /* Échap ferme le panneau et rend le focus au bouton : sans cela, un
     visiteur au clavier reste enfermé dans un menu qu'il ne voit plus. */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !nav.classList.contains('is-open')) return;
    closeNav();
    burger.focus();
  });

  /* Le panneau garde le focus tant qu'il est ouvert : la tabulation
     ne doit pas repartir dans la page masquée derrière. */
  nav.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !nav.classList.contains('is-open')) return;
    var cibles = $$('a[href], button', nav).filter(function (el) {
      return el.offsetWidth || el.offsetHeight;
    });
    if (!cibles.length) return;
    var premier = cibles[0], dernier = cibles[cibles.length - 1];
    if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
  });

  /* Passage en écran large avec le menu ouvert : le panneau disparaît
     mais le défilement du corps de page resterait bloqué. */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900 && nav.classList.contains('is-open')) closeNav();
  });

  /* -------------------------------------------------------
     6. Titres découpés mot par mot
     ------------------------------------------------------- */
  $$('[data-split]').forEach(function (el) {
    var html = el.innerHTML.split(/<br\s*\/?>/i).map(function (line) {
      return line.trim().split(/\s+/).map(function (w) {
        return '<span class="word"><span>' + w + '</span></span>';
      }).join(' ');
    }).join('<br>');
    el.innerHTML = html;
    $$('.word > span', el).forEach(function (s, i) {
      s.style.setProperty('--d', (i * 70) + 'ms');
    });
  });

  /* -------------------------------------------------------
     7. Reveal au scroll (IntersectionObserver)
     ------------------------------------------------------- */
  $$('[data-reveal]').forEach(function (el) {
    var d = el.getAttribute('data-delay');
    if (d) el.style.setProperty('--d', d + 'ms');
  });

  // Si le navigateur sait animer sur la timeline de scroll, le CSS
  // prend la main et l'observer devient inutile.
  var hasSVT = window.CSS && CSS.supports && CSS.supports('animation-timeline', 'view()');
  if (hasSVT && !reduced) document.documentElement.classList.add('svt');

  // Le hero est exclu : il est animé par endIntro(), pas par le scroll.
  var revealTargets = $$('[data-reveal], [data-split], .timeline').filter(function (el) {
    return !el.closest('.hero') && !(hasSVT && el.hasAttribute('data-reveal'));
  });
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add(e.target.classList.contains('timeline') ? 'is-drawn' : 'is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in', 'is-drawn'); });
  }

  /* -------------------------------------------------------
     8. Compteurs animés
     ------------------------------------------------------- */
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduced) { el.textContent = target + suffix; return; }

    var start = performance.now();
    var dur = 1600;
    (function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        runCounter(e.target);
        cio.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

  /* -------------------------------------------------------
     9. Carrousel de témoignages
     ------------------------------------------------------- */
  var quotes = $$('.quote', $('#quotes'));
  var dotsBox = $('#quotesDots');
  var qIndex = 0;
  var qTimer;

  quotes.forEach(function (_, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', 'Témoignage ' + (i + 1));
    if (i === 0) b.classList.add('is-active');
    b.addEventListener('click', function () { goQuote(i); restartQuotes(); });
    dotsBox.appendChild(b);
  });
  var dots = $$('button', dotsBox);

  function goQuote(i) {
    qIndex = (i + quotes.length) % quotes.length;
    quotes.forEach(function (q, k) { q.classList.toggle('is-active', k === qIndex); });
    dots.forEach(function (d, k) {
      d.classList.toggle('is-active', k === qIndex);
      d.setAttribute('aria-selected', String(k === qIndex));
    });
  }
  function restartQuotes() {
    clearInterval(qTimer);
    if (!reduced && quotes.length > 1) {
      qTimer = setInterval(function () { goQuote(qIndex + 1); }, 6000);
    }
  }
  restartQuotes();

  /* -------------------------------------------------------
     10. Réalisations — carrousel de comparateurs avant/après
     ------------------------------------------------------- */
  /* Une vidéo de chantier pèse 2 Mo. Sur un forfait compté ou une
     connexion lente, on s'en tient à l'image d'aperçu : le visiteur
     voit la même toiture, sans payer le débit. */
  function economieDonnees() {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return false;
    if (c.saveData) return true;
    return /(^|-)2g$/.test(c.effectiveType || '');
  }

  var baTrack = $('#baTrack');

  if (baTrack) {
    var baSlides = $$('.ba__slide', baTrack);
    var baDots = $('#baDots');
    var baIndex = 0;

    /* --- a. Comparateur : la poignée découpe la photo « avant » --- */
    $$('.ba', baTrack).forEach(function (frame) {
      var handle = $('.ba__handle', frame);
      var dragging = false;

      function setPos(clientX) {
        var r = frame.getBoundingClientRect();
        var pct = ((clientX - r.left) / r.width) * 100;
        pct = Math.max(0, Math.min(100, pct));
        frame.style.setProperty('--pos', pct.toFixed(2) + '%');
        handle.setAttribute('aria-valuenow', Math.round(pct));
      }

      frame.addEventListener('pointerdown', function (e) {
        dragging = true;
        frame.classList.add('is-touched');   // la consigne s'efface
        frame.setPointerCapture(e.pointerId);
        setPos(e.clientX);
      });
      frame.addEventListener('pointermove', function (e) {
        if (dragging) setPos(e.clientX);
      });
      ['pointerup', 'pointercancel'].forEach(function (evt) {
        frame.addEventListener(evt, function () { dragging = false; });
      });

      // Au clavier : flèches par pas de 4 %, Début / Fin aux extrêmes
      handle.addEventListener('keydown', function (e) {
        var now = parseFloat(handle.getAttribute('aria-valuenow')) || 50;
        var next = null;
        if (e.key === 'ArrowLeft')  next = now - 4;
        if (e.key === 'ArrowRight') next = now + 4;
        if (e.key === 'Home')       next = 0;
        if (e.key === 'End')        next = 100;
        if (next === null) return;
        e.preventDefault();
        frame.classList.add('is-touched');
        next = Math.max(0, Math.min(100, next));
        frame.style.setProperty('--pos', next + '%');
        handle.setAttribute('aria-valuenow', Math.round(next));
      });
    });

    /* --- b. Carrousel --- */
    baSlides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Projet ' + (i + 1));
      if (i === 0) b.classList.add('is-active');
      b.addEventListener('click', function () { goSlide(i); });
      baDots.appendChild(b);
    });
    var baDotBtns = $$('button', baDots);

    function goSlide(i) {
      baIndex = (i + baSlides.length) % baSlides.length;
      baTrack.style.transform = 'translate3d(' + (-baIndex * 100) + '%,0,0)';
      baDotBtns.forEach(function (d, k) {
        d.classList.toggle('is-active', k === baIndex);
        d.setAttribute('aria-selected', String(k === baIndex));
      });
      // les diapositives hors champ sortent de l'ordre de tabulation
      baSlides.forEach(function (sl, k) {
        sl.toggleAttribute('inert', k !== baIndex);
        // seule la vidéo visible tourne : les autres ne consomment ni
        // bande passante ni batterie tant qu'on ne les atteint pas
        var vid = sl.querySelector('.vframe__video');
        if (!vid) return;
        if (k === baIndex && !reduced && !economieDonnees()) {
          var play = vid.play();
          if (play && play.catch) play.catch(function () {});
        } else {
          vid.pause();
        }
      });
    }

    $('#baPrev').addEventListener('click', function () { goSlide(baIndex - 1); });
    $('#baNext').addEventListener('click', function () { goSlide(baIndex + 1); });
    goSlide(0);
  }

  /* 11. Cachets de cire — aucune animation : ils sont posés, point.
     La bande entière apparaît déjà via data-reveal. */

  /* -------------------------------------------------------
     12. Météo chantier — Lille
     Source : Open-Meteo (libre, sans clé). Le bandeau reste masqué
     tant que la donnée n'est pas arrivée : en cas de coupure ou de
     panne de l'API, le visiteur ne voit rien plutôt qu'un bloc vide.
     ------------------------------------------------------- */
  var ICONS = {"sun": "<svg viewBox=\"0 0 256 256\" aria-hidden=\"true\"><path d=\"M124,40V16a4,4,0,0,1,8,0V40a4,4,0,0,1-8,0Zm64,88a60,60,0,1,1-60-60A60.07,60.07,0,0,1,188,128Zm-8,0a52,52,0,1,0-52,52A52.06,52.06,0,0,0,180,128ZM61.17,66.83a4,4,0,0,0,5.66-5.66l-16-16a4,4,0,0,0-5.66,5.66Zm0,122.34-16,16a4,4,0,0,0,5.66,5.66l16-16a4,4,0,0,0-5.66-5.66ZM192,68a4,4,0,0,0,2.83-1.17l16-16a4,4,0,1,0-5.66-5.66l-16,16A4,4,0,0,0,192,68Zm2.83,121.17a4,4,0,0,0-5.66,5.66l16,16a4,4,0,0,0,5.66-5.66ZM40,124H16a4,4,0,0,0,0,8H40a4,4,0,0,0,0-8Zm88,88a4,4,0,0,0-4,4v24a4,4,0,0,0,8,0V216A4,4,0,0,0,128,212Zm112-88H216a4,4,0,0,0,0,8h24a4,4,0,0,0,0-8Z\"/></svg>", "cloud": "<svg viewBox=\"0 0 256 256\" aria-hidden=\"true\"><path d=\"M160,44A84.11,84.11,0,0,0,83.59,93.12,60.71,60.71,0,0,0,72,92a60,60,0,0,0,0,120h88a84,84,0,0,0,0-168Zm0,160H72a52,52,0,1,1,8.55-103.3A83.66,83.66,0,0,0,76,128a4,4,0,0,0,8,0,76,76,0,1,1,76,76Z\"/></svg>", "cloud-sun": "<svg viewBox=\"0 0 256 256\" aria-hidden=\"true\"><path d=\"M164,76a71.85,71.85,0,0,0-22.14,3.48A51.78,51.78,0,0,0,129,63.83l11.56-16.51A4,4,0,0,0,134,42.73L122.45,59.24A52,52,0,0,0,96,52c-1.71,0-3.4.09-5.06.25L87.44,32.4a4,4,0,0,0-7.88,1.39l3.5,19.84A52.19,52.19,0,0,0,55.85,71L39.32,59.42A4,4,0,0,0,34.73,66L51.26,77.54A51.63,51.63,0,0,0,44,104c0,1.69.09,3.37.25,5l-19.85,3.5a4,4,0,0,0,.69,7.94,4.23,4.23,0,0,0,.7-.06l19.85-3.5A52.07,52.07,0,0,0,54,134.6,48,48,0,0,0,84,220h80a72,72,0,0,0,0-144ZM52,104a44,44,0,0,1,82.33-21.61,72.23,72.23,0,0,0-38.82,43A48.28,48.28,0,0,0,84,124a47.76,47.76,0,0,0-23.4,6.11A44,44,0,0,1,52,104ZM164,212H84a40,40,0,1,1,9.43-78.88A71.63,71.63,0,0,0,92,143.77a4,4,0,0,0,8,.46,64.3,64.3,0,0,1,2-12.67c0-.12.07-.24.09-.36A64.06,64.06,0,1,1,164,212Z\"/></svg>", "cloud-rain": "<svg viewBox=\"0 0 256 256\" aria-hidden=\"true\"><path d=\"M155.33,194.22l-32,48a4,4,0,1,1-6.66-4.44l32-48a4,4,0,0,1,6.66,4.44ZM228,92a72.08,72.08,0,0,1-72,72H130.14L99.33,210.22a4,4,0,1,1-6.66-4.44L120.53,164H76A48,48,0,1,1,87.51,69.39,72.08,72.08,0,0,1,228,92Zm-8,0A64.06,64.06,0,0,0,92,88.23a4,4,0,0,1-8-.46,71.63,71.63,0,0,1,1.42-10.65A40,40,0,1,0,76,156h80A64.07,64.07,0,0,0,220,92Z\"/></svg>", "cloud-snow": "<svg viewBox=\"0 0 256 256\" aria-hidden=\"true\"><path d=\"M84,196a8,8,0,1,1-8-8A8,8,0,0,1,84,196Zm32,8a8,8,0,1,0,8,8A8,8,0,0,0,116,204Zm48-16a8,8,0,1,0,8,8A8,8,0,0,0,164,188ZM68,228a8,8,0,1,0,8,8A8,8,0,0,0,68,228Zm88,0a8,8,0,1,0,8,8A8,8,0,0,0,156,228ZM228,92a72.08,72.08,0,0,1-72,72H76A48,48,0,1,1,87.51,69.39,72.08,72.08,0,0,1,228,92Zm-8,0A64.06,64.06,0,0,0,92,88.23a4,4,0,0,1-8-.46,71.63,71.63,0,0,1,1.42-10.65A40,40,0,1,0,76,156h80A64.07,64.07,0,0,0,220,92Z\"/></svg>", "cloud-fog": "<svg viewBox=\"0 0 256 256\" aria-hidden=\"true\"><path d=\"M120,204H72a4,4,0,0,1,0-8h48a4,4,0,0,1,0,8Zm64-8H160a4,4,0,0,0,0,8h24a4,4,0,0,0,0-8Zm-24,32H104a4,4,0,0,0,0,8h56a4,4,0,0,0,0-8Zm68-128a72.08,72.08,0,0,1-72,72H76A48,48,0,1,1,87.51,77.39,72.08,72.08,0,0,1,228,100Zm-8,0A64.06,64.06,0,0,0,92,96.23a4,4,0,0,1-8-.46,71.63,71.63,0,0,1,1.42-10.65A40,40,0,1,0,76,164h80A64.07,64.07,0,0,0,220,100Z\"/></svg>", "lightning": "<svg viewBox=\"0 0 256 256\" aria-hidden=\"true\"><path d=\"M211.89,119.09a4,4,0,0,0-2.49-2.84l-60.81-22.8,15.33-76.67a4,4,0,0,0-6.84-3.51l-112,120a4,4,0,0,0-1,3.64,4,4,0,0,0,2.49,2.84l60.81,22.8L92.08,239.22a4,4,0,0,0,6.84,3.51l112-120A4,4,0,0,0,211.89,119.09ZM102.68,227l13.24-66.2a4,4,0,0,0-2.52-4.53L55,134.36,153.32,29l-13.24,66.2a4,4,0,0,0,2.52,4.53L201,121.64Z\"/></svg>", "wind": "<svg viewBox=\"0 0 256 256\" aria-hidden=\"true\"><path d=\"M180,184a28,28,0,0,1-28,28c-12.09,0-23.76-7.83-27.75-18.61a4,4,0,1,1,7.5-2.78C134.58,198.24,143.28,204,152,204a20,20,0,0,0,0-40H40a4,4,0,0,1,0-8H152A28,28,0,0,1,180,184ZM148,72a28,28,0,0,0-28-28c-12.09,0-23.76,7.83-27.75,18.61a4,4,0,0,0,7.5,2.78C102.58,57.76,111.28,52,120,52a20,20,0,0,1,0,40H24a4,4,0,0,0,0,8h96A28,28,0,0,0,148,72Zm60,4c-12.09,0-23.76,7.83-27.75,18.61a4,4,0,1,0,7.5,2.78C190.58,89.76,199.28,84,208,84a20,20,0,0,1,0,40H32a4,4,0,0,0,0,8H208a28,28,0,0,0,0-56Z\"/></svg>"};

  // Codes WMO : libellé, icône, et incidence sur le travail en toiture
  function readWeather(code, wind, gust) {
    var map = {
      0:['Ciel dégagé','sun'], 1:['Peu nuageux','cloud-sun'], 2:['Partiellement couvert','cloud-sun'],
      3:['Ciel couvert','cloud'], 45:['Brouillard','cloud-fog'], 48:['Brouillard givrant','cloud-fog'],
      51:['Bruine légère','cloud-rain'], 53:['Bruine','cloud-rain'], 55:['Bruine dense','cloud-rain'],
      61:['Pluie faible','cloud-rain'], 63:['Pluie','cloud-rain'], 65:['Fortes pluies','cloud-rain'],
      66:['Pluie verglaçante','cloud-rain'], 67:['Pluie verglaçante','cloud-rain'],
      71:['Neige faible','cloud-snow'], 73:['Neige','cloud-snow'], 75:['Fortes chutes de neige','cloud-snow'],
      77:['Grésil','cloud-snow'], 80:['Averses','cloud-rain'], 81:['Averses','cloud-rain'],
      82:['Fortes averses','cloud-rain'], 85:['Averses de neige','cloud-snow'],
      86:['Averses de neige','cloud-snow'], 95:['Orage','lightning'],
      96:['Orage et grêle','lightning'], 99:['Orage et grêle','lightning']
    };
    var e = map[code] || ['Temps variable','cloud'];
    var label = e[0], icon = e[1], state = 'ok';

    // Un couvreur ne monte pas par vent fort, orage, verglas ou neige.
    var souffle = Math.max(wind || 0, gust || 0);
    if (souffle >= 60 || code >= 95 || [66,67,75,86].indexOf(code) !== -1) {
      state = 'stopped';
      if (souffle >= 60) { label = 'Vent fort'; icon = 'wind'; }
    } else if (souffle >= 40 || [55,65,82,73,77].indexOf(code) !== -1) {
      state = 'limited';
    }
    return { label: label, icon: icon, state: state };
  }

  var weatherBox = $('#weather');
  if (weatherBox && 'fetch' in window) {
    var meteoUrl = 'https://api.open-meteo.com/v1/forecast' +
      '?latitude=50.6292&longitude=3.0573' +
      '&current=temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m' +
      '&timezone=Europe%2FParis';

    fetch(meteoUrl, { mode: 'cors' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (data) {
        var c = data && data.current;
        if (!c) return Promise.reject();

        var w = readWeather(c.weather_code, c.wind_speed_10m, c.wind_gusts_10m);

        $('#weatherIcon').innerHTML = ICONS[w.icon] || ICONS.cloud;
        $('#weatherTemp').textContent = Math.round(c.temperature_2m) + ' °C';
        $('#weatherDesc').textContent = w.label;

        var texte = {
          ok:      'Nos équipes interviennent aujourd’hui',
          limited: 'Interventions adaptées aux conditions',
          stopped: 'Montées en toiture suspendues — diagnostics et devis maintenus'
        }[w.state];

        $('#weatherStatusText').textContent = texte;
        if (w.state !== 'ok') weatherBox.classList.add('is-' + w.state);
        weatherBox.hidden = false;
      })
      .catch(function () { /* le bandeau reste masqué */ });
  }

  /* -------------------------------------------------------
     13. FAQ — accordéon
     Une seule réponse ouverte à la fois.
     ------------------------------------------------------- */
  var faqList = $('#faqList');
  if (faqList) {
    $$('.faq__q', faqList).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq__item');
        var isOpen = item.classList.contains('is-open');

        $$('.faq__item.is-open', faqList).forEach(function (other) {
          other.classList.remove('is-open');
          $('.faq__q', other).setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* -------------------------------------------------------
     14. Nav active selon la section visible
     ------------------------------------------------------- */
  var sections = $$('section[id]');
  var navLinks = $$('.nav__link');
  function spyNav() {
    var y = window.scrollY + 140;
    var current = '';
    sections.forEach(function (s) {
      if (y >= s.offsetTop) current = s.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle('is-current', a.getAttribute('href') === '#' + current);
    });
  }

  /* -------------------------------------------------------
     15. Formulaire de devis
     Envoi vers la fonction serverless /api/contact, qui relaie
     par email via Resend. La clé API reste côté serveur.
     ------------------------------------------------------- */
  var form = $('#devisForm');
  var status = $('#formStatus');

  var submitBtn = $('button[type="submit"]', form);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    status.className = 'form__status';

    $$('[required]', form).forEach(function (input) {
      var field = input.closest('.field');
      var valid = input.value.trim() !== '' &&
        (input.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value));
      field.classList.toggle('has-error', !valid);
      if (!valid) ok = false;
    });

    if (!ok) {
      status.textContent = 'Merci de remplir les champs obligatoires.';
      status.classList.add('is-ko');
      return;
    }

    var libelle = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours…';
    status.textContent = '';

    var donnees = {};
    new FormData(form).forEach(function (v, k) { donnees[k] = v; });

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donnees)
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          if (!r.ok) throw new Error(data.error || 'Envoi impossible.');
          return data;
        });
      })
      .then(function () {
        status.textContent = 'Merci, votre demande est bien partie. Nous vous répondons sous 24 h ouvrées.';
        status.classList.add('is-ok');
        form.reset();
      })
      .catch(function (err) {
        status.textContent = (err.message || 'Envoi impossible.') +
          ' Vous pouvez aussi nous écrire à ateliers@maison-carlier.fr.';
        status.classList.add('is-ko');
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = libelle;
      });
  });

  $$('input, textarea, select', form).forEach(function (input) {
    input.addEventListener('input', function () {
      var f = input.closest('.field');
      if (f) f.classList.remove('has-error');
    });
  });

  /* -------------------------------------------------------
     16. Divers
     ------------------------------------------------------- */
  $('#year').textContent = new Date().getFullYear();

  // Scroll : throttlé via requestAnimationFrame
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });

  window.addEventListener('resize', parallax);
  onScroll();
})();

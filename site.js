(function () {
  'use strict';

  var qs = function (selector, scope) { return (scope || document).querySelector(selector); };
  var qsa = function (selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setYears() {
    qsa('[data-year]').forEach(function (node) { node.textContent = String(new Date().getFullYear()); });
  }

  function initMenu() {
    var toggle = qs('.menu-toggle');
    var menu = qs('.mobile-menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
      menu.classList.toggle('is-open', !open);
    });
    qsa('a', menu).forEach(function (link) {
      link.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open navigation');
        menu.classList.remove('is-open');
      });
    });
  }

  function initProgress() {
    var line = qs('.progress-line');
    if (!line) return;
    var ticking = false;
    function update() {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      line.style.width = (scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  function initWordMotion() {
    qsa('.word').forEach(function (word, index) {
      window.setTimeout(function () { word.classList.add('is-visible'); }, 260 + (index * 120));
    });
    qsa('[data-word-reveal]').forEach(function (node) {
      if (!node.textContent.trim()) return;
      var words = node.textContent.trim().split(/\s+/);
      node.innerHTML = words.map(function (word, wordIndex) {
        return '<span class="reveal-word" style="--word-index:' + wordIndex + '">' + word + '</span>';
      }).join(' ');
      window.setTimeout(function () { node.classList.add('is-visible'); }, 450);
    });
  }

  function initReveal() {
    var nodes = qsa('.reveal');
    if (!nodes.length) return;
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(function (node) { node.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries, io) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = Number(entry.target.getAttribute('data-delay') || 0);
        entry.target.style.setProperty('--delay', delay);
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: .14, rootMargin: '0px 0px -7% 0px' });
    nodes.forEach(function (node) { observer.observe(node); });
  }

  function initAmbientWaterfall() {
    var canvas = qs('#ambient-flow');
    if (!canvas || !window.requestAnimationFrame) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var width = 0;
    var height = 0;
    var ratio = 1;
    var scrollOffset = 0;
    var pointer = { x: .5, y: .45 };
    var streams = [];
    var particles = [];
    var waveBands = [];
    var waveParticles = [];
    var colors = ['0,245,233', '20,217,184', '156,255,184', '215,255,106'];

    function randomStream(index) {
      return {
        base: (index / 34) + (Math.random() - .5) * .035,
        amplitude: 12 + Math.random() * 30,
        phase: Math.random() * Math.PI * 2,
        width: .35 + Math.random() * 1.25,
        speed: .00014 + Math.random() * .00022,
        color: colors[index % colors.length]
      };
    }
    for (var i = 0; i < 34; i += 1) streams.push(randomStream(i));
    for (var j = 0; j < 120; j += 1) {
      particles.push({ x: Math.random(), y: Math.random(), speed: .0001 + Math.random() * .00045, size: .45 + Math.random() * 1.35, color: colors[j % colors.length], phase: Math.random() * Math.PI * 2 });
    }
    for (var bandIndex = 0; bandIndex < 12; bandIndex += 1) {
      waveBands.push({
        lane: .08 + (bandIndex * .074) + (Math.random() - .5) * .025,
        amplitude: 5 + Math.random() * 13,
        phase: Math.random() * Math.PI * 2,
        speed: .00012 + Math.random() * .00016,
        color: colors[(bandIndex + 1) % colors.length]
      });
      for (var bandParticle = 0; bandParticle < 18; bandParticle += 1) {
        waveParticles.push({
          band: bandIndex,
          x: Math.random() * 1.1 - .05,
          size: .45 + Math.random() * 1.15,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function resize() {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function draw(time) {
      ctx.clearRect(0, 0, width, height);
      var t = reduceMotion ? 0 : time;
      var scroll = reduceMotion ? 0 : scrollOffset * .018;
      streams.forEach(function (stream, index) {
        var x = width * stream.base;
        var gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(' + stream.color + ',0)');
        gradient.addColorStop(.12, 'rgba(' + stream.color + ',.12)');
        gradient.addColorStop(.55, 'rgba(' + stream.color + ',.34)');
        gradient.addColorStop(1, 'rgba(' + stream.color + ',0)');
        ctx.beginPath();
        for (var y = -20; y <= height + 20; y += 22) {
          var wave = Math.sin(y * .011 + t * stream.speed + stream.phase) * stream.amplitude;
          var sway = Math.sin(y * .003 + stream.phase + pointer.x * 1.5) * (stream.amplitude * .7);
          var px = x + wave + sway + (pointer.x - .5) * (index % 4) * 7;
          var py = y + scroll * (index % 5) + Math.sin(t * .0002 + index) * 2;
          if (y === -20) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = gradient;
        ctx.lineWidth = stream.width;
        ctx.shadowBlur = index % 7 === 0 ? 16 : 0;
        ctx.shadowColor = 'rgba(' + stream.color + ',.65)';
        ctx.stroke();
      });
      ctx.shadowBlur = 0;
      particles.forEach(function (particle) {
        if (!reduceMotion) particle.y += particle.speed;
        if (particle.y > 1.05) particle.y = -.02;
        var x = particle.x * width + Math.sin(t * .0003 + particle.phase) * 12;
        var y = particle.y * height;
        var alpha = .15 + ((Math.sin(t * .001 + particle.phase) + 1) / 2) * .35;
        ctx.fillStyle = 'rgba(' + particle.color + ',' + alpha + ')';
        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'lighter';
      waveParticles.forEach(function (particle) {
        var band = waveBands[particle.band];
        if (!reduceMotion) particle.x += band.speed;
        if (particle.x > 1.08) particle.x = -.08;
        var x = particle.x * width + Math.sin(t * .00012 + particle.phase) * 9;
        var y = (band.lane * height) + Math.sin((particle.x * 13) + (t * .00028) + band.phase) * band.amplitude + Math.sin(t * .00015 + particle.phase) * 5;
        var alpha = .11 + ((Math.sin(t * .0008 + particle.phase) + 1) / 2) * .28;
        ctx.fillStyle = 'rgba(' + band.color + ',' + alpha + ')';
        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
      if (!reduceMotion) window.requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', function () { scrollOffset = window.scrollY; }, { passive: true });
    window.addEventListener('pointermove', function (event) {
      pointer.x = event.clientX / Math.max(window.innerWidth, 1);
      pointer.y = event.clientY / Math.max(window.innerHeight, 1);
    }, { passive: true });
    draw(0);
  }

  function initCursor() {
    var cursor = qs('.cursor-sigil');
    if (!cursor || window.matchMedia('(pointer: coarse)').matches) return;
    var x = window.innerWidth / 2;
    var y = window.innerHeight / 2;
    var currentX = x;
    var currentY = y;
    document.body.classList.add('cursor-ready');
    window.addEventListener('pointermove', function (event) {
      x = event.clientX;
      y = event.clientY;
      cursor.style.left = x + 'px';
      cursor.style.top = y + 'px';
    }, { passive: true });
    function settle() {
      currentX += (x - currentX) * .18;
      currentY += (y - currentY) * .18;
      cursor.style.left = currentX + 'px';
      cursor.style.top = currentY + 'px';
      window.requestAnimationFrame(settle);
    }
    settle();
    qsa('a, button, select, input, textarea, .tilt-card, .signal-node').forEach(function (node) {
      node.addEventListener('pointerenter', function () { document.body.classList.add('cursor-hover'); });
      node.addEventListener('pointerleave', function () { document.body.classList.remove('cursor-hover'); });
    });
  }

  function initTilt() {
    if (reduceMotion || window.matchMedia('(pointer: coarse)').matches) return;
    qsa('.tilt-card').forEach(function (card) {
      card.addEventListener('pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        var rotateY = ((event.clientX - rect.left) / rect.width - .5) * 5;
        var rotateX = ((event.clientY - rect.top) / rect.height - .5) * -5;
        card.style.transform = 'translateY(-7px) perspective(900px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }

  function initMagnetic() {
    if (reduceMotion || window.matchMedia('(pointer: coarse)').matches) return;
    qsa('[data-magnetic]').forEach(function (button) {
      button.addEventListener('pointermove', function (event) {
        var rect = button.getBoundingClientRect();
        var x = (event.clientX - (rect.left + rect.width / 2)) * .12;
        var y = (event.clientY - (rect.top + rect.height / 2)) * .12;
        button.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      button.addEventListener('pointerleave', function () { button.style.transform = ''; });
    });
  }

  function initSequence() {
    qsa('[data-sequence]').forEach(function (sequence) {
      var steps = qsa('[data-sequence-step]', sequence);
      if (!steps.length) return;
      var index = 0;
      var tone = 0;
      function activate() {
        sequence.setAttribute('data-tone', String(tone % 4));
        steps.forEach(function (step, stepIndex) {
          step.classList.toggle('is-active', stepIndex <= index);
          step.classList.toggle('is-leading', stepIndex === index);
        });
        if (index < steps.length - 1) {
          index += 1;
          window.setTimeout(activate, reduceMotion ? 40 : 900);
        } else if (sequence.hasAttribute('data-loop-sequence') && !reduceMotion) {
          sequence.classList.add('is-complete');
          window.setTimeout(function () {
            index = 0;
            tone += 1;
            sequence.classList.remove('is-complete');
            activate();
          }, 1500);
        } else {
          sequence.classList.add('is-complete');
        }
      }
      window.setTimeout(activate, 650);
    });
  }

  function initSequentialCards() {
    var cards = qsa('.data-sequence-card');
    if (!cards.length) return;
    var groups = [];
    cards.forEach(function (card) {
      var group = card.closest('.principles, .process-grid') || card.parentElement;
      var index = groups.indexOf(group);
      if (index === -1) { groups.push(group); index = groups.length - 1; }
      var siblings = qsa('.data-sequence-card', group);
      card.style.setProperty('--sequence-delay', (Math.max(0, siblings.indexOf(card)) * 130) + 'ms');
    });
  }

  function initScrollFlow() {
    var steps = qsa('[data-flow-step]');
    if (!steps.length || !('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) entry.target.classList.add('is-active'); });
    }, { threshold: .6 });
    steps.forEach(function (step) { observer.observe(step); });
  }

  function initParallax() {
    var nodes = qsa('[data-parallax]');
    if (!nodes.length || reduceMotion) return;
    var ticking = false;
    function update() {
      var viewport = window.innerHeight || 1;
      nodes.forEach(function (node) {
        var rect = node.getBoundingClientRect();
        var amount = Number(node.getAttribute('data-parallax') || .1);
        var offset = (rect.top + rect.height / 2 - viewport / 2) * amount * -1;
        node.style.setProperty('--parallax-y', Math.max(-28, Math.min(28, offset)) + 'px');
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  function initSignalOrbit() {
    var orbit = qs('.signal-orbit');
    if (!orbit) return;
    var nodes = qsa('.signal-node', orbit);
    if (!nodes.length) return;
    var paused = reduceMotion;
    var phases = [0, 1.1, 2.15, 3.1, 4.25, 5.2];
    var amplitudes = [
      [16, 10], [13, 16], [18, 11], [14, 15], [11, 12], [17, 9]
    ];

    function setPaused(next) {
      paused = next;
      orbit.classList.toggle('is-paused', paused);
    }

    orbit.addEventListener('pointerenter', function () { setPaused(true); });
    orbit.addEventListener('pointerleave', function () { setPaused(false); });
    orbit.addEventListener('focusin', function () { setPaused(true); });
    orbit.addEventListener('focusout', function (event) {
      if (!event.relatedTarget || !orbit.contains(event.relatedTarget)) setPaused(false);
    });

    if (reduceMotion) return;
    function tick(time) {
      if (!paused) {
        nodes.forEach(function (node, index) {
          var phase = phases[index % phases.length];
          var range = amplitudes[index % amplitudes.length];
          var angle = time * .00034 + phase;
          node.style.setProperty('--orbit-x', (Math.cos(angle) * range[0]).toFixed(2) + 'px');
          node.style.setProperty('--orbit-y', (Math.sin(angle) * range[1]).toFixed(2) + 'px');
        });
      }
      window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  }

  function initCounters() {
    var counters = qsa('[data-count]');
    if (!counters.length) return;
    counters.forEach(function (counter) {
      var target = Number(counter.getAttribute('data-count') || 0);
      var suffix = counter.getAttribute('data-suffix') || '';
      var started = false;
      function run() {
        if (started) return;
        started = true;
        if (reduceMotion) {
          counter.textContent = target + suffix;
          return;
        }
        var start = performance.now();
        var duration = 1150;
        function tick(now) {
          var progress = Math.min((now - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          counter.textContent = Math.round(target * eased) + suffix;
          if (progress < 1) window.requestAnimationFrame(tick);
        }
        window.requestAnimationFrame(tick);
      }
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries, io) {
          if (entries[0].isIntersecting) { run(); io.disconnect(); }
        }, { threshold: .6 });
        observer.observe(counter);
      } else run();
    });
  }

  function initShowreelAutoplay() {
    var videos = qsa('video[data-autoplay-showreel]');
    if (!videos.length) return;
    videos.forEach(function (video) {
      video.muted = true;
      video.setAttribute('muted', '');
      video.playsInline = true;
      video.autoplay = false;
      video.pause();
      if (reduceMotion) {
        return;
      }
      var started = false;
      function playMuted() {
        video.muted = true;
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') promise.catch(function () {});
      }
      if (!('IntersectionObserver' in window)) {
        playMuted();
        return;
      }
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio >= .2) {
            started = true;
            playMuted();
          } else if (started) {
            video.pause();
          }
        });
      }, { threshold: [0, .2, .6] });
      observer.observe(video);
    });
  }

  function togglePanel(button, panel, parent) {
    if (!panel || !parent) return;
    var open = parent.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    panel.style.display = open ? 'block' : '';
  }

  function bindPanelTrigger(node, handler) {
    node.addEventListener('click', handler);
    if (node.getAttribute('role') === 'button') {
      node.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handler();
        }
      });
    }
  }

  function initInteractivePanels() {
    qsa('[data-value-trigger]').forEach(function (button) {
      var parent = button.closest('.value-card');
      var panel = parent ? qs('.value-detail', parent) : null;
      bindPanelTrigger(button, function () { togglePanel(button, panel, parent); });
    });
    qsa('[data-faq-trigger]').forEach(function (button) {
      var parent = button.closest('.faq-card');
      var panel = parent ? qs('.faq-answer', parent) : null;
      bindPanelTrigger(button, function () { togglePanel(button, panel, parent); });
    });
    qsa('[data-capability]').forEach(function (button) {
      var panel = qs('.row-detail', button);
      bindPanelTrigger(button, function () { togglePanel(button, panel, button); });
    });
  }

  function initWorkFilter() {
    var buttons = qsa('[data-filter]');
    var cards = qsa('[data-category]');
    if (!buttons.length || !cards.length) return;
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var filter = button.getAttribute('data-filter');
        buttons.forEach(function (item) { item.classList.toggle('is-active', item === button); });
        cards.forEach(function (card) { card.classList.toggle('is-hidden', filter !== 'all' && card.getAttribute('data-category') !== filter); });
      });
    });
  }

  function initForm() {
    var form = qs('#project-form');
    if (!form) return;
    var status = qs('#form-status');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var honeypot = qs('[name="website"]', form);
      if (honeypot && honeypot.value) return;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var data = new FormData(form);
      var subject = 'FAANOMATE project inquiry from ' + (data.get('name') || 'a new contact');
      var body = [
        'Name: ' + data.get('name'),
        'Email: ' + data.get('email'),
        'Company: ' + data.get('company'),
        'Capability: ' + data.get('service'),
        'Budget: ' + data.get('budget'),
        'Timeline: ' + data.get('timeline'),
        '',
        'Project details:',
        data.get('details')
      ].join('\n');
      if (status) status.textContent = 'Your email draft is ready. Add anything else you need, then send it.';
      window.location.href = 'mailto:' + (form.getAttribute('data-recipient') || 'hello@faanomate.com') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }

  function init() {
    setYears();
    initMenu();
    initProgress();
    initWordMotion();
    initReveal();
    initAmbientWaterfall();
    initCursor();
    initTilt();
    initMagnetic();
    initSequence();
    initSequentialCards();
    initScrollFlow();
    initParallax();
    initSignalOrbit();
    initCounters();
    initShowreelAutoplay();
    initInteractivePanels();
    initWorkFilter();
    initForm();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());

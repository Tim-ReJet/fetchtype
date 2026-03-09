const body = document.body;
const roleTabs = Array.from(document.querySelectorAll('.role-tab'));
const modeWord = document.getElementById('mode-word');
const modeCaption = document.getElementById('mode-caption');
const modeLabel = document.getElementById('mode-label');
const modeTitle = document.getElementById('mode-title');
const modeDescription = document.getElementById('mode-description');
const modeValidation = document.getElementById('mode-validation');
const modeCss = document.getElementById('mode-css');
const exportTabs = Array.from(document.querySelectorAll('.export-tab'));
const exportPanels = Array.from(document.querySelectorAll('.export-panel'));
const pageShell = document.querySelector('.page-shell');
const grainCanvas = document.getElementById('grain');

/* ═══════════════════════════════════════════════════
   ROLE CONTENT — per-mode data
   ═══════════════════════════════════════════════════ */

const ROLE_CONTENT = {
  display: {
    bodyClass: 'font-mode-display',
    specimen: 'Aa',
    specimenClass: 'mode-specimen-word role-display',
    caption: 'Typography carries the emotional weight of the interface.',
    label: 'display',
    title: 'Type as brand presence.',
    description:
      'Large headings, open spacing, serif warmth. Display typography carries the emotional weight of the product and makes it feel unmistakably designed.',
    validation:
      '  \u2713 contrast \u2014 15.4:1 light, 14.8:1 dark\n  \u2713 body line-height \u2014 1.6 (\u2265 1.5)\n  \u2713 heading line-height \u2014 0.95 (< body)\n  \u2713 heading sizes \u2014 h1 \u2192 h6 decreasing\n  \u2713 scale divergence \u2014 within \u00b110%\n\n  5 passed \u00b7 0 errors \u00b7 0 warnings',
    css: '[data-mode="display"] {\n  --ft-heading-line-height: 0.95;\n  --ft-heading-letter-spacing: -0.02em;\n}',
  },
  interface: {
    bodyClass: 'font-mode-interface',
    specimen: 'UI',
    specimenClass: 'mode-specimen-word role-interface',
    caption: 'Typography organizes interaction and keeps dense surfaces legible.',
    label: 'interface',
    title: 'Type as functional hierarchy.',
    description:
      'Tight spacing, neutral sans-serif, crisp weight distinctions. Interface typography favors scanning speed and clear hierarchy over personality.',
    validation:
      '  \u2713 contrast \u2014 12.8:1 light, 11.2:1 dark\n  \u26a0 body line-height \u2014 1.45 (minimum 1.5)\n  \u2713 button font-size \u2014 15px (\u2265 14px)\n  \u2713 heading sizes \u2014 h1 \u2192 h6 decreasing\n  \u2713 font payload \u2014 94KB (\u2264 150KB)\n\n  4 passed \u00b7 0 errors \u00b7 1 warning',
    css: '[data-mode="interface"] {\n  --ft-body-font-size: 0.875rem;\n  --ft-body-line-height: 1.45;\n}',
  },
  reading: {
    bodyClass: 'font-mode-reading',
    specimen: 'Ag',
    specimenClass: 'mode-specimen-word role-reading',
    caption: 'Typography reduces fatigue and builds trust over long sessions.',
    label: 'reading',
    title: 'Type as sustained comfort.',
    description:
      'Generous line-height, controlled measure, serif steadiness. Reading typography slows the page down \u2014 quieter, steadier, built for comprehension.',
    validation:
      '  \u2713 contrast \u2014 15.4:1 light, 14.8:1 dark\n  \u2713 body line-height \u2014 1.7 (\u2265 1.5)\n  \u2713 prose width \u2014 65ch (\u2264 75ch)\n  \u2713 heading/body ratio \u2014 valid\n  \u2713 font fallbacks \u2014 present\n\n  5 passed \u00b7 0 errors \u00b7 0 warnings',
    css: '[data-mode="reading"] {\n  --ft-body-line-height: 1.7;\n  --ft-body-font-size: 1.125rem;\n}',
  },
  mono: {
    bodyClass: 'font-mode-mono',
    specimen: '{ }',
    specimenClass: 'mode-specimen-word role-mono',
    caption: 'Typography exposes the system underneath the product.',
    label: 'mono',
    title: 'Type as raw structure.',
    description:
      'Fixed-width, even rhythm, no optical tricks. Mono typography makes the page feel operational \u2014 the literal structure rendered as text.',
    validation:
      '  \u2713 contrast \u2014 13.6:1 light, 12.1:1 dark\n  \u2713 body line-height \u2014 1.6 (\u2265 1.5)\n  \u2713 font fallbacks \u2014 monospace generic present\n  \u2713 font payload \u2014 62KB (\u2264 150KB)\n  \u2139 font family \u2014 JetBrains Mono (not in catalog)\n\n  4 passed \u00b7 0 errors \u00b7 0 warnings \u00b7 1 info',
    css: '[data-mode="mono"] {\n  --ft-body-font-family: "JetBrains Mono", monospace;\n}',
  },
};

const FONT_MODE_CLASSES = Object.values(ROLE_CONTENT).map((entry) => entry.bodyClass);
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let prefersReducedMotion = motionQuery.matches;

/* ═══════════════════════════════════════════════════
   MODE SWITCHING
   ═══════════════════════════════════════════════════ */

function setRole(role) {
  const content = ROLE_CONTENT[role];
  if (!content) return;

  body.classList.add('mode-transitioning');
  body.classList.remove(...FONT_MODE_CLASSES);
  body.classList.add(content.bodyClass);

  if (modeWord) {
    modeWord.textContent = content.specimen;
    modeWord.className = content.specimenClass;
  }
  if (modeCaption) modeCaption.textContent = content.caption;
  if (modeLabel) modeLabel.textContent = content.label;
  if (modeTitle) modeTitle.textContent = content.title;
  if (modeDescription) modeDescription.textContent = content.description;

  if (modeValidation) {
    const code = modeValidation.querySelector('code');
    if (code) code.textContent = content.validation;
  }

  if (modeCss) {
    const code = modeCss.querySelector('code');
    if (code) code.textContent = content.css;
  }

  roleTabs.forEach((tab) => {
    const isActive = tab.dataset.role === role;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    tab.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  window.clearTimeout(setRole.timeoutId);
  setRole.timeoutId = window.setTimeout(() => {
    body.classList.remove('mode-transitioning');
  }, 1100);
}

setRole.timeoutId = 0;

roleTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const role = tab.dataset.role;
    if (role) setRole(role);
  });
});

function initTablistKeyboard(tabs, getKey, activate) {
  const tablist = tabs[0]?.parentElement;
  if (!tablist) return;
  tablist.addEventListener('keydown', (e) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    let next;
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    tabs[next].focus();
    activate(tabs[next]);
  });
}

initTablistKeyboard(roleTabs, (t) => t.dataset.role, (t) => {
  if (t.dataset.role) setRole(t.dataset.role);
});

/* ═══════════════════════════════════════════════════
   EXPORT FORMAT TABS
   ═══════════════════════════════════════════════════ */

function setExportFormat(format) {
  exportTabs.forEach((t) => {
    const isActive = t.dataset.format === format;
    t.classList.toggle('is-active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    t.setAttribute('tabindex', isActive ? '0' : '-1');
  });
  exportPanels.forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.format === format);
  });
}

exportTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    if (tab.dataset.format) setExportFormat(tab.dataset.format);
  });
});

initTablistKeyboard(exportTabs, (t) => t.dataset.format, (t) => {
  if (t.dataset.format) setExportFormat(t.dataset.format);
});

/* ═══════════════════════════════════════════════════
   3D TILT
   ═══════════════════════════════════════════════════ */

const tiltState = {
  active: false,
  targetX: 0,
  targetY: 0,
  currentX: 0,
  currentY: 0,
  frame: 0,
};

function applyTilt() {
  tiltState.currentX += (tiltState.targetX - tiltState.currentX) * 0.08;
  tiltState.currentY += (tiltState.targetY - tiltState.currentY) * 0.08;

  body.style.setProperty('--tilt-x', tiltState.currentX.toFixed(3));
  body.style.setProperty('--tilt-y', tiltState.currentY.toFixed(3));

  const settled =
    Math.abs(tiltState.targetX - tiltState.currentX) < 0.01 &&
    Math.abs(tiltState.targetY - tiltState.currentY) < 0.01;

  if (settled && !tiltState.active) {
    tiltState.frame = 0;
    return;
  }

  tiltState.frame = window.requestAnimationFrame(applyTilt);
}

function queueTilt() {
  if (!tiltState.frame) {
    tiltState.frame = window.requestAnimationFrame(applyTilt);
  }
}

if (pageShell && !prefersReducedMotion) {
  window.addEventListener('mousemove', (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;

    tiltState.active = true;
    tiltState.targetX = x * 1.2;
    tiltState.targetY = y * -0.8;
    queueTilt();
  });

  window.addEventListener('mouseleave', () => {
    tiltState.active = false;
    tiltState.targetX = 0;
    tiltState.targetY = 0;
    queueTilt();
  });

  window.addEventListener('mousedown', () => {
    tiltState.active = false;
    tiltState.targetX = 0;
    tiltState.targetY = 0;
    queueTilt();
  });

  window.addEventListener('mouseup', () => {
    tiltState.active = false;
  });

  window.addEventListener('blur', () => {
    tiltState.active = false;
    tiltState.targetX = 0;
    tiltState.targetY = 0;
    queueTilt();
  });
}

/* ═══════════════════════════════════════════════════
   SCROLL REVEAL
   ═══════════════════════════════════════════════════ */

function initReveals() {
  const elements = Array.from(document.querySelectorAll('.reveal'));
  if (!elements.length) return;

  if (prefersReducedMotion) {
    elements.forEach((el) => el.classList.add('revealed'));
    return;
  }

  function revealVisible() {
    const vh = window.innerHeight;
    elements.forEach((el) => {
      if (el.classList.contains('revealed')) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.92) {
        el.classList.add('revealed');
      }
    });
  }

  revealVisible();
  window.addEventListener('scroll', revealVisible, { passive: true });
}

setTimeout(initReveals, 60);

/* ═══════════════════════════════════════════════════
   GRAIN OVERLAY
   ═══════════════════════════════════════════════════ */

let grainRunning = false;

function initGrain() {
  if (!grainCanvas || prefersReducedMotion) return;

  const ctx = grainCanvas.getContext('2d');
  if (!ctx) return;

  const size = 256;
  grainCanvas.width = size;
  grainCanvas.height = size;

  const frameCount = 6;
  const frames = [];

  for (let i = 0; i < frameCount; i++) {
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    for (let j = 0; j < data.length; j += 4) {
      const v = Math.random() * 255;
      data[j] = v;
      data[j + 1] = v;
      data[j + 2] = v;
      data[j + 3] = 12;
    }
    frames.push(imageData);
  }

  let index = 0;
  let lastTime = 0;
  grainRunning = true;

  function tick(now) {
    if (!grainRunning) return;
    if (document.hidden) {
      requestAnimationFrame(tick);
      return;
    }
    if (now - lastTime > 80) {
      ctx.putImageData(frames[index], 0, 0);
      index = (index + 1) % frameCount;
      lastTime = now;
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function stopGrain() {
  grainRunning = false;
}

initGrain();

/* ── Reactive reduced-motion ── */

motionQuery.addEventListener('change', () => {
  prefersReducedMotion = motionQuery.matches;
  if (prefersReducedMotion) {
    stopGrain();
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('revealed'));
  } else {
    initGrain();
  }
});

/* ═══════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════ */

setRole('display');

const body = document.body;
const introOverlay = document.getElementById('intro-overlay');
const roleTabs = Array.from(document.querySelectorAll('.role-tab'));
const modeWord = document.getElementById('mode-word');
const modeCaption = document.getElementById('mode-caption');
const modeLabel = document.getElementById('mode-label');
const modeTitle = document.getElementById('mode-title');
const modeDescription = document.getElementById('mode-description');
const pageShell = document.querySelector('.page-shell');

const ROLE_CONTENT = {
  display: {
    bodyClass: 'font-mode-display',
    specimen: 'Aa',
    specimenClass: 'hero-frame-word role-display',
    caption: 'Typography carries the emotional weight of the interface.',
    label: 'display',
    title: 'Type as brand presence.',
    description:
      'Large headings, open spacing, serif warmth. Display typography carries the emotional weight of the product and makes it feel unmistakably designed.',
  },
  interface: {
    bodyClass: 'font-mode-interface',
    specimen: 'UI',
    specimenClass: 'hero-frame-word role-interface',
    caption: 'Typography organizes interaction and keeps dense surfaces legible.',
    label: 'interface',
    title: 'Type as functional hierarchy.',
    description:
      'Tight spacing, neutral sans-serif, crisp weight distinctions. Interface typography favors scanning speed and clear hierarchy over personality.',
  },
  reading: {
    bodyClass: 'font-mode-reading',
    specimen: 'Ag',
    specimenClass: 'hero-frame-word role-reading',
    caption: 'Typography reduces fatigue and builds trust over long sessions.',
    label: 'reading',
    title: 'Type as sustained comfort.',
    description:
      'Generous line-height, controlled measure, serif steadiness. Reading typography slows the page down in a good way — quieter, steadier, built for comprehension.',
  },
  mono: {
    bodyClass: 'font-mode-mono',
    specimen: '{ }',
    specimenClass: 'hero-frame-word role-mono',
    caption: 'Typography exposes the system underneath the product.',
    label: 'mono',
    title: 'Type as raw structure.',
    description:
      'Fixed-width, even rhythm, no optical tricks. Mono typography makes the page feel operational — the literal structure of the system rendered as text.',
  },
};

const FONT_MODE_CLASSES = Object.values(ROLE_CONTENT).map((entry) => entry.bodyClass);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const tiltState = {
  active: false,
  targetX: 0,
  targetY: 0,
  currentX: 0,
  currentY: 0,
  frame: 0,
};

function clearIntro() {
  if (!body.classList.contains('intro-active')) {
    return;
  }

  body.classList.remove('intro-active');
}

function setRole(role) {
  const content = ROLE_CONTENT[role];

  if (!content || !modeWord || !modeCaption || !modeLabel || !modeTitle || !modeDescription) {
    return;
  }

  body.classList.add('mode-transitioning');
  body.classList.remove(...FONT_MODE_CLASSES);
  body.classList.add(content.bodyClass);

  modeWord.textContent = content.specimen;
  modeWord.className = content.specimenClass;
  modeCaption.textContent = content.caption;
  modeLabel.textContent = content.label;
  modeTitle.textContent = content.title;
  modeDescription.textContent = content.description;

  roleTabs.forEach((tab) => {
    const isActive = tab.dataset.role === role;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  window.clearTimeout(setRole.timeoutId);
  setRole.timeoutId = window.setTimeout(() => {
    body.classList.remove('mode-transitioning');
  }, 1100);
}

setRole.timeoutId = 0;

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

roleTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const role = tab.dataset.role;

    if (!role) {
      return;
    }

    clearIntro();
    setRole(role);
  });
});

if (introOverlay) {
  introOverlay.addEventListener('click', clearIntro);
  introOverlay.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      clearIntro();
    }
  });
  introOverlay.addEventListener(
    'wheel',
    (event) => {
      clearIntro();
      window.scrollBy(0, event.deltaY);
    },
    { passive: true },
  );
  introOverlay.addEventListener('touchstart', clearIntro, { passive: true });
}

if (pageShell && !prefersReducedMotion) {
  window.addEventListener('mousemove', (event) => {
    if (body.classList.contains('intro-active')) {
      return;
    }

    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;

    tiltState.active = true;
    tiltState.targetX = x * 1.6;
    tiltState.targetY = y * -1.15;
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

setRole('display');

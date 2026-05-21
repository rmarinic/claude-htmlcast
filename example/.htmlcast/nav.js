/* htmlcast — floating right-side section nav (scroll-spy + quick jump).
 *
 * Each standalone response page loads this once via:
 *     <script defer src="../nav.js"></script>
 * after rendering a sibling
 *     <nav id="section-nav" class="section-nav" aria-label="Jump to section"></nav>
 * element.
 *
 * The script scans the page's <section class="response"> for the known card
 * classes listed in SECTION_MAP, gives each one a deterministic id, then
 * builds a vertical icon-+-label nav fixed to the right edge of the viewport.
 *
 * Click behavior: e.preventDefault() + scrollIntoView({behavior:'smooth'}).
 * The URL hash is intentionally NOT mutated so the in-page jump never
 * interferes with iframe routing on the parent page.
 *
 * Active-state behavior: a scroll-position spy with a marker line that
 * slides from 30% down the viewport (at the top of the page) to 100% (at
 * the bottom). This is the one piece of subtlety here — a static marker
 * misses short sections clustered at the page bottom because the page
 * runs out of scroll before their tops reach the marker. Sliding it down
 * with scroll progress gives every section a chance to activate in both
 * directions. A click temporarily pins the active item; the pin releases
 * the moment the user gesture-scrolls (wheel / touch / keydown).
 */

(function () {
  const SECTION_MAP = [
    { cls: 'user-prompt',        id: 'sec-prompt',    icon: 'i-prompt',    label: 'Prompt' },
    { cls: 'answer-summary',     id: 'sec-tldr',      icon: 'i-tldr',      label: 'TL;DR' },
    { cls: 'response-body',      id: 'sec-answer',    icon: 'i-answer',    label: 'Answer' },
    { cls: 'actions-taken',      id: 'sec-actions',   icon: 'i-actions',   label: 'Actions' },
    { cls: 'generated-files',    id: 'sec-files',     icon: 'i-files',     label: 'Files' },
    { cls: 'references',         id: 'sec-refs',      icon: 'i-refs',      label: 'References' },
    { cls: 'questions-for-user', id: 'sec-questions', icon: 'i-questions', label: 'Questions' },
    { cls: 'next-steps',         id: 'sec-next',      icon: 'i-next',      label: 'Next' },
  ];

  function build() {
    const nav = document.getElementById('section-nav');
    if (!nav) return;
    nav.innerHTML = '';
    nav.classList.remove('visible');

    const root = document.querySelector('section.response');
    if (!root) return;

    const items = [];
    for (const s of SECTION_MAP) {
      const el = root.querySelector(':scope > .' + s.cls);
      if (!el) continue;
      el.id = s.id;
      items.push(s);
    }
    if (items.length < 2) return;

    const ul = document.createElement('ul');
    for (const s of items) {
      const li = document.createElement('li');
      li.innerHTML =
        `<a href="#${s.id}" data-target="${s.id}" title="${s.label}">` +
          `<svg class="nav-icon" aria-hidden="true"><use href="#${s.icon}"/></svg>` +
          `<span>${s.label}</span>` +
        `</a>`;
      ul.appendChild(li);
    }
    nav.appendChild(ul);
    nav.classList.add('visible');

    const linkLis = new Map();
    nav.querySelectorAll('a').forEach((a) => linkLis.set(a.dataset.target, a.parentElement));

    let clickedId = null;
    let clickLockUntil = 0;
    function releaseLock() { clickedId = null; clickLockUntil = 0; }
    ['wheel', 'touchstart', 'keydown'].forEach((ev) => {
      window.addEventListener(ev, releaseLock, { passive: true });
    });

    nav.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const el = document.getElementById(a.dataset.target);
        if (!el) return;
        clickedId = a.dataset.target;
        clickLockUntil = performance.now() + 1500;
        linkLis.forEach((li, id) => li.classList.toggle('active', id === clickedId));
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    function recompute() {
      if (clickedId !== null) {
        if (performance.now() < clickLockUntil) return;
        releaseLock();
      }
      const scrollY = window.scrollY || window.pageYOffset;
      const innerH = window.innerHeight;
      const totalH = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const maxScroll = Math.max(1, totalH - innerH);
      const progress = Math.min(1, Math.max(0, scrollY / maxScroll));
      const markerFromTop = innerH * (0.30 + 0.70 * progress);
      const marker = scrollY + markerFromTop;
      let activeId = items[0].id;
      for (const s of items) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + scrollY;
        if (top <= marker) activeId = s.id;
        else break;
      }
      linkLis.forEach((li, id) => li.classList.toggle('active', id === activeId));
    }

    let rafPending = false;
    function onScroll() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => { rafPending = false; recompute(); });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    recompute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();

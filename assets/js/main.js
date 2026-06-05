(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Theme toggle ----------
  const KEY = 'altv2-theme';
  const root = document.documentElement;
  const stored = localStorage.getItem(KEY);

  if (stored === 'dark' || stored === 'light') {
    root.setAttribute('data-theme', stored);
  }

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const current =
        root.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem(KEY, next);
    });
  }

  // ---------- Sticky header shadow ----------
  const header = document.querySelector('.site-header');
  const onScrollHeader = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  };

  // ---------- Scroll-to-top button ----------
  const scrollTopBtn = document.getElementById('scrollTop');
  const onScrollTop = () => {
    if (scrollTopBtn) scrollTopBtn.classList.toggle('is-visible', window.scrollY > 400);
  };

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    });
  }

  // Combined scroll handler
  const onScroll = () => {
    onScrollHeader();
    onScrollTop();
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- Smooth in-page nav ----------
  if (!reduceMotion) {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const headerH = (document.querySelector('.site-header')?.offsetHeight) || 0;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 12;
        window.scrollTo({ top, behavior: 'smooth' });
        history.pushState(null, '', id);
      });
    });
  }

  // ---------- Active nav highlight on scroll ----------
  const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    const sections = navLinks
      .map((a) => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);

    const setActive = (id) => {
      navLinks.forEach((a) => {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.1, 0.4, 0.8] }
    );

    sections.forEach((s) => io.observe(s));
  }

  // ---------- Yandex Metrika goal delegation ----------
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-goal]');
    if (!el) return;
    const goal = el.getAttribute('data-goal');
    if (!goal || typeof window.ym !== 'function') return;
    window.ym(109350250, 'reachGoal', goal);
  });

  // ---------- Lead form submit (Formspree) + Yandex Metrika goal ----------
  const leadForm = document.getElementById('leadForm');
  if (leadForm) {
    const statusEl = leadForm.querySelector('.lead-form__status');
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = leadForm.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      if (statusEl) statusEl.textContent = 'Отправляем…';

      try {
        const res = await fetch(leadForm.action, {
          method: 'POST',
          body: new FormData(leadForm),
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          // ✅ КОНВЕРСИЯ: цель в Яндекс.Метрику
          if (typeof window.ym === 'function') {
            window.ym(109350250, 'reachGoal', 'form_submit');
          }
          if (statusEl) statusEl.textContent = 'Заявка отправлена. Отвечу в течение 4 часов.';
          leadForm.reset();
        } else if (statusEl) {
          statusEl.textContent = 'Не удалось отправить. Напишите в Telegram или на email.';
        }
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = 'Ошибка сети. Напишите в Telegram или на email.';
        }
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }
})();

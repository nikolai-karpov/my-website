(() => {
  const triggers = document.querySelectorAll('.recommended-tools-trigger');
  if (!triggers.length) return;

  const dialog = document.createElement('dialog');
  dialog.id = 'recommended-tools-dialog';
  dialog.className = 'recommended-tools';
  dialog.setAttribute('aria-labelledby', 'recommended-tools-title');
  dialog.innerHTML = `
    <div class="recommended-tools__header">
      <h2 class="recommended-tools__title" id="recommended-tools-title">Рекомендуемые инструменты</h2>
      <button class="recommended-tools__close" type="button" autofocus>
        Закрыть
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
    </div>
    <section class="recommended-tools__item" aria-labelledby="recommended-tools-vpn">
      <div class="recommended-tools__intro">
        <a class="recommended-tools__icon" href="https://adguard-vpn.com?aid=138084" target="_blank" rel="noopener" aria-label="AdGuard VPN: сайт сервиса (новая вкладка)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 4 4 7 8 9 4-2 8-5 8-9V6l-8-3Z" /><path d="m8 12 3 3 5-6" /></svg>
        </a>
        <div>
          <h3 class="recommended-tools__name" id="recommended-tools-vpn"><a href="https://adguard-vpn.com?aid=138084" target="_blank" rel="noopener">AdGuard VPN</a></h3>
          <p class="recommended-tools__description">проверенный мною ВПН</p>
        </div>
      </div>
      <p class="recommended-tools__label" id="recommended-tools-downloads">Скачать для своей платформы:</p>
      <ul class="recommended-tools__downloads" aria-labelledby="recommended-tools-downloads">
        <li><a href="https://download.adguardcdn.com/d/138084/adguardVPNInstaller.exe" target="_blank" rel="noopener">Windows</a></li>
        <li><a href="https://download.adguardcdn.com/d/138084/AdGuardVPNInstaller.dmg" target="_blank" rel="noopener">Mac</a></li>
        <li><a href="https://download.adguardcdn.com/d/138084/android-vpn" target="_blank" rel="noopener">Android</a></li>
        <li><a href="https://download.adguardcdn.com/d/138084/ios-vpn" target="_blank" rel="noopener">iOS</a></li>
        <li><a href="https://download.adguardcdn.com/d/138084/ext-vpn-edge" target="_blank" rel="noopener">Edge</a></li>
        <li><a href="https://download.adguardcdn.com/d/138084/ext-vpn-firefox" target="_blank" rel="noopener">Firefox</a></li>
        <li><a href="https://download.adguardcdn.com/d/138084/ext-vpn-chrome" target="_blank" rel="noopener">Chrome</a></li>
        <li><a href="https://download.adguardcdn.com/d/138084/ext-vpn-opera" target="_blank" rel="noopener">Opera</a></li>
      </ul>
    </section>
    <section class="recommended-tools__item" aria-labelledby="recommended-tools-kilo">
      <div class="recommended-tools__intro">
        <a class="recommended-tools__icon" href="https://share.kilo.ai/mzXL7uh" target="_blank" rel="noopener" aria-label="KiloCode: организация рабочего места (новая вкладка)">
          <!-- Official Kilo mark: https://kilo.ai/kilo-v4.svg, rendered inline. -->
          <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><path d="M0,0v100h100V0H0ZM92.5925926,92.5925926H7.4074074V7.4074074h85.1851852v85.1851852ZM61.1111044,71.9096084h9.2592593v7.4074074h-11.6402116l-5.026455-5.026455v-11.6402116h7.4074074v9.2592593ZM77.7777711,71.9096084h-7.4074074v-9.2592593h-9.2592593v-7.4074074h11.6402116l5.026455,5.026455v11.6402116ZM46.2962963,61.1114207h-7.4074074v-7.4074074h7.4074074v7.4074074ZM22.2222222,53.7040133h7.4074074v16.6666667h16.6666667v7.4074074h-19.047619l-5.026455-5.026455v-19.047619ZM77.7777711,38.8888889v7.4074074h-24.0740741v-7.4074074h8.2781918v-9.2592593h-8.2781918v-7.4074074h10.6591442l5.026455,5.026455v11.6402116h8.3884749ZM29.6296296,30.5555556h9.2592593l7.4074074,7.4074074v8.3333333h-7.4074074v-8.3333333h-9.2592593v8.3333333h-7.4074074v-24.0740741h7.4074074v8.3333333ZM46.2962963,30.5555556h-7.4074074v-8.3333333h7.4074074v8.3333333Z" /></svg>
        </a>
        <div>
          <h3 class="recommended-tools__name" id="recommended-tools-kilo"><a href="https://share.kilo.ai/mzXL7uh" target="_blank" rel="noopener">KiloCode</a></h3>
          <p class="recommended-tools__description">Инструмент для организации рабочего места</p>
        </div>
      </div>
    </section>`;
  document.body.append(dialog);

  let opener;
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      opener = trigger;
      dialog.showModal();
      document.documentElement.classList.add('recommended-tools-open');
    });
  });

  dialog.querySelector('.recommended-tools__close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('recommended-tools-open');
    opener?.focus({ preventScroll: true });
  });

  // Only a full pointer gesture on the backdrop closes the dialog, not a text drag.
  const isBackdrop = (event) => {
    const rect = dialog.getBoundingClientRect();
    return event.target === dialog && (
      event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom
    );
  };
  let backdropPointerDown = false;
  dialog.addEventListener('pointerdown', (event) => { backdropPointerDown = isBackdrop(event); });
  dialog.addEventListener('click', (event) => {
    if (backdropPointerDown && isBackdrop(event)) dialog.close();
    backdropPointerDown = false;
  });

  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button, a[href]')];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
})();

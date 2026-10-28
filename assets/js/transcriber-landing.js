/* Standalone landing: synthetic editor demo and the portfolio's existing lead form. */
(() => {
  'use strict';
  const speaker = document.getElementById('demo-speaker');
  const names = { a: 'Участник А', b: 'Участник Б' };
  if (speaker) {
    speaker.addEventListener('change', () => {
      if (!Object.hasOwn(names, speaker.value)) return;
      document.getElementById('demo-assignee').textContent = names[speaker.value];
      document.getElementById('demo-status').textContent =
        'Говорящий изменён в демонстрации. Реальная расшифровка не обрабатывалась.';
    });
  }
  const form = document.getElementById('transcriber-request');
  if (!form) return;
  const scenario = document.getElementById('request-scenario');
  const allowedScenarios = new Set([...scenario.options].map((option) => option.value));
  document.querySelectorAll('[data-scenario]').forEach((link) => {
    link.addEventListener('click', () => {
      if (allowedScenarios.has(link.dataset.scenario)) scenario.value = link.dataset.scenario;
    });
  });
  const status = document.getElementById('form-status');
  const button = form.querySelector('button[type="submit"]');
  let submitting = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting || !form.reportValidity()) return;
    submitting = true;
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Отправляем заявку…';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        signal: controller.signal,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result && result.ok === true) {
        status.textContent = 'Заявка принята сервисом доставки. Николай свяжется с вами по указанной почте.';
        form.reset();
      } else {
        status.textContent = 'Приём заявки не подтверждён. Проверьте данные или свяжитесь по почте / в Telegram рядом с формой.';
      }
    } catch {
      status.textContent = 'Не удалось подтвердить доставку из-за ошибки сети или таймаута. Если заявка не дошла, напишите на почту или в Telegram. Автоматической повторной отправки нет.';
    } finally {
      window.clearTimeout(timeout);
      submitting = false;
      button.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
})();

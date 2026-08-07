(() => {
  const DATASET_URL = 'data/marketing-ai-copilot/latest.json';
  const DRAFT_KEY = 'marketing-ai-copilot-overrides-draft';
  const statusLabels = {
    ok: 'ok',
    manual_required: 'ручной ввод',
    ignored: 'ignored',
    not_configured: 'не настроено',
    api_error: 'ошибка API',
  };

  const formatNumber = (value) => {
    const number = Number(value || 0);
    return new Intl.NumberFormat('ru-RU').format(number);
  };

  const formatRub = (value) => {
    const number = Number(value || 0);
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(number);
  };

  const text = (selector, value) => {
    document.querySelectorAll(selector).forEach((node) => {
      node.textContent = value;
    });
  };

  const statusClass = (status) => {
    if (status === 'ok') return 'mi-status--ok';
    if (status === 'ignored' || status === 'manual_required') return 'mi-status--warn';
    if (status === 'api_error') return 'mi-status--danger';
    return 'mi-status--info';
  };

  const statusBadge = (status) =>
    `<span class="mi-status ${statusClass(status)}">${statusLabels[status] || status}</span>`;

  const escapeHtml = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[char]);

  const getProjectLeads = (project) => {
    const summary = project?.metrics?.goal_costs?.summary;
    return Number(summary?.total_goal_reaches || 0);
  };

  const getProjectSpend = (project) => {
    const summary = project?.metrics?.goal_costs?.summary;
    return Number(summary?.spend_rub || 0);
  };

  const getProjectCpa = (project) => {
    const summary = project?.metrics?.goal_costs?.summary;
    return summary?.cpa_rub ?? null;
  };

  const renderDashboard = (dataset) => {
    const leads = dataset.view_model?.leads || {};
    const counts = dataset.status_counts || {};
    text('[data-md-projects-total]', String(dataset.projects_total ?? '—'));
    text('[data-md-projects-verified]', `${dataset.projects_verified ?? 0}/${dataset.projects_configured ?? 0}`);
    text('[data-md-leads]', formatNumber(leads.lead_count));
    text('[data-md-spend]', formatRub(leads.spend_rub));
    text('[data-md-cpa]', leads.cpa_defined ? formatRub(leads.cpa_rub) : 'н/д');
    text(
      '[data-md-status-summary]',
      `${counts.ok || 0} ok · ${counts.manual_required || 0} ручн. · ${counts.ignored || 0} ignored`
    );
    text('[data-md-generated]', dataset.generated_at ? `обновлено ${dataset.generated_at}` : 'нет timestamp');

    const tbody = document.querySelector('[data-md-projects]');
    if (!tbody) return;
    tbody.innerHTML = (dataset.projects || [])
      .map((project) => {
        const coverage = project.collector_coverage || {};
        const missing = project.identity?.missing_fields || [];
        const ignored = coverage.ignored ? `${coverage.ignored} ignored` : '';
        const failed = coverage.failed ? `${coverage.failed} failed` : '';
        const attention = [missing.join(', '), ignored, failed].filter(Boolean).join(' · ') || 'нет блокеров';
        const cpa = getProjectCpa(project);
        return `
          <tr>
            <td data-label="Проект">${escapeHtml(project.display_name || project.slug)}</td>
            <td data-label="Статус">${statusBadge(project.status)}</td>
            <td data-label="Источники">${coverage.succeeded || 0}/${coverage.attempted || 0}</td>
            <td data-label="Заявки">${formatNumber(getProjectLeads(project))}</td>
            <td data-label="Расход">${formatRub(getProjectSpend(project))}</td>
            <td data-label="CPA">${cpa === null ? 'н/д' : formatRub(cpa)}</td>
            <td data-label="Что требует внимания">${escapeHtml(attention)}</td>
          </tr>
        `;
      })
      .join('');
  };

  const readDraft = () => {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{"schema_version":"1.0","variables":{}}');
    } catch (_err) {
      return { schema_version: '1.0', variables: {} };
    }
  };

  const writeDraft = (draft) => {
    draft.schema_version = '1.0';
    draft.updated_at = new Date().toISOString();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    const textarea = document.querySelector('[data-md-override-json]');
    if (textarea) textarea.value = JSON.stringify(draft, null, 2);
  };

  const setDraftVariable = (variable, status) => {
    const draft = readDraft();
    draft.variables = draft.variables || {};
    draft.variables[variable.id] = {
      status,
      value: status === 'ignored' ? null : variable.value ?? null,
      reason: status === 'ignored' ? 'Operator ignored this variable for dashboard analysis.' : 'Operator will fill this value manually.',
      updated_by: 'dashboard_operator',
      updated_at: new Date().toISOString(),
    };
    writeDraft(draft);
  };

  const renderManualDrawer = (dataset) => {
    const root = document.querySelector('[data-manual-drawer]');
    if (!root) return;
    const list = root.querySelector('[data-md-manual-vars]');
    if (!list) return;
    const variables = (dataset.variables || []).filter((variable) =>
      ['manual_required', 'ignored'].includes(variable.status)
    );
    writeDraft(readDraft());
    if (!variables.length) {
      list.innerHTML = '<article class="mw-override-item"><strong>Нет ручных блокеров</strong><span>Все dashboard-переменные собраны или уже имеют допустимый статус.</span></article>';
      return;
    }
    list.innerHTML = variables
      .map((variable) => `
        <article class="mw-override-item" data-variable-id="${variable.id}">
          <div>
            <strong>${escapeHtml(variable.id)}</strong>
            <span>${escapeHtml(statusLabels[variable.status] || variable.status)}${variable.note ? ' · ' + escapeHtml(variable.note) : ''}</span>
          </div>
          <div class="mw-override-actions">
            <button type="button" data-override-status="ok">Ввести вручную</button>
            <button type="button" data-override-status="ignored">Игнорировать</button>
          </div>
        </article>
      `)
      .join('');
    list.querySelectorAll('[data-override-status]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = button.closest('[data-variable-id]');
        const variable = variables.find((entry) => entry.id === item?.getAttribute('data-variable-id'));
        if (!variable) return;
        setDraftVariable(variable, button.getAttribute('data-override-status'));
      });
    });
  };

  const bindCopyButton = () => {
    const button = document.querySelector('[data-md-copy-overrides]');
    const textarea = document.querySelector('[data-md-override-json]');
    const status = document.querySelector('[data-md-copy-status]');
    if (!button || !textarea) return;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(textarea.value);
        if (status) status.textContent = 'JSON скопирован';
      } catch (_err) {
        textarea.select();
        if (status) status.textContent = 'Выделите и скопируйте JSON вручную';
      }
    });
  };

  const boot = async () => {
    if (!document.querySelector('[data-marketing-dashboard], [data-manual-drawer]')) return;
    bindCopyButton();
    try {
      const response = await fetch(DATASET_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const dataset = await response.json();
      renderDashboard(dataset);
      renderManualDrawer(dataset);
    } catch (_err) {
      text('[data-md-status-summary]', 'dataset недоступен');
      const tbody = document.querySelector('[data-md-projects]');
      if (tbody) tbody.innerHTML = '<tr><td colspan="7">Не удалось загрузить публичный dataset.</td></tr>';
    }
  };

  boot();
})();

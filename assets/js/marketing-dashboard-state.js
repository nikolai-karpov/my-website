(function () {
  const DATA_URL = "data/marketing-ai-copilot/latest.json";

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    const node = byId(id);
    if (node && value) {
      node.textContent = value;
    }
  }

  function formatGeneratedAt(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function list(values, limit) {
    if (!Array.isArray(values) || values.length === 0) return "н/д";
    const shown = values.slice(0, limit).join(", ");
    return values.length > limit ? `${shown} +${values.length - limit}` : shown;
  }

  function statusSummary(data) {
    const counts = data.status_counts || {};
    const ok = counts.ok || 0;
    const manual = counts.manual_required || 0;
    const errors = counts.api_error || 0;
    const ignored = counts.ignored || 0;
    return `JSON dataset · ok ${ok} · manual ${manual} · api ${errors} · ignored ${ignored}`;
  }

  function connectorSummary(data) {
    const connectors = data.connectors || {};
    const counts = connectors.status_counts || {};
    const manual = counts.manual_required || 0;
    const missing = counts.not_configured || 0;
    const errors = counts.api_error || 0;
    const ok = counts.ok || 0;
    return `коннекторы ok ${ok} · manual ${manual} · not configured ${missing} · api ${errors}`;
  }

  function variables(data) {
    return Array.isArray(data.variables) ? data.variables : [];
  }

  function viewModel(data) {
    return data.view_model && typeof data.view_model === "object" ? data.view_model : {};
  }

  function variablesBySuffix(data, suffix) {
    return variables(data).filter((item) => typeof item.id === "string" && item.id.endsWith(suffix));
  }

  function countStatus(items, status) {
    return items.filter((item) => item.status === status).length;
  }

  function formatRub(value) {
    return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value)} ₽`;
  }

  function setAlert(id, level, label, title, body) {
    const node = byId(id);
    if (!node) return;
    node.className = `mi-alert mi-alert--${level}`;
    const labelNode = node.querySelector("span");
    const titleNode = node.querySelector(".mi-alert__title");
    const bodyNode = node.querySelector("p");
    if (labelNode) labelNode.textContent = label;
    if (titleNode) titleNode.textContent = title;
    if (bodyNode) bodyNode.textContent = body;
  }

  function updateQualityNotice(data) {
    const model = viewModel(data);
    const summary = model.summary || {};
    const counts = data.status_counts || {};
    const scope = data.scope || {};
    const total = scope.projects_total || 0;
    const verified = scope.projects_verified || 0;
    const apiErrors = counts.api_error || 0;
    const manual = counts.manual_required || 0;
    const title = summary.title || (apiErrors > 0 || verified < total
        ? "Дашборд в режиме диагностики, бюджетные выводы заблокированы"
        : "Dataset верифицирован для текущего управленческого вывода");
    const body = `${summary.body || `Проекты verified ${verified}/${total}; переменные ok ${counts.ok || 0}, manual ${manual}, api ${apiErrors}.`} Missing/manual значения не считаются нулями и не подставляются в CPA.`;
    setAlert("marketingDataQualityNotice", apiErrors > 0 ? "danger" : verified < total ? "warn" : "info", "Состояние dataset", title, body);
  }

  function updateKpis(data) {
    const model = viewModel(data);
    const leads = model.leads || {};
    const budget = model.budget || {};
    const scope = data.scope || {};
    const counts = data.status_counts || {};
    const cpa = variablesBySuffix(data, ".cpa.goal_specific");
    const cpaOk = countStatus(cpa, "ok");
    const cpaBlocked = cpa.length - cpaOk;
    setText(
      "marketingLeadsKpiValue",
      leads.status === "ok" && leads.lead_count === 0 ? "лиды 0" : leads.status === "ok" ? "CPA ok" : "manual"
    );
    setText(
      "marketingLeadsKpiNote",
      leads.status === "ok" && leads.lead_count === 0
        ? leads.note || "Заявок по цели формы нет; CPA появится после первого лида."
        : cpaBlocked
        ? `Goal-specific CPA заблокирован у ${cpaBlocked}/${cpa.length} проектов; лиды не считаются нулем.`
        : leads.note || "CPA считается только по явным Metrika goal IDs."
    );

    const spend = variablesBySuffix(data, ".direct.weekly.cost_rub");
    const spendOk = spend.filter((item) => item.status === "ok" && typeof item.value === "number");
    const totalSpend = spendOk.reduce((sum, item) => sum + item.value, 0);
    setText(
      "marketingSpendKpiValue",
      budget.status === "ok" && typeof budget.weekly_spend_rub === "number"
        ? formatRub(budget.weekly_spend_rub)
        : spendOk.length === spend.length && spend.length
        ? formatRub(totalSpend)
        : "partial/manual"
    );
    setText(
      "marketingSpendKpiNote",
      spendOk.length === spend.length && spend.length
        ? "Недельный расход собран по всем project artifacts."
        : `Расход собран частично: ok ${spendOk.length}/${spend.length}; недостающие проекты не равны нулю.`
    );

    setText("marketingTrustKpiValue", `${scope.projects_verified || 0}/${scope.projects_total || 0}`);
    setText(
      "marketingTrustKpiNote",
      `Верификация проектов; переменные ok ${counts.ok || 0}, manual ${counts.manual_required || 0}, api ${counts.api_error || 0}.`
    );
  }

  function updateWorkbenchStatus(data) {
    const model = viewModel(data);
    const leads = model.leads || {};
    const bridge = model.direct_metrika_bridge || {};
    const goals = variablesBySuffix(data, ".identity.conversion_goal_ids");
    const goalsOk = countStatus(goals, "ok");
    const goalsBlocked = goals.length - goalsOk;
    setText("marketingGoalStatus", goalsBlocked ? `цели ${goalsOk}/${goals.length}` : "цели ok");
    setText(
      "marketingGoalStatusNote",
      goalsBlocked
        ? `У ${goalsBlocked}/${goals.length} проектов нет выбранного lead goal ID; CPA заблокирован.`
        : "CPA можно считать только по выбранным goal IDs, не по all goals."
    );

    const directCosts = variablesBySuffix(data, ".metrika.direct_costs");
    const directCostErrors = typeof bridge.api_errors === "number" ? bridge.api_errors : countStatus(directCosts, "api_error");
    const directCostOk = countStatus(directCosts, "ok");
    setText(
      "marketingDirectMetrikaStatus",
      directCostErrors ? `api_error ${directCostErrors}/${directCosts.length}` : `ok ${directCostOk}/${directCosts.length}`
    );
    setText(
      "marketingDirectMetrikaStatusNote",
      directCostErrors
        ? bridge.note || "Direct-Metrika cost bridge не используется как нулевой расход."
        : bridge.note || "Direct costs доступны в проектных артефактах."
    );

    const cpa = variablesBySuffix(data, ".cpa.goal_specific");
    const cpaOk = countStatus(cpa, "ok");
    setText(
      "marketingCurrentValueStatus",
      leads.status === "ok" && leads.lead_count === 0
        ? "лиды 0 · CPA не определён"
        : leads.status === "ok" || (cpaOk === cpa.length && cpa.length)
        ? "Goal-specific CPA ok"
        : "CPA manual_required · лиды не ноль"
    );
  }

  function applyDemoGuards(data) {
    const model = viewModel(data);
    const guard = model.ui && model.ui.static_blocks_guard;
    if (!guard || !guard.message) return;
    document.querySelectorAll("[data-dashboard-demo]").forEach((node) => {
      if (node.querySelector(".mi-demo-note")) return;
      const id = node.getAttribute("data-dashboard-demo");
      const note = document.createElement("div");
      note.className = "mi-demo-note";
      note.textContent = `${guard.message} Блок: ${id || "demo"}.`;
      node.prepend(note);
    });
  }

  function applyDashboardState(data) {
    const scope = data.scope || {};
    setText("marketingDataUpdatedAt", formatGeneratedAt(data.generated_at));
    setText(
      "marketingDataScope",
      `Проектов ${scope.projects_configured || 0}/${scope.projects_total || 0} · кампании ${list(scope.campaign_ids, 5)} · счётчики ${list(scope.counter_ids, 5)}`
    );
    setText("marketingDataType", statusSummary(data));
    setText(
      "marketingDataSource",
      `Direct + Метрика + Wordstat · ${connectorSummary(data)} · ${
        data.variables ? data.variables.length : 0
      } переменных`
    );
    setText(
      "marketingDataFreshness",
      `${formatGeneratedAt(data.generated_at)} · verified ${scope.projects_verified || 0}/${scope.projects_total || 0}`
    );
    updateQualityNotice(data);
    updateKpis(data);
    updateWorkbenchStatus(data);
    applyDemoGuards(data);
  }

  fetch(DATA_URL, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(applyDashboardState)
    .catch(() => {
      setText("marketingDataType", "Dataset недоступен · статический макет");
      setText("marketingDataFreshness", "Dataset недоступен · статический макет");
      setAlert(
        "marketingDataQualityNotice",
        "danger",
        "Dataset недоступен",
        "Статические блоки не являются текущей аналитикой",
        "Без JSON dataset нельзя делать выводы по CPA, лидам, расходу или качеству кампаний."
      );
    });
})();

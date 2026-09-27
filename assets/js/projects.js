/**
 * assets/js/projects.js
 *
 * Страница-навигатор «Где лежат мои проекты» (site-pages/projects.html).
 * Загружает site-pages/data/repos.json, рендерит группы и карточки
 * репозиториев, даёт поиск и фильтры по площадке/доступу/группе.
 *
 * Данные приходят из внешнего JSON, который собирает другой процесс —
 * поля могут быть null (repo/url при masked:true) или отсутствовать
 * (description). Код должен переживать это, не падая и не вставляя
 * пользовательский текст через innerHTML.
 */
(function () {
  'use strict';

  var DATA_URL = 'data/repos.json';

  var els = {};
  var state = {
    query: '',
    platform: 'all',
    access: 'all',
    group: 'all',
  };

  var groupOpenState = Object.create(null);

  var data = null;

  function platformLabel(platform) {
    if (platform === 'github') return 'GitHub';
    if (platform === 'sourcecraft') return 'SourceCraft';
    return platform || '—';
  }

  function visibilityLabel(visibility) {
    if (visibility === 'private') return 'закрыт';
    if (visibility === 'internal') return 'внутренний';
    return '';
  }

  function isClosed(visibility) {
    return visibility === 'private' || visibility === 'internal';
  }

  function formatDateLong(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    try {
      return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch (e) {
      return iso;
    }
  }

  function formatDateShort(iso) {
    if (!iso) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return '';
    return m[3] + '.' + m[2] + '.' + m[1];
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function safeArray(v) {
    return Array.isArray(v) ? v : [];
  }

  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function projectSearchBlob(project) {
    var parts = [
      project.title || '',
      project.description || '',
      project.language || '',
      project.id || '',
    ];
    safeArray(project.locations).forEach(function (loc) {
      if (!loc) return;
      parts.push(loc.owner || '');
      parts.push(loc.repo || '');
    });
    return parts.join(' \n ').toLowerCase();
  }

  function projectHasPlatform(project, platform) {
    if (platform === 'all') return true;
    return safeArray(project.locations).some(function (loc) {
      return loc && loc.platform === platform;
    });
  }

  function projectMatchesAccess(project, access) {
    if (access === 'all') return true;
    if (access === 'public') return !isClosed(project.visibility);
    if (access === 'closed') return isClosed(project.visibility);
    return true;
  }

  function projectMatchesQuery(project, query) {
    if (!query) return true;
    return projectSearchBlob(project).indexOf(query) !== -1;
  }

  function matchesFilters(project) {
    return (
      projectMatchesQuery(project, state.query) &&
      projectHasPlatform(project, state.platform) &&
      projectMatchesAccess(project, state.access)
    );
  }

  function groupIsSecondary(group) {
    return !!(group && group.secondary);
  }

  function buildLockBadge(visibility) {
    var label = visibilityLabel(visibility);
    if (!label) return null;
    var badge = el('span', 'repo-card__lock', null);
    var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '1.8');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('class', 'repo-card__lock-icon');
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '5');
    rect.setAttribute('y', '11');
    rect.setAttribute('width', '14');
    rect.setAttribute('height', '9');
    rect.setAttribute('rx', '2');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M8 11V8a4 4 0 0 1 8 0v3');
    path.setAttribute('stroke-linecap', 'round');
    icon.appendChild(rect);
    icon.appendChild(path);
    badge.appendChild(icon);
    badge.appendChild(el('span', null, label));
    return badge;
  }

  function isHttpsUrl(url) {
    if (typeof url !== 'string') return false;
    try {
      return new URL(url).protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  function buildLocationNode(loc) {
    var hasUrl = loc && loc.url && !loc.masked && isHttpsUrl(loc.url);
    if (hasUrl) {
      var a = el('a', 'repo-card__link', null);
      a.href = loc.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.appendChild(el('span', 'repo-card__link-platform', platformLabel(loc.platform)));
      if (loc.owner || loc.repo) {
        a.appendChild(
          el(
            'span',
            'repo-card__link-owner',
            (loc.owner || '?') + '/' + (loc.repo || '?')
          )
        );
      }
      return a;
    }

    // masked или без url/repo — неактивная плашка, не ссылка.
    var span = el('span', 'repo-card__link repo-card__link--masked', null);
    span.appendChild(el('span', 'repo-card__link-platform', platformLabel(loc && loc.platform)));
    var ownerText = loc && loc.owner ? loc.owner : null;
    span.appendChild(
      el('span', 'repo-card__link-owner', ownerText ? ownerText + ' · адрес скрыт' : 'адрес скрыт')
    );
    return span;
  }

  function buildCard(project) {
    var card = el('article', 'repo-card', null);
    if (project.is_fork) card.classList.add('repo-card--fork');

    var head = el('div', 'repo-card__head', null);
    head.appendChild(el('h3', 'repo-card__title', project.title || project.id || 'Без названия'));
    var lock = buildLockBadge(project.visibility);
    if (lock) head.appendChild(lock);
    card.appendChild(head);

    if (project.is_fork) {
      var forkOf = project.fork_of
        ? 'форк ' + project.fork_of
        : 'форк';
      card.appendChild(el('div', 'repo-card__fork-of', forkOf));
    }

    if (project.description) {
      card.appendChild(el('p', 'repo-card__desc', project.description));
    } else {
      card.appendChild(el('p', 'repo-card__desc repo-card__desc--empty', 'без описания'));
    }

    var meta = el('div', 'repo-card__meta', null);
    if (project.language) {
      meta.appendChild(el('span', 'repo-card__tag', project.language));
    }
    var updated = formatDateShort(project.updated);
    if (updated) {
      meta.appendChild(el('span', 'repo-card__date', 'обновлён ' + updated));
    }
    if (project.is_empty) {
      meta.appendChild(el('span', 'repo-card__badge repo-card__badge--empty', 'пустой'));
    }
    if (meta.childNodes.length) card.appendChild(meta);

    var links = el('div', 'repo-card__links', null);
    var locations = safeArray(project.locations);
    if (locations.length) {
      locations.forEach(function (loc) {
        links.appendChild(buildLocationNode(loc));
      });
    } else {
      links.appendChild(el('span', 'repo-card__link repo-card__link--masked', 'адрес не указан'));
    }
    card.appendChild(links);

    return card;
  }

  function buildGroupSection(group, projects) {
    var visible = projects.filter(matchesFilters);
    if (!visible.length) return null;

    var isSecondary = groupIsSecondary(group);
    var section;
    var body;

    if (isSecondary) {
      section = el('details', 'projects-group projects-group--secondary', null);
      var forceOpen = !!state.query || state.group === group.id;
      var wasOpen = groupOpenState[group.id];
      section.open = forceOpen || !!wasOpen;
      section.addEventListener('toggle', function () {
        groupOpenState[group.id] = section.open;
      });
      var summary = el('summary', 'projects-group__head', null);
      summary.appendChild(el('span', 'projects-group__title', group.title || group.id));
      summary.appendChild(el('span', 'projects-group__count', String(visible.length)));
      section.appendChild(summary);
      body = el('div', 'projects-grid', null);
      section.appendChild(body);
    } else {
      section = el('section', 'projects-group', null);
      var head = el('div', 'projects-group__head', null);
      head.appendChild(el('h2', 'projects-group__title', group.title || group.id));
      head.appendChild(el('span', 'projects-group__count', String(visible.length)));
      section.appendChild(head);
      body = el('div', 'projects-grid', null);
      section.appendChild(body);
    }

    visible.forEach(function (project) {
      body.appendChild(buildCard(project));
    });

    return section;
  }

  function renderCounters() {
    clearNode(els.counters);
    var projects = safeArray(data.projects);
    var total = projects.length;
    var closed = projects.filter(function (p) {
      return isClosed(p.visibility);
    }).length;
    var forks = projects.filter(function (p) {
      return p.is_fork;
    }).length;

    var items = [
      { label: 'проектов', value: total },
      { label: 'из них закрытых', value: closed },
      { label: 'форков', value: forks },
    ];

    items.forEach(function (item) {
      var counter = el('div', 'projects-counter', null);
      counter.appendChild(el('span', 'projects-counter__value', String(item.value)));
      counter.appendChild(el('span', 'projects-counter__label', item.label));
      els.counters.appendChild(counter);
    });

    var snapshot = formatDateLong(data.generated_at);
    els.snapshot.textContent = snapshot
      ? 'Снимок от ' + snapshot
      : 'Дата снимка неизвестна';
  }

  function renderChips() {
    clearNode(els.chips);
    var groups = safeArray(data.groups);
    if (!groups.length) return;

    var allChip = el('button', 'projects-chip', 'Все группы');
    allChip.type = 'button';
    allChip.dataset.value = 'all';
    if (state.group === 'all') allChip.classList.add('is-active');
    els.chips.appendChild(allChip);

    groups.forEach(function (group) {
      var count = safeArray(data.projects).filter(function (p) {
        return p.group === group.id;
      }).length;
      if (!count) return;
      var chip = el('button', 'projects-chip', (group.title || group.id) + ' · ' + count);
      chip.type = 'button';
      chip.dataset.value = group.id;
      if (state.group === group.id) chip.classList.add('is-active');
      els.chips.appendChild(chip);
    });

    els.chips.querySelectorAll('.projects-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var value = chip.dataset.value;
        state.group = state.group === value ? 'all' : value;
        render();
      });
    });
  }

  function render() {
    if (!data) return;

    renderChips();

    clearNode(els.groups);
    var groups = safeArray(data.groups);
    var projectsByGroup = Object.create(null);
    safeArray(data.projects).forEach(function (project) {
      var gid = project.group || '__ungrouped__';
      if (!projectsByGroup[gid]) projectsByGroup[gid] = [];
      projectsByGroup[gid].push(project);
    });

    var anyVisible = false;
    var primarySections = [];
    var secondarySections = [];

    groups.forEach(function (group) {
      if (state.group !== 'all' && state.group !== group.id) return;
      var groupProjects = projectsByGroup[group.id] || [];
      var section = buildGroupSection(group, groupProjects);
      if (!section) return;
      anyVisible = true;
      if (groupIsSecondary(group)) {
        secondarySections.push(section);
      } else {
        primarySections.push(section);
      }
    });

    primarySections.forEach(function (s) {
      els.groups.appendChild(s);
    });
    secondarySections.forEach(function (s) {
      els.groups.appendChild(s);
    });

    els.empty.hidden = anyVisible;
  }

  function bindFilterGroup(container, key) {
    container.querySelectorAll('.projects-filter-btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.classList.contains('is-active') ? 'true' : 'false');
      btn.addEventListener('click', function () {
        container.querySelectorAll('.projects-filter-btn').forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        state[key] = btn.dataset.value;
        render();
      });
    });
  }

  function showError() {
    els.error.hidden = false;
    els.empty.hidden = true;
    clearNode(els.groups);
    clearNode(els.counters);
    els.snapshot.textContent = 'Данные недоступны';
  }

  function init() {
    els.snapshot = document.getElementById('projectsSnapshot');
    els.counters = document.getElementById('projectsCounters');
    els.search = document.getElementById('projectsSearch');
    els.platformFilter = document.getElementById('projectsPlatformFilter');
    els.accessFilter = document.getElementById('projectsAccessFilter');
    els.chips = document.getElementById('projectsChips');
    els.groups = document.getElementById('projectsGroups');
    els.empty = document.getElementById('projectsEmpty');
    els.error = document.getElementById('projectsError');

    els.search.addEventListener('input', function () {
      state.query = els.search.value.trim().toLowerCase();
      render();
    });
    bindFilterGroup(els.platformFilter, 'platform');
    bindFilterGroup(els.accessFilter, 'access');

    fetch(DATA_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        data = json && typeof json === 'object' ? json : { groups: [], projects: [] };
        data.groups = safeArray(data.groups);
        data.projects = safeArray(data.projects);
        renderCounters();
        render();
      })
      .catch(function () {
        showError();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

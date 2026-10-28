(() => {
  'use strict';

  const screenButtons = [...document.querySelectorAll('[data-screen]')];
  const screens = [...document.querySelectorAll('[data-panel]')];
  const screenFeedback = document.getElementById('screen-feedback');
  const screenNames = {
    queue: 'Записи и очередь', editor: 'Рабочее место секретаря',
    voices: 'Подписать голоса', privacy: 'Проверка замен',
    minutes: 'Итоги и протокол', restore: 'Карта восстановления',
  };
  function showScreen(name, focus = false) {
    if (!Object.hasOwn(screenNames, name)) return;
    screens.forEach((screen) => {
      const active = screen.dataset.panel === name;
      screen.hidden = !active;
      screen.classList.toggle('is-active', active);
    });
    screenButtons.forEach((button) => {
      const active = button.dataset.screen === name;
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
      if (active && focus) button.focus();
    });
    screenFeedback.textContent = `Открыт экран «${screenNames[name]}».`;
  }
  screenButtons.forEach((button, index) => {
    button.addEventListener('click', () => showScreen(button.dataset.screen));
    button.addEventListener('keydown', (event) => {
      let next = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % screenButtons.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + screenButtons.length) % screenButtons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = screenButtons.length - 1;
      else return;
      event.preventDefault();
      showScreen(screenButtons[next].dataset.screen, true);
    });
  });
  document.querySelectorAll('[data-screen-link]').forEach((button) => {
    button.addEventListener('click', () => showScreen(button.dataset.screenLink));
  });
  const openHashScreen = () => {
    const name = window.location.hash.slice(1);
    if (Object.hasOwn(screenNames, name)) showScreen(name);
  };
  window.addEventListener('hashchange', openHashScreen);
  openHashScreen();

  document.querySelectorAll('[data-feedback]').forEach((button) => {
    button.addEventListener('click', () => { screenFeedback.textContent = button.dataset.feedback; });
  });

  const recordSearch = document.getElementById('record-search');
  const recordItems = [...document.querySelectorAll('.record-item')];
  recordSearch.addEventListener('input', () => {
    const query = recordSearch.value.trim().toLocaleLowerCase('ru');
    recordItems.forEach((item) => { item.hidden = !item.textContent.toLocaleLowerCase('ru').includes(query); });
  });
  const jobTitle = document.getElementById('job-title');
  const selectedTitle = document.getElementById('selected-record-title');
  const jobState = document.getElementById('job-state');
  const records = {
    planning: ['Планирование', 'Готово', 'meeting-demo-01.m4a · 18:42 · сегодня, 10:14'],
    review: ['Обзор этапа', 'Обработка · 62%', 'meeting-demo-02.m4a · 26:08 · сегодня, 09:42'],
    brief: ['Бриф', 'В очереди · № 2', 'meeting-demo-03.m4a · ожидает обработки'],
  };
  const queueContent = document.querySelector('.queue-content');
  const queueStatus = document.createElement('div');
  queueStatus.className = 'source-note';
  queueStatus.hidden = true;
  document.querySelector('.job-heading').after(queueStatus);
  recordItems.forEach((item) => {
    item.addEventListener('click', () => {
      recordItems.forEach((entry) => entry.classList.toggle('selected', entry === item));
      const data = records[item.dataset.record];
      jobTitle.textContent = data[0];
      selectedTitle.textContent = data[0];
      jobState.textContent = data[1];
      jobState.className = `pill ${item.dataset.record === 'planning' ? 'success' : 'review'}`;
      document.querySelector('.job-heading > div > p:last-child').textContent = data[2];
      queueContent.hidden = item.dataset.record !== 'planning';
      queueStatus.hidden = item.dataset.record === 'planning';
      queueStatus.textContent = item.dataset.record === 'review'
        ? 'Демо-обработка: 62%. Расшифровка и результаты ещё не готовы. Прогресс условный, реального задания нет.'
        : 'Демо-очередь: № 2. Обработка не началась; расшифровки и результатов ещё нет.';
      screenFeedback.textContent = `Выбрана демонстрационная запись «${data[0]}». Данные синтетические.`;
    });
  });

  const textInput = document.getElementById('utterance-text');
  const speakerInput = document.getElementById('utterance-speaker');
  const applyEdit = document.getElementById('apply-edit');
  const undoEdit = document.getElementById('undo-edit');
  const historyBox = document.getElementById('history-box');
  const historyList = document.getElementById('history-list');
  const editFeedback = document.getElementById('edit-feedback');
  const staleResults = document.getElementById('stale-results');
  const protocolState = document.getElementById('protocol-state');
  const regeneratedNote = document.createElement('p');
  regeneratedNote.id = 'regenerated-note';
  regeneratedNote.className = 'minutes-design-note';
  regeneratedNote.hidden = true;
  regeneratedNote.textContent = 'Показан локальный пример с исправленной исходной репликой. Модель не запускалась; это не автоматически составленный протокол.';
  document.querySelector('.minutes-top').after(regeneratedNote);
  function markProtocolStale() {
    staleResults.hidden = false;
    regeneratedNote.hidden = true;
    protocolState.textContent = 'Устарел · требуется проверка';
    protocolState.className = 'pill review';
  }
  const original = { text: textInput.value, speaker: speakerInput.value };
  let current = { ...original };
  const history = [];
  const speakerName = (value) => value === 'a' ? 'Участник А' : 'Участник Б';
  function renderEdit() {
    textInput.value = current.text;
    speakerInput.value = current.speaker;
    document.querySelectorAll('.utterance.is-editing > div > label').forEach((label) => {
      label.textContent = `${speakerName(current.speaker)} · правка текста`;
    });
    undoEdit.disabled = history.length === 0;
    editFeedback.textContent = history.length
      ? 'Локальная правка применена. На сервер она не сохранена.'
      : 'Выберите говорящего или измените текст, затем примените локально.';
    historyList.innerHTML = '';
    [...history].reverse().forEach((entry) => {
      const li = document.createElement('li');
      li.textContent = `${speakerName(entry.speaker)}: ${entry.text}`;
      historyList.append(li);
    });
  }
  applyEdit.addEventListener('click', () => {
    if (!textInput.value.trim()) {
      editFeedback.textContent = 'Текст реплики не может быть пустым.';
      textInput.focus();
      return;
    }
    if (!['a', 'b'].includes(speakerInput.value)) return;
    history.push({ ...current });
    current = { text: textInput.value.trim(), speaker: speakerInput.value };
    renderEdit();
    markProtocolStale();
  });
  undoEdit.addEventListener('click', () => {
    if (!history.length) return;
    current = history.pop();
    renderEdit();
    editFeedback.textContent = 'Последняя локальная правка отменена. Серверное состояние не затронуто.';
    markProtocolStale();
  });
  document.getElementById('show-history').addEventListener('click', () => {
    historyBox.hidden = !historyBox.hidden;
    document.getElementById('show-history').setAttribute('aria-expanded', String(!historyBox.hidden));
    if (!historyBox.hidden) historyBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  document.querySelectorAll('.rename-speaker').forEach((button) => {
    button.textContent = 'Назначить реплике';
    button.addEventListener('click', () => {
      speakerInput.value = button.dataset.speaker;
      editFeedback.textContent = `Для текущей реплики выбран ${speakerName(button.dataset.speaker)}. Нажмите «Применить локально».`;
      markProtocolStale();
      speakerInput.focus();
    });
  });
  const waveform = document.querySelector('.waveform');
  const heights = [17, 36, 54, 26, 68, 44, 82, 31, 50, 75, 28, 62, 38, 89, 47, 24, 70, 43, 58, 33, 78, 21, 49, 65, 35, 84, 29, 57, 40, 72, 25, 63, 46, 80, 32, 53, 69, 22, 59, 37, 87, 43, 26, 74, 51, 33, 66, 19, 56, 39, 79, 28, 61, 46, 83, 35, 54, 24, 71, 41, 62, 30, 88, 48, 20, 67, 36, 58, 77, 27, 46, 63, 32, 81, 43, 25, 57, 72, 38, 52];
  heights.forEach((height) => {
    const bar = document.createElement('i');
    bar.style.setProperty('--height', `${height}%`);
    waveform.append(bar);
  });

  document.getElementById('check-groups').addEventListener('click', () => {
    const warning = document.getElementById('group-warning');
    warning.hidden = !warning.hidden;
    warning.textContent = warning.hidden
      ? 'Группы показаны условно. Макет не анализирует голос и не выявляет смешение.'
      : 'Демонстрационная группа: фрагменты показаны по отдельности. Макет не может определить, смешаны ли голоса.';
  });
  const fragments = [...document.querySelectorAll('.fragment-row')];
  document.querySelector('.fragment-head b').textContent = `Фрагменты (${fragments.length})`;
  fragments.forEach((row) => {
    const checkbox = row.querySelector('input[type="checkbox"]');
    const restore = row.querySelector('button');
    const canToggle = restore.textContent.trim() === 'Вернуть';
    checkbox.addEventListener('change', () => {
      row.classList.toggle('excluded', !checkbox.checked);
      row.querySelector('small').textContent = checkbox.checked ? 'Включён в демо-образец' : 'Исключён из демо-образца';
      if (canToggle) restore.textContent = checkbox.checked ? 'Исключить' : 'Вернуть';
      screenFeedback.textContent = 'Состав фрагментов изменён только в локальной демонстрации. Аудиоданных нет.';
    });
    if (canToggle) restore.addEventListener('click', () => {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
    });
  });
  document.getElementById('confirm-voice').addEventListener('click', () => {
    const choice = document.querySelector('input[name="voice-choice"]:checked');
    screenFeedback.textContent = `Локально отмечено подтверждение: Спикер ${choice.value === 'a' ? '02' : '03'}. Реальная база голосов не изменена.`;
  });

  const voicePeople = {
    a: { name: 'Участник А', seconds: 18, samples: [
      ['Демо-проект · образец 01', '00:18 · 11 секунд · схематично'],
      ['Демо-проект · образец 02', '04:12 · 7 секунд · схематично'],
    ] },
    b: { name: 'Участник Б', seconds: 9, samples: [
      ['Демо-проект · образец 01', '02:04 · 9 секунд · схематично'],
    ] },
  };
  const originalVoicePeople = JSON.stringify(voicePeople);
  const sampleCount = (count) => {
    const mod100 = count % 100;
    const mod10 = count % 10;
    const ending = mod100 >= 11 && mod100 <= 14 ? 'образцов'
      : mod10 === 1 ? 'образец' : mod10 >= 2 && mod10 <= 4 ? 'образца' : 'образцов';
    return `${count} ${ending}`;
  };
  let selectedPerson = 'a';
  let pendingDbAction = null;
  const peopleList = document.querySelector('.people-list');
  const personDetail = document.getElementById('person-detail');
  const dbConfirm = document.getElementById('db-confirm');
  function renderVoiceLibrary() {
    peopleList.querySelectorAll('.person-card').forEach((button) => {
      const person = voicePeople[button.dataset.person];
      button.hidden = !person;
      button.classList.toggle('is-selected', button.dataset.person === selectedPerson);
      if (person) button.querySelector('small').textContent = `${sampleCount(person.samples.length)} · ${person.seconds} с чистой речи`;
    });
    const person = voicePeople[selectedPerson];
    document.querySelectorAll('[data-db-action]').forEach((button) => { button.disabled = !person; });
    document.getElementById('add-voice-sample').disabled = !person;
    dbConfirm.hidden = true;
    pendingDbAction = null;
    if (!person) {
      document.getElementById('person-name').textContent = 'Демо-база пуста';
      document.getElementById('person-sample-total').textContent = '0 образцов';
      document.getElementById('sample-list').replaceChildren();
      document.getElementById('sample-note').textContent = 'Все синтетические карточки удалены. Нажмите «Сбросить демо», чтобы начать заново.';
      return;
    }
    document.getElementById('person-name').textContent = person.name;
    document.getElementById('person-sample-total').textContent = sampleCount(person.samples.length);
    const sampleList = document.getElementById('sample-list');
    sampleList.replaceChildren(...person.samples.map(([title, detail]) => {
      const item = document.createElement('article');
      item.className = 'sample-item';
      item.innerHTML = `<span class="sample-glyph" aria-hidden="true">≋</span><span><b></b><small></small></span><span class="sample-quality">Проверить</span>`;
      item.querySelector('b').textContent = title;
      item.querySelector('small').textContent = detail;
      return item;
    }));
    document.getElementById('sample-note').textContent = 'Карточки схематичны: аудио нет, прослушивание недоступно.';
    dbConfirm.hidden = true;
    pendingDbAction = null;
  }
  peopleList.querySelectorAll('.person-card').forEach((button) => {
    button.addEventListener('click', () => {
      if (!voicePeople[button.dataset.person]) return;
      selectedPerson = button.dataset.person;
      renderVoiceLibrary();
    });
  });
  document.querySelectorAll('[data-db-action]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!voicePeople[selectedPerson]) return;
      pendingDbAction = button.dataset.dbAction;
      const other = Object.keys(voicePeople).find((key) => key !== selectedPerson && voicePeople[key]);
      const copy = pendingDbAction === 'delete'
        ? `Локально убрать карточку «${voicePeople[selectedPerson].name}» из синтетической демо-базы? Реальные данные не затрагиваются.`
        : other
          ? `Локально объединить «${voicePeople[selectedPerson].name}» с «${voicePeople[other].name}» в синтетическом примере? Реальная база не меняется.`
          : 'Нет второй демо-карточки для объединения.';
      document.getElementById('db-confirm-copy').textContent = copy;
      document.getElementById('db-confirm-yes').disabled = !other && pendingDbAction === 'merge';
      dbConfirm.hidden = false;
    });
  });
  document.getElementById('db-confirm-no').addEventListener('click', () => { dbConfirm.hidden = true; pendingDbAction = null; });
  document.getElementById('db-confirm-yes').addEventListener('click', () => {
    if (!pendingDbAction || !voicePeople[selectedPerson]) return;
    const other = Object.keys(voicePeople).find((key) => key !== selectedPerson && voicePeople[key]);
    if (pendingDbAction === 'merge' && other) {
      voicePeople[other].samples.push(...voicePeople[selectedPerson].samples);
      voicePeople[other].seconds += voicePeople[selectedPerson].seconds;
      delete voicePeople[selectedPerson];
      selectedPerson = other;
      screenFeedback.textContent = 'Карточки объединены только в синтетическом состоянии страницы.';
    } else if (pendingDbAction === 'delete') {
      delete voicePeople[selectedPerson];
      selectedPerson = Object.keys(voicePeople)[0] || '';
      screenFeedback.textContent = 'Карточка скрыта только в локальном демо-состоянии страницы.';
    }
    renderVoiceLibrary();
  });
  document.getElementById('add-voice-sample').addEventListener('click', () => {
    const person = voicePeople[selectedPerson];
    if (!person) {
      screenFeedback.textContent = 'Выберите карточку человека, чтобы показать локальное добавление демо-образца.';
      return;
    }
    person.samples.push(['Демо-проект · новый образец', 'синтетический · без аудио']);
    person.seconds += 5;
    renderVoiceLibrary();
    screenFeedback.textContent = 'Демо-образец добавлен только в локальную визуализацию; аудио и backend не используются.';
  });
  const resetVoices = document.createElement('button');
  resetVoices.type = 'button';
  resetVoices.id = 'reset-voice-demo';
  resetVoices.className = 'text-button';
  resetVoices.textContent = 'Сбросить демо';
  document.querySelector('.library-heading').append(resetVoices);
  resetVoices.addEventListener('click', () => {
    Object.keys(voicePeople).forEach((key) => { delete voicePeople[key]; });
    Object.assign(voicePeople, JSON.parse(originalVoicePeople));
    selectedPerson = 'a';
    renderVoiceLibrary();
    screenFeedback.textContent = 'Синтетическая база возвращена в исходное состояние. Реальные данные не затрагивались.';
  });

  document.getElementById('regenerate-example').addEventListener('click', () => {
    staleResults.hidden = true;
    protocolState.textContent = 'Синтетический пример';
    protocolState.className = 'pill neutral';
    document.querySelector('.minutes-top h3').textContent = 'Пример после локальной правки';
    document.querySelector('#assignment h4').textContent = current.text;
    document.querySelector('#assignment > div:last-child > p').textContent = `Говорящий: ${speakerName(current.speaker)}. Формулировку поручения нужно проверить вручную.`;
    const quote = document.querySelector('#assignment blockquote');
    const source = document.createElement('span');
    source.textContent = `ИСТОЧНИК · 00:18 · ${speakerName(current.speaker).toLocaleUpperCase('ru')}`;
    quote.replaceChildren(source, document.createTextNode(`«${current.text}»`));
    regeneratedNote.hidden = false;
    document.getElementById('minutes-status').textContent = 'Макет пересобрал демонстрационный пример локально; модель не запускалась.';
    reviewChecks.forEach((input) => { input.checked = false; });
    updateReviews();
  });

  document.querySelectorAll('.entity-item').forEach((entity) => {
    const token = document.querySelector(`[data-token="${entity.dataset.entity}"]`);
    token.textContent = entity.dataset.entity === 'person' ? '{PERSON_A1B2C3}' : '{ORG_D4E5F6}';
    entity.querySelectorAll('[data-choice]').forEach((button) => {
      button.addEventListener('click', () => {
        entity.querySelectorAll('[data-choice]').forEach((choice) => choice.classList.toggle('active', choice === button));
        const mark = document.querySelector(`[data-token="${entity.dataset.entity}"]`);
        const accepted = button.dataset.choice === 'accept';
        mark.dataset.excluded = String(!accepted);
        mark.textContent = accepted
          ? (entity.dataset.entity === 'person' ? '{PERSON_A1B2C3}' : '{ORG_D4E5F6}')
          : (entity.dataset.entity === 'person' ? 'Участник А' : 'Демо-компании');
        const acceptedCount = [...document.querySelectorAll('.entity-item .active[data-choice="accept"]')].length;
        document.getElementById('entity-count').textContent = `${acceptedCount} ${acceptedCount === 1 ? 'замена' : 'предложения'}`;
        document.getElementById('privacy-feedback').textContent = 'Локальный предпросмотр обновлён. Ничего не отправляется.';
      });
    });
  });
  document.getElementById('privacy-check').addEventListener('click', () => {
    document.getElementById('privacy-feedback').textContent = 'Предпросмотр отмечен как проверенный в этой вкладке. Это не подтверждает полноту обнаружения.';
  });

  const reviewChecks = [...document.querySelectorAll('[data-review]')];
  const minutesStatus = document.getElementById('minutes-status');
  function updateReviews() {
    const count = reviewChecks.filter((input) => input.checked).length;
    minutesStatus.textContent = `Проверено: ${count} из ${reviewChecks.length}`;
    document.getElementById('mark-minutes').textContent = count === reviewChecks.length ? 'Сверка отмечена' : 'Отметить просмотренным';
  }
  reviewChecks.forEach((input) => input.addEventListener('change', updateReviews));
  document.getElementById('mark-minutes').addEventListener('click', () => {
    reviewChecks.forEach((input) => { input.checked = true; });
    updateReviews();
    minutesStatus.textContent = 'Сверка отмечена локально. Содержание протокола не подтверждено продуктом.';
  });

  const baseText = 'На следующем этапе {PERSON_A1B2C3} отправит расчёт для {ORG_D4E5F6} до пятницы.';
  document.getElementById('refresh-restore').addEventListener('click', () => {
    let text = baseText;
    document.querySelectorAll('.restore-toggle').forEach((toggle) => {
      if (!toggle.checked) return;
      const token = toggle.closest('tr').querySelector('code').textContent;
      const value = toggle.closest('tr').querySelector('td').textContent;
      text = text.replace(token, value);
    });
    document.getElementById('restore-preview').textContent = text;
    document.getElementById('restore-feedback').textContent = 'Демо-предпросмотр пересчитан локально. Никакие данные не восстановлены или сохранены на сервере.';
  });
})();

/**
 * Модуль модальных окон для диаграмм Mermaid.js
 * Позволяет увеличивать диаграммы в модальном окне с возможностью масштабирования
 */

/**
 * Инициализирует систему модальных окон для диаграмм
 */
export function initializeDiagramModals() {
  const modal = document.getElementById('diagram-modal');
  const modalContent = document.getElementById('modal-content');
  const modalTitle = document.getElementById('modal-title');
  const closeBtn = document.getElementById('modal-close');
  const zoomInBtn = document.getElementById('modal-zoom-in');
  const zoomOutBtn = document.getElementById('modal-zoom-out');
  
  let currentScale = 1;
  
  // Открытие модального окна
  window.openDiagramModal = (title, content) => {
    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    currentScale = 1;
    updateZoom();
  };
  
  // Закрытие модального окна
  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  });
  
  // Клик по оверлею
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
      document.body.classList.remove('modal-open');
    }
  });
  
  // Увеличение
  zoomInBtn.addEventListener('click', () => {
    currentScale = Math.min(currentScale + 0.2, 3);
    updateZoom();
  });
  
  // Уменьшение
  zoomOutBtn.addEventListener('click', () => {
    currentScale = Math.max(currentScale - 0.2, 0.5);
    updateZoom();
  });
  
  // Колесико мыши
  modalContent.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      currentScale += e.deltaY * -0.01;
      currentScale = Math.min(Math.max(0.5, currentScale), 3);
      updateZoom();
    }
  });
  
  function updateZoom() {
    modalContent.style.transform = `scale(${currentScale})`;
    modalContent.classList.add('diagram-zoom');
  }
  
  // Добавляем обработчики кликов на все диаграммы
  document.addEventListener('click', (e) => {
    const diagram = e.target.closest('.mermaid');
    if (diagram) {
      e.preventDefault();
      const title = diagram.closest('.bg-slate-50')?.querySelector('h3, h4')?.textContent || 'Диаграмма';
      openDiagramModal(title, diagram.outerHTML);
    }
  });
}
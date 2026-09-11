/* Справочник по MongoDB — мелкая механика страницы.
   1. Кадр Compass открывается во весь экран по клику.
   2. Конвейеры агрегации подсвечивают стадию при наведении. */
(() => {
  /* ---- Увеличение кадра ---------------------------------------- */
  const shots = [...document.querySelectorAll('.shot img')];
  if (shots.length) {
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure>'
      + '<p class="lightbox__hint">клик или Esc — закрыть</p>';
    document.body.appendChild(box);

    const image = box.querySelector('img');
    const caption = box.querySelector('figcaption');

    const open = source => {
      image.src = source.currentSrc || source.src;
      image.alt = source.alt || '';
      const own = source.closest('figure')?.querySelector('figcaption');
      caption.textContent = own ? own.textContent.trim() : image.alt;
      caption.hidden = !caption.textContent;
      box.classList.add('is-open');
      box.setAttribute('aria-hidden', 'false');
    };

    const close = () => {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      image.removeAttribute('src');
    };

    shots.forEach(source => {
      source.tabIndex = 0;
      source.addEventListener('click', () => open(source));
      source.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        open(source);
      });
    });

    box.addEventListener('click', close);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && box.classList.contains('is-open')) close();
    });
  }

  /* ---- Переключатель языка драйвера ---------------------------- */
  /* Выбор общий для всей книги: сохраняется и подхватывается на любой
     странице. Блоки кода помечены data-lang, видимостью управляет CSS. */
  const LANGS = [
    ['python', 'Python'],
    ['cpp', 'C++'],
    ['go', 'Go'],
    ['ruby', 'Ruby'],
  ];
  const STORAGE_KEY = 'mongodb-book-lang';

  if (document.querySelector('[data-lang]')) {
    const read = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return LANGS.some(([id]) => id === saved) ? saved : 'python';
      } catch (_) {
        return 'python';
      }
    };

    const bar = document.createElement('div');
    bar.className = 'langbar';
    bar.innerHTML = '<span class="langbar__label">драйвер</span>';

    const buttons = LANGS.map(([id, title]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = title;
      button.dataset.setLang = id;
      bar.appendChild(button);
      return button;
    });

    const apply = lang => {
      document.documentElement.dataset.lang = lang;
      buttons.forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.setLang === lang));
      });
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) { /* приватный режим */ }
    };

    buttons.forEach(button => button.addEventListener('click', () => apply(button.dataset.setLang)));

    const running = document.querySelector('.running');
    if (running) running.insertBefore(bar, running.querySelector('.running__folio'));
    apply(read());

    // Выбор, сделанный в другой вкладке, подхватывается без перезагрузки.
    window.addEventListener('storage', event => {
      if (event.key === STORAGE_KEY && event.newValue) apply(read());
    });
  }

  /* ---- Подсветка стадии конвейера ------------------------------ */
  document.querySelectorAll('.pipeline').forEach(pipeline => {
    const stages = [...pipeline.querySelectorAll('.pipeline__stage')];
    stages.forEach(stage => {
      stage.addEventListener('mouseenter', () => {
        stages.forEach(other => other.classList.toggle('is-lit', other === stage));
      });
    });
    pipeline.addEventListener('mouseleave', () => {
      stages.forEach(stage => stage.classList.remove('is-lit'));
    });
  });
})();

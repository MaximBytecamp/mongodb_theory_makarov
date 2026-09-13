/* Справочник по MongoDB — мелкая механика страницы.
   1. Кадр Compass открывается во весь экран по клику.
   2. Переключатели языка драйвера и операционной системы.
   3. Конвейеры агрегации подсвечивают стадию при наведении. */
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

  /* ---- Переключатели драйвера и операционной системы ---------- */
  /* Выбор общий для всей книги: сохраняется и подхватывается на любой
     странице. Блоки помечены data-lang или data-os, видимостью управляет CSS. */
  const detectOs = () => {
    const platform = (navigator.userAgentData && navigator.userAgentData.platform)
      || navigator.platform || '';
    if (/win/i.test(platform)) return 'win';
    if (/mac|iphone|ipad/i.test(platform)) return 'mac';
    return 'linux';
  };

  const running = document.querySelector('.running');

  const switcher = ({ attr, selector, key, label, items, fallback }) => {
    if (!document.querySelector(selector)) return;

    const read = () => {
      try {
        const saved = localStorage.getItem(key);
        return items.some(([id]) => id === saved) ? saved : fallback();
      } catch (_) {
        return fallback();
      }
    };

    const bar = document.createElement('div');
    bar.className = 'langbar';
    bar.innerHTML = `<span class="langbar__label">${label}</span>`;

    const buttons = items.map(([id, title]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = title;
      button.dataset.value = id;
      bar.appendChild(button);
      return button;
    });

    const apply = (value, save) => {
      document.documentElement.setAttribute(`data-${attr}`, value);
      buttons.forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.value === value));
      });
      if (save) {
        try { localStorage.setItem(key, value); } catch (_) { /* приватный режим */ }
      }
    };

    buttons.forEach(button => button.addEventListener('click', () => apply(button.dataset.value, true)));

    if (running) running.insertBefore(bar, running.querySelector('.running__folio'));
    apply(read(), false);

    // Выбор, сделанный в другой вкладке, подхватывается без перезагрузки.
    window.addEventListener('storage', event => {
      if (event.key === key && event.newValue) apply(read(), false);
    });
  };

  switcher({
    attr: 'lang', selector: '[data-lang]', key: 'mongodb-book-lang', label: 'драйвер',
    items: [['python', 'Python'], ['cpp', 'C++'], ['go', 'Go'], ['ruby', 'Ruby']],
    fallback: () => 'python',
  });

  // Система определяется сама, пока читатель не выбрал её кнопкой.
  switcher({
    attr: 'os', selector: '.book [data-os]', key: 'mongodb-book-os', label: 'система',
    items: [['win', 'Windows'], ['mac', 'macOS'], ['linux', 'Linux']],
    fallback: detectOs,
  });

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

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

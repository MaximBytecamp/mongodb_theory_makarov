"""Вставка кадров Compass в разделы глав: кадр и абзац с его разбором
ставятся сразу после абзаца, который начинается с заданного текста.

    from place_shots import after, fig
"""
import io
import re


def fig(name: str, alt: str, caption: str) -> str:
    return (f'        <figure class="shot">\n'
            f'          <img src="../../shots/{name}.png" alt="{alt}">\n'
            f'          <figcaption>{caption}</figcaption>\n'
            f'        </figure>\n')


def after(page: str, anchor: str, block: str) -> str:
    """Вставить block после абзаца <p>, текст которого начинается с anchor."""
    at = page.find("<p>" + anchor)
    if at < 0:
        raise ValueError("нет абзаца: " + anchor[:60])
    end = page.index("</p>", at) + len("</p>\n")
    return page[:end] + block + page[end:]


def cut_figure(page: str, name: str) -> tuple[str, str]:
    """Вырезать figure.shot с кадром name вместе со следующим абзацем разбора."""
    m = re.search(r'        <figure class="shot">\n          <img src="\.\./\.\./shots/%s\.png".*?</figure>\n(        <p>.*?</p>\n)?' % re.escape(name), page, re.S)
    if not m:
        raise ValueError("нет кадра " + name)
    return page[:m.start()] + page[m.end():], m.group(0)

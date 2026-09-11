"""Помощник для многоязычных блоков кода.

Каждый блок с кодом драйвера существует в четырёх вариантах: Python, C++, Go,
Ruby. Видимостью управляет CSS по атрибуту data-lang на <html>, переключатель
живёт в шапке главы.

Здесь собраны подписи языков и сборка HTML-группы, чтобы разметка во всех
главах была одинаковой.
"""

CAPTIONS = {
    "python": "Python · PyMongo",
    "cpp": "C++ · mongocxx",
    "go": "Go · mongo-driver",
    "ruby": "Ruby · mongo",
}

ORDER = ["python", "cpp", "go", "ruby"]


def figure(lang, subtitle, code, indent=10):
    """Один блок кода для конкретного языка."""
    pad = " " * indent
    return (
        f'{pad}<figure class="code" data-lang="{lang}">\n'
        f'{pad}  <figcaption><span>{CAPTIONS[lang]}</span><span>{subtitle}</span></figcaption>\n'
        f'<pre>{code}</pre>\n'
        f'{pad}</figure>'
    )


def group(subtitle, variants, indent=10):
    """Четыре варианта одного примера подряд: их переключает кнопка в шапке."""
    missing = [lang for lang in ORDER if lang not in variants]
    if missing:
        raise ValueError(f"нет вариантов для языков: {', '.join(missing)}")
    return "\n".join(figure(lang, subtitle, variants[lang], indent) for lang in ORDER)

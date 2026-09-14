"""Проверка примеров справочника на этой машине.

Копируется в mongodb-practice/_verify/run.py командой `examples.py export`.
Делает то же, что студент: перед каждой главой сбрасывает базы, запускает
программы главы по порядку и сверяет вывод с тем, что напечатано в книге.

    python _verify/run.py python,ruby,go "powershell -ExecutionPolicy Bypass -File stend\\load.ps1"
    python3 _verify/run.py python,ruby,go,cpp "bash stend/load.sh"
    python3 _verify/run.py cpp "docker compose run --rm reset" --docker
"""

import json
import os
import pathlib
import platform
import re
import shlex
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
EXPECTED = json.loads((ROOT / "_verify" / "expected.json").read_text(encoding="utf-8"))
EXT = {"python": "py", "cpp": "cpp", "go": "go", "ruby": "rb"}
SERVICE = {"python": "python", "cpp": "cpp", "go": "go", "ruby": "ruby"}

VOLATILE = [
    (re.compile(r"\b[0-9a-f]{24}\b"), "<id>"),
    (re.compile(r"\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:\+00:00| \+0000 UTC| UTC|Z)?"), "<время>"),
    (re.compile(r"\b\d{4}-\d{2}-\d{2}\b"), "<дата>"),
    (re.compile(r"\b1[78]\d{8}\b"), "<время>"),
]


NAMES = {"customers", "orders", "products"}


def steady(text: str) -> list[str]:
    lines = [re.sub(r"\s+", " ", l).strip() for l in text.strip().splitlines() if l.strip()]
    out = []
    for line in lines:
        # сервер не обещает порядок в списке коллекций — сравниваем как множество
        words = re.findall(r"[A-Za-z_]+", line)
        # порядок полей в документе, созданном upsert, тоже не гарантирован
        if NAMES <= set(words) or {"product_id", "views"} <= set(words):
            line = re.sub(r"[\[\]'\",]", " ", line)
            line = " ".join(sorted(line.split()))
        # Ruby 3.4 печатает хэш с пробелами вокруг =>, Ruby 3.3 — без них
        line = re.sub(r"\s*=>\s*", "=>", line)
        for pattern, mark in VOLATILE:
            line = pattern.sub(mark, line)
        out.append(line)
    return out


def shown(lang: str, stdout: str, stderr: str, code: int) -> str:
    """Тот же разбор, что в tools/examples.py: что увидит студент."""
    text = stdout.rstrip("\n")
    if not code:
        return text
    err = [l for l in stderr.splitlines() if l.strip()]
    message = ""
    if lang == "python" and err:
        message = re.sub(r"^[\w.]*\.(\w+(?:Error|Exception|Failure))", r"\1", err[-1]).split(", full error:")[0]
    elif lang == "ruby" and err:
        message = re.sub(r"^.*?:in [`'][^']*': ", "", err[0])
    elif lang == "go" and err:
        message = "\n".join(re.sub(r"^\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2} ", "", l)
                            for l in err if not l.startswith(("exit status", "go: ")))
    elif lang == "cpp" and err:
        # libc++ (macOS) сообщает то же одной строкой — приводим к виду libstdc++
        mac = next((l for l in err if l.startswith("libc++abi: terminating due to uncaught exception of type ")), None)
        if mac:
            kind, _, what = mac.split("of type ", 1)[1].partition(": ")
            message = f"terminate called after throwing an instance of '{kind}'\nwhat(): {what}"
        else:
            message = "\n".join(l.strip() for l in err if l.startswith(("terminate called", "  what()")))
    return (text + "\n" + message).strip("\n")


def cpp_flags() -> list[str]:
    out = subprocess.run(["pkg-config", "--list-all"], capture_output=True, text=True).stdout
    name = next(l.split()[0] for l in out.splitlines() if l.startswith("libmongocxx"))
    flags = subprocess.run(["pkg-config", "--cflags", "--libs", name], capture_output=True, text=True).stdout
    return shlex.split(flags)


def run_program(lang: str, folder: pathlib.Path, name: str, docker: bool):
    env = dict(os.environ, PYTHONUTF8="1", PYTHONIOENCODING="utf-8")
    if docker:
        rel = f"{folder.name}/{name}"
        cmd = ["docker", "compose", "run", "--rm", "-T", SERVICE[lang], rel]
        cwd = ROOT
    elif lang == "python":
        cmd, cwd = [sys.executable, name], folder
    elif lang == "ruby":
        cmd, cwd = ["ruby", name], folder
    elif lang == "go":
        cmd, cwd = ["go", "run", name], folder
    else:
        exe = folder / (pathlib.Path(name).stem + (".exe" if platform.system() == "Windows" else ""))
        build = subprocess.run(["g++", "-std=c++17", name, "-o", str(exe)] + cpp_flags(),
                               cwd=folder, capture_output=True, text=True)
        if build.returncode:
            return 1, "", build.stderr
        cmd, cwd = [str(exe)], folder
    proc = subprocess.run(cmd, cwd=cwd, capture_output=True, env=env, timeout=900)
    decode = lambda b: b.decode("utf-8", errors="replace")
    stderr = "\n".join(l for l in decode(proc.stderr).splitlines()
                       if not l.startswith((" Container ", " Volume ", " Network ", "go: downloading", "go: finding")))
    return proc.returncode, decode(proc.stdout).replace("\r\n", "\n"), stderr.replace("\r\n", "\n")


def main() -> int:
    langs = sys.argv[1].split(",")
    reset = sys.argv[2]
    docker = "--docker" in sys.argv
    lines, failed, passed = [], 0, 0
    for chapter, by_lang in EXPECTED.items():
        for lang in langs:
            subprocess.run(reset, shell=True, cwd=ROOT, capture_output=True)
            folder = ROOT / f"_v_{chapter.replace('.', '_')}_{lang}"
            for n, want in sorted(by_lang[lang].items(), key=lambda kv: int(kv[0])):
                name = f"{int(n):02d}.{EXT[lang]}"
                code, out, err = run_program(lang, folder, name, docker)
                got = shown(lang, out, err, code)
                same = steady(got) == steady(want["shown"]) and bool(code) == bool(want["exit"])
                if same:
                    passed += 1
                else:
                    failed += 1
                    lines.append(f"✗ {chapter} {lang} №{n}")
                    lines.append("   книга: " + " ⏎ ".join(steady(want["shown"]))[:600])
                    lines.append("   здесь: " + " ⏎ ".join(steady(got))[:600])
                    if code and not want["exit"]:
                        lines.append("   stderr: " + err.strip()[-600:])
            print(f"{chapter} {lang}: готово", flush=True)
    system = f"{platform.system()} {platform.release()} {platform.machine()}"
    summary = f"{system} · языки {','.join(langs)}{' · docker' if docker else ''}: совпало {passed}, расходится {failed}"
    report = summary + "\n" + "\n".join(lines)
    print(report)
    out = ROOT / "_verify" / f"report-{platform.system().lower()}-{'-'.join(langs)}{'-docker' if docker else ''}.txt"
    out.write_text(report, encoding="utf-8")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

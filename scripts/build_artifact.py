#!/usr/bin/env python3
"""Gera a versão de ficheiro único (artifact/fleet-pro-artifact.html) a partir do projeto.

Esse ficheiro único é o que se publica como Artifact no Claude, onde a leitura de
matrículas por IA e os downloads funcionam. Usa as bibliotecas por CDN (como no original).
Uso:  python3 scripts/build_artifact.py
"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
rd = lambda p: (root / p).read_text(encoding="utf-8")

index = rd("index.html")
m = re.search(r'<body>\n(.*?)\n<script src="vendor/xlsx', index, re.S)
body = m.group(1)
title = re.search(r'<title>.*?</title>', index).group(0)
meta = re.search(r'<meta name="claude:viewport-fit-sides"[^>]*>', index).group(0)

css = rd("css/styles.css").rstrip("\n")
js1 = rd("js/app.js").rstrip("\n").replace("vendor/pdf.worker.js", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js")
js2 = rd("js/menu.js").rstrip("\n")

out = (
    title + "\n" + meta + "\n"
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">\n'
    "<style>\n" + css + "\n</style>\n" + body + "\n"
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>\n'
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>\n'
    "<script>\n" + js1 + "\n</script>\n<script>\n" + js2 + "\n</script>\n"
)
dest = root / "artifact" / "fleet-pro-artifact.html"
dest.write_text(out, encoding="utf-8")
print("Criado", dest.relative_to(root), len(out), "bytes")

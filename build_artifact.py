"""claude.ai 팀 공유 페이지(Artifact)용 묶음 만들기.

claude.ai 페이지는 바깥 사이트를 못 읽어서, 리포트 data.json 과 세계지도를 사본으로 같이 올린다.
실행: python3 build_artifact.py  → _artifact/ 폴더가 생김 (GitHub 에는 안 올림)
"""
import json, re, shutil, urllib.request
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / "_artifact"
REPORTS = {
    "taiwan": "https://hyunwook-in.github.io/mangocar-taiwan/data.json",
    "germany": "https://hyunwook-in.github.io/mangocar-germany/data.json",
    "kyrgyzstan": "https://hyunwook-in.github.io/mangocar-kyrgyzstan/data.json",
}
WORLD = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"


def fetch_json(url):
    with urllib.request.urlopen(url, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "data").mkdir(parents=True)

    html = (HERE / "index.html").read_text(encoding="utf-8")
    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
    head = re.sub(r'<meta charset="utf-8">\s*|<meta name="viewport"[^>]*>\s*', "", head)
    (OUT / "index.html").write_text(head.strip() + "\n" + body.strip() + "\n", encoding="utf-8")

    for f in ("ko.js", "registry.js"):
        shutil.copy(HERE / f, OUT / f)
    (OUT / "reports").mkdir()
    (HERE / "reports").mkdir(exist_ok=True)
    for cid, url in REPORTS.items():
        page = url.rsplit("/", 1)[0] + "/"
        with urllib.request.urlopen(page, timeout=60) as r:
            html = r.read().decode("utf-8")
        for folder in (OUT / "reports", HERE / "reports"):
            (folder / f"{cid}.html").write_text(html, encoding="utf-8")
        d = fetch_json(url)
        (OUT / "data" / f"{cid}.json").write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(cid, d.get("date"), len(d.get("cars", [])))
    (OUT / "world-110m.json").write_text(json.dumps(fetch_json(WORLD), separators=(",", ":")), encoding="utf-8")
    print("done →", OUT)


if __name__ == "__main__":
    main()

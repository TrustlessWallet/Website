"""Generate the static website. Run with Python 3.9+ from any directory."""
import argparse
import hashlib
import json
import posixpath
from functools import lru_cache
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parent.parent
PAGES = ROOT / "_src" / "pages"
LANGUAGES = {"en": ("🇬🇧", "English"), "it": ("🇮🇹", "Italiano"), "es": ("🇪🇸", "Español")}
SWITCH_LABEL = {"en": "Language", "it": "Lingua", "es": "Idioma"}

def route(lang, page):
    return page if lang == "en" else lang + "/" + page

@lru_cache(maxsize=None)
def asset_version(target):
    return hashlib.sha256((ROOT / target).read_bytes()).hexdigest()[:12]


class Renderer(HTMLParser):
    def __init__(self, page, lang, dictionary, keys):
        super().__init__()
        self.page, self.lang, self.dictionary, self.keys = page, lang, dictionary, keys
        self.parts = []
        self.after_download = False

    def translate(self, value):
        phrase = value.strip()
        if not phrase:
            return value
        self.keys.setdefault(phrase, phrase)
        translated = self.dictionary[phrase] if self.dictionary is not None else phrase
        return value.replace(phrase, translated, 1)

    def relative(self, target):
        return posixpath.relpath(target, posixpath.dirname(route(self.lang, self.page)) or ".")

    def link(self, value):
        url = urlsplit(value)
        if url.scheme or url.netloc or not url.path:
            return value
        target = posixpath.normpath(posixpath.join(posixpath.dirname(self.page), url.path))
        if (PAGES / target).is_file():
            target = route(self.lang, target)
        query = url.query
        if target.endswith((".css", ".js")):
            version = "v=" + asset_version(target)
            query = f"{query}&{version}" if query else version
        return urlunsplit(("", "", self.relative(target), query, url.fragment))

    def picker(self):
        flag, name = LANGUAGES[self.lang]
        links = []
        for code, (symbol, label) in LANGUAGES.items():
            current = ' aria-current="true"' if code == self.lang else ""
            links.append(f'<a lang="{code}" hreflang="{code}" href="{self.relative(route(code, self.page))}"{current}><span aria-hidden="true">{symbol}</span> {label}</a>')
        return f'<details class="locale-picker"><summary aria-label="{SWITCH_LABEL[self.lang]} · {name}"><span aria-hidden="true">{flag}</span> {self.lang.upper()}</summary><div>{"".join(links)}</div></details>'

    def handle_starttag(self, tag, attrs):
        meta = dict(attrs)
        if tag == "a" and meta.get("class") == "header-download":
            self.after_download = True
        items = []
        for key, value in attrs:
            if value is None:
                items.append(key)
                continue
            if key in ("src", "href"):
                value = self.link(value)
            elif tag == "html" and key == "lang":
                value = self.lang
            elif key in ("alt", "aria-label") or (tag=="meta" and key=="content" and (meta.get("name")=="description" or meta.get("property") in ("og:title","og:description"))):
                value = self.translate(value)
            items.append(f'{key}="{escape(value, quote=True)}"')
        self.parts.append("<" + " ".join([tag]+items) + ">")

    def handle_endtag(self, tag):
        if tag=="head":
            for lang in LANGUAGES:
                self.parts.append(f'<link rel="alternate" hreflang="{lang}" href="{self.relative(route(lang, self.page))}">')
        self.parts.append("</"+tag+">")
        if tag == "a" and self.after_download:
            self.parts.append(self.picker())
            self.after_download = False

    def handle_data(self, data):
        self.parts.append(escape(self.translate(data), quote=False))

    def handle_decl(self, decl):
        self.parts.append("<!"+decl+">")

def render(page, lang, dictionary, keys):
    renderer = Renderer(page, lang, dictionary, keys)
    renderer.feed((PAGES/page).read_text(encoding="utf-8"))
    renderer.close()
    return "".join(renderer.parts)

def main():
    args = argparse.ArgumentParser()
    args.add_argument("--extract", action="store_true", help="refresh the English translation key inventory")
    opts = args.parse_args()
    pages = sorted(p.relative_to(PAGES).as_posix() for p in PAGES.rglob("*.html"))
    keys = {}
    english = {page: render(page,"en",None,keys) for page in pages}
    if opts.extract:
        (ROOT/"i18n/en.json").write_text(json.dumps(keys,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        return
    outputs = dict(english)
    for lang in LANGUAGES:
        if lang == "en":
            continue
        data = json.loads((ROOT/f"i18n/{lang}.json").read_text(encoding="utf-8"))
        missing = [key for key in keys if not data.get(key, "").strip()]
        if missing:
            raise SystemExit(f"Missing {lang} translations: {missing}")
        outputs.update({route(lang,p): render(p,lang,data,keys) for p in pages})
    for path, content in outputs.items():
        target = ROOT/path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content,encoding="utf-8")

if __name__ == "__main__":
    main()

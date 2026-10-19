#!/usr/bin/env python3
"""Build the WXT skill reference files from WXT's LLM knowledge dumps.

Usage:
  python3 build-references.py <docs.txt> <api-reference.txt> <references-dir>
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

SECTION_RE = re.compile(
    r"(?ms)^---\nurl: (?P<url>[^\n]+)\ntitle: (?P<title>[^\n]*)\n---\n(?P<body>.*?)(?=^---\nurl: |\Z)"
)


def parse_pages(path: Path) -> dict[str, tuple[str, str]]:
    text = path.read_text(encoding="utf-8")
    pages: dict[str, tuple[str, str]] = {}
    for match in SECTION_RE.finditer(text):
        url = match.group("url").strip().removesuffix(".html")
        title = match.group("title").strip() or url
        body = match.group("body").strip()
        pages[url] = (title, body)
    return pages


def write_group(
    out_dir: Path,
    name: str,
    pages: dict[str, tuple[str, str]],
    urls: list[str],
    source_base: str,
    heading: str,
) -> None:
    chunks: list[str] = [f"# {heading}\n"]
    missing: list[str] = []
    for url in urls:
        page = pages.get(url)
        if page is None:
            missing.append(url)
            continue
        title, body = page
        chunks.append(f"## {title}\n\nSource: {source_base}{url}\n\n{body}\n")
    if missing:
        chunks.append("## Missing upstream pages\n\n" + "\n".join(f"- {u}" for u in missing) + "\n")
    (out_dir / name).write_text("\n".join(chunks), encoding="utf-8")
    print(f"wrote {name}: {len(urls) - len(missing)} pages")


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("usage: build-references.py <docs.txt> <api-reference.txt> <references-dir>")

    docs_path, api_path, out_path = map(Path, sys.argv[1:])
    out_dir = out_path
    out_dir.mkdir(parents=True, exist_ok=True)

    docs = parse_pages(docs_path)
    api = parse_pages(api_path)

    essentials = [
        "/guide/essentials/project-structure",
        "/guide/essentials/entrypoints",
        "/guide/essentials/extension-apis",
        "/guide/essentials/assets",
        "/guide/essentials/target-different-browsers",
        "/guide/essentials/frontend-frameworks",
        "/guide/essentials/content-scripts",
        "/guide/essentials/storage",
        "/guide/essentials/messaging",
        "/guide/essentials/i18n",
        "/guide/essentials/scripting",
    ]
    config = [
        "/guide/essentials/config/manifest",
        "/guide/essentials/config/vite",
        "/guide/essentials/config/auto-imports",
        "/guide/essentials/config/environment-variables",
        "/guide/essentials/config/runtime",
        "/guide/essentials/config/build-mode",
        "/guide/essentials/config/typescript",
        "/guide/essentials/config/hooks",
        "/guide/essentials/config/entrypoint-loaders",
        "/guide/essentials/config/browser-startup",
    ]
    testing = [
        "/guide/essentials/unit-testing",
        "/guide/essentials/e2e-testing",
        "/guide/essentials/publishing",
        "/guide/essentials/testing-updates",
        "/guide/resources/faq",
    ]
    api_pages = [
        "/api/reference/wxt/utils/define-content-script/functions/defineContentScript",
        "/api/reference/wxt/utils/define-background/functions/defineBackground",
        "/api/reference/wxt/utils/define-unlisted-script/functions/defineUnlistedScript",
        "/api/reference/wxt/utils/content-script-context/classes/ContentScriptContext",
        "/api/reference/wxt/utils/content-script-ui/shadow-root/functions/createShadowRootUi",
        "/api/reference/wxt/utils/content-script-ui/integrated/functions/createIntegratedUi",
        "/api/reference/wxt/utils/content-script-ui/iframe/functions/createIframeUi",
        "/api/reference/wxt/utils/storage/variables/storage",
        "/api/reference/wxt/utils/storage/interfaces/WxtStorage",
        "/api/reference/wxt/utils/storage/interfaces/WxtStorageItem",
        "/api/reference/wxt/utils/match-patterns/classes/MatchPattern",
    ]

    write_group(out_dir, "essentials.md", docs, essentials, "https://wxt.dev", "WXT Essentials")
    write_group(out_dir, "config.md", docs, config, "https://wxt.dev", "WXT Configuration")
    write_group(out_dir, "testing-publishing.md", docs, testing, "https://wxt.dev", "WXT Testing & Publishing")
    write_group(out_dir, "api.md", api, api_pages, "https://wxt.dev", "WXT API Reference (selected)")


if __name__ == "__main__":
    main()

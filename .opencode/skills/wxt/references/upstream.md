# Upstream sources

The WXT skill references are generated from WXT's official LLM knowledge files:

- Index: <https://wxt.dev/llms.txt>
- Full guide: <https://wxt.dev/knowledge/docs.txt>
- API reference: <https://wxt.dev/knowledge/api-reference.txt>

Refresh with:

```bash
bash .opencode/skills/wxt/scripts/sync-docs.sh
```

The generator is `.opencode/skills/wxt/scripts/build-references.py`. It selects the pages most relevant to this extension and writes:

- `essentials.md`
- `config.md`
- `testing-publishing.md`
- `api.md`

When WXT changes a page path, update the URL lists in the generator. The script reports missing pages instead of silently dropping them.

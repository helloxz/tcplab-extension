<p align="center">
  <a href="./README.md"><strong>English</strong></a>
  &nbsp;·&nbsp;
  <a href="./README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: AGPL-3.0" src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg"></a>
  <a href="wxt.config.ts"><img alt="Manifest V3" src="https://img.shields.io/badge/manifest-v3-4285F4.svg"></a>
  <a href="https://wxt.dev"><img alt="Built with WXT" src="https://img.shields.io/badge/built%20with-WXT-0F172A.svg"></a>
  <a href="https://vuejs.org"><img alt="Vue 3" src="https://img.shields.io/badge/Vue-3-42B883.svg"></a>
</p>

# TCPLab

TCPLab is a Manifest V3 browser extension for Chrome and Firefox. Click the toolbar icon and it injects a **460 px** fixed overlay on the right side of the current tab, showing the page's DNS, WHOIS and TLS information without leaving the page.

No side panel, no persistent content script, and no change to the host page's layout.

[Website](https://tcp.lc) · [GitHub](https://github.com/helloxz/tcplab-extension) · [Issues](https://github.com/helloxz/tcplab-extension/issues)

## Overview

TCPLab is a quick network inspector for the page you are already looking at. It reads the current public page's hostname, then loads three independent panels:

1. **DNS** — A / AAAA records and the geolocation of the first address of each type.
2. **WHOIS** — registrar, domain dates, nameservers, status and DNSSEC.
3. **SSL / TLS** — certificate, protocol and connection details.

The panels load independently. A failure in one panel does not block the others.

## Features

- **One-click overlay** — a 460 px fixed iframe on the right side of the page, per tab, without reflowing the host page.
- **DNS** — A / AAAA records with TTL; the first record of each group shows IP geolocation; copy any IP with one click.
- **WHOIS** — registrar, creation / expiry dates, domain age, nameservers, DNSSEC and human-readable domain statuses.
- **SSL / TLS** — certificate subject and issuer, validity, SANs, public key, TLS version, cipher, ALPN, HTTP/2, forward secrecy and connected IP. For HTTP pages, TCPLab checks port 443 and says so.
- **Quick grade** — S / A / B / C / D / F with a 0–100 score based on certificate, HTTPS/TLS, HTTP/2, IPv6, DNSSEC and domain information. An invalid certificate caps the grade at C.
- **ICP badge** — shown only in the Chinese UI and only for domain pages. ICP filing does not affect the score.
- **Deep check** — jump to the TCPLab domain-check page with the current domain pre-filled. Domain pages only.
- **Refresh** — refresh all panels or a single panel. Manual refresh bypasses the local cache.
- **Resilient caching** — when a request fails or is rate-limited, the last cached result stays visible and the UI shows the retry time.
- **Bilingual UI** — English and Simplified Chinese. The default follows the browser language.

## Usage

1. Open a public `http://` or `https://` page.
2. Click the TCPLab toolbar icon.
3. Read **DNS → WHOIS → SSL / TLS** in the overlay.
4. Click the icon again, or click **×**, to close the overlay.

The overlay belongs to the current tab. It disappears when the page reloads or navigates; click the icon again to reopen it.

## Supported pages

TCPLab only inspects public web pages. Browser-internal pages, extension pages, local files, blank tabs and private/local addresses are rejected. TCPLab shows a notice inside the overlay, or opens a small popup window when the page cannot be injected at all (for example `chrome://` pages). Examples of rejected pages include:

- `chrome://`, `edge://`, `about:`, `file:`, `view-source:`, `data:`, `blob:`, and other non-web schemes
- `localhost`, `*.local`, `*.internal`, and single-label hostnames
- Private, loopback, link-local, CGNAT, multicast, reserved, and IPv6 ULA addresses

These checks run locally in the extension. Private addresses are never sent to any API.

## Privacy and permissions

TCPLab requests only the permissions it needs:

| Permission | Why |
| --- | --- |
| `activeTab`, `scripting` | Inject or remove the overlay after you click the icon |
| `storage` | Cache API responses and remember the language preference |
| `https://tcp.lc/*`, `https://whois.tcp.lc/*` | Call the TCPLab APIs |

It does **not** request `tabs`, `<all_urls>`, or any side-panel permission.

Only the current **hostname** and the **IP addresses returned by DNS** are sent to the API. TCPLab never sends the full URL, query string, page content, cookies, or browsing history.

## Tech stack

- [WXT](https://wxt.dev) + Manifest V3
- Vue 3 + TypeScript
- Nuxt UI 4 + Tailwind CSS 4
- [`ipaddr.js`](https://github.com/whitequark/ipaddr.js) for IP classification
- Vitest for unit tests

## Getting started

### Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- pnpm 9+ (`packageManager` pins `pnpm@9.12.2`)

> Use **pnpm** only. `npm` and `npx` are not supported.

### Install and run

```bash
pnpm install
pnpm dev
```

WXT starts a development browser with the extension loaded. For Firefox:

```bash
pnpm dev:firefox
```

### Build and package

```bash
pnpm build            # Chrome, output in .output/chrome-mv3
pnpm build:firefox    # Firefox, output in .output/firefox-mv3
pnpm zip              # Chrome zip
pnpm zip:firefox      # Firefox zip
```

To load a production build manually, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `.output/chrome-mv3`.

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start WXT with Chrome |
| `pnpm dev:firefox` | Start WXT with Firefox |
| `pnpm build` | Production build for Chrome |
| `pnpm build:firefox` | Production build for Firefox |
| `pnpm zip` | Package the Chrome build |
| `pnpm zip:firefox` | Package the Firefox build |
| `pnpm typecheck` | Run `vue-tsc` type checking |
| `pnpm test` | Run Vitest unit tests |

## Project structure

```text
entrypoints/
  background.ts        # action click → inject/remove the overlay
  overlay/             # 460 px overlay page (DNS / WHOIS / TLS)
  options/             # language settings
components/            # DNS, WHOIS and TLS panels
composables/           # cached resource loader, IP geolocation
lib/
  api/                 # TCPLab / WHOIS / ICP API clients
  i18n/                # English and Chinese messages
  site/                # URL filtering and private-address detection
  audit.ts             # quick S–F grading
  cache.ts             # local cache and TTLs
assets/css/main.css    # Tailwind + Nuxt UI theme
public/icon/           # extension icons
wxt.config.ts          # WXT / manifest configuration
```

## Data sources and caching

| Data | Endpoint | Local cache |
| --- | --- | --- |
| DNS | `GET https://tcp.lc/api/v2/dns/domain?name={hostname}` | 60 minutes |
| WHOIS | `GET https://whois.tcp.lc/v1/whois/{hostname}` | 24 hours |
| TLS | `POST https://tcp.lc/api/v2/tls/check` | 12 hours |
| IP geolocation | `GET https://tcp.lc/api/v2/ip/{ip}?lang={lang}` | 7 days |
| ICP (Chinese UI only) | `GET https://tcp.lc/api/v2/icp/query?domain={hostname}` | 24 hours |

Notes:

- `/api/v2/*` always returns HTTP `200`; the business status is in `body.code`, and `body.msg` is an i18n key. The WHOIS endpoint uses real HTTP status codes.
- Rate limits: IP geolocation is limited to 60 requests/minute and 1,000/day per IP; WHOIS to 10 requests/minute; ICP to 20 requests/day per IP.
- Manual refresh bypasses the local cache. On failure or rate limiting, TCPLab keeps the previous cached data, reads `retry-after`, and does not retry automatically.
- WHOIS receives the current hostname and the backend normalizes it to the registrable domain.

## Internationalization

- The UI follows the browser language by default: `zh*` → Simplified Chinese, everything else → English.
- The options page lets you choose **Auto**, **中文**, or **English**. The choice is stored in `storage.local` as `locale`.
- **Auto** re-checks the browser language every time.
- ICP lookup and the ICP badge are only available in the Chinese UI.

## Development notes

- The overlay is injected only on demand through `scripting.executeScript`; there is no persistent content script.
- Each tab has its own overlay. New tabs do not open it automatically.
- The overlay is a page-level fixed `iframe` on the right side. It does not change the host page's width.
- `pnpm test` covers URL classification, caching, grading, formatting and API helpers.
- If Nuxt UI's generated type declarations are missing, run `pnpm build` once before `pnpm typecheck`.

## Limitations

- The grade is a lightweight heuristic based on the data already loaded. It is not a security audit or a replacement for a full scan.
- An invalid certificate caps the grade at C. ICP filing status does not affect the score.
- Firefox support is implemented for MV3 but is currently self-tested.
- Dark mode is out of scope for the MVP.

## License

[AGPL-3.0](LICENSE).

---

<p align="center">
  <a href="https://tcp.lc">Website</a> ·
  <a href="https://github.com/helloxz/tcplab-extension">GitHub</a> ·
  <a href="https://github.com/helloxz/tcplab-extension/issues">Issues</a> ·
  <a href="./README.zh-CN.md">简体中文</a>
</p>

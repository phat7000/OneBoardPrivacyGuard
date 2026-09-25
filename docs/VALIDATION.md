# Release validation — v1.0.0

Validation date: 2026-09-25  
Target: Windows x64

## Automated checks

| Check | Result |
| --- | --- |
| Unit and integration tests | PASS — 3 files, 10 tests |
| TypeScript and Vite production build | PASS |
| Rust `cargo check` (stable GNU target) | PASS |
| Tauri release and NSIS build | PASS |
| npm security audit | PASS — 0 vulnerabilities |
| RustSec `cargo audit` | PASS — 0 vulnerabilities; 7 allowed maintenance/target-inapplicable warnings documented in `DEPENDENCY_AUDIT.md` |
| Production dependency license policy | PASS — 81 records checked |
| Repository secret scan | PASS — no credentials or private keys; the sole match is deliberately fake detector-test input |
| Release SHA-256 verification | PASS |

The Vite build emits only its advisory bundle-size warning. The MinGW resource linker emits a non-fatal multiple-manifest merge warning; the resulting executable was separately checked for the expected icon, title, product name, publisher, and version.

## Functional checks

- Explicit model-download consent shown before network access.
- Pinned GLiNER PII Small model downloaded through Tauri's host-scoped HTTP transport, hash-verified, and cached locally in the packaged WebView2 application.
- Real model detected person, email, phone, IP address, and custom/company data in synthetic input.
- Typed placeholders were protected and restored in the same in-memory session.
- A fresh browser session analyzed synthetic PII successfully after the local Vite server was stopped, demonstrating warm-cache offline inference.
- Local Tesseract OCR read synthetic English text and detected/redacted email and phone regions without an upload.
- DOCX and XLSX protection, metadata scrubbing, output readability, fail-closed behavior, ignore list, custom terms, duplicate values, secret detection, and session clearing are covered by automated tests.
- Production executable launched directly and remained responsive with the expected title. Its packaged WebView2 UI completed consent, model initialization, synthetic detection, protection, restore, and About/license checks.
- Portable ZIP was extracted into a fresh directory; its executable hash matched the standalone build and it launched successfully.
- NSIS installer completed silently, created the expected per-user installation and Start Menu shortcut, launched successfully, and uninstalled cleanly.
- Development-console review showed no synthetic PII logging.

## Release artifacts

Artifacts are assembled under ignored local path `release/v1.0.0/`; they are release uploads, not source-controlled binaries. Exact hashes are recorded in that directory's `SHA256SUMS.txt`.

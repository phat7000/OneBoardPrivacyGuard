# Dependency and model audit — v1.0.0

Audit date: 2026-09-25

## Security

The locked npm tree was checked with `npm audit`. Findings in older build/test and tokenizer packages were remediated by moving to Vite 6.4.3, Vitest 4.1.11, and `@huggingface/transformers` 4.3.0. The final locked tree reports zero known npm audit vulnerabilities.

Rust dependencies are locked in `src-tauri/Cargo.lock`. `cargo audit 0.22.2` scanned all 430 locked crate dependencies against 1,269 RustSec advisories and reported no vulnerabilities. It reported seven allowed warnings: five unmaintained `unic-*` crates inherited through Tauri's `urlpattern` dependency, one unmaintained `proc-macro-error` crate that is not selected for the Windows GNU release target, and one `glib` soundness advisory that is also not selected for that Windows target. The unmaintained `unic-*` warnings do not identify a vulnerability; they remain tracked for a future Tauri dependency refresh.

## Licenses

Production npm license metadata is checked by `npm run audit:licenses`. The release is blocked for GPL-only, AGPL, SSPL, non-commercial, research-only, or unknown licenses. Dual-licensed dependencies are used under their permissive license option (for example, JSZip under MIT).

No DocCloak web application source, PyMuPDF, Rizzo sidecar/backend/model, Python, .NET application dependency, Java, Docker, telemetry SDK, or analytics SDK is included.

## Models

ML model weights are not distributed in the GitHub release artifacts. DocCloak.Core 0.12.1 downloads only immutable, SHA-256-pinned model and tokenizer files after explicit consent. The model cards for GLiNER PII Small, GLiNER PII Base, and BardS.ai EU PII declare Apache-2.0. The default GLiNER PII Small model remains a first-use download.

English and Vietnamese `tessdata_fast` assets are redistributed for OCR. Upstream commit `87416418657359cb625c412a48b6e1d6d41c29bd` declares all repository data under Apache-2.0.

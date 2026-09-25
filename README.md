# OneBoard Privacy Guard

**Protect sensitive information before sharing text and documents.**

OneBoard Privacy Guard is a local-first Windows privacy utility that detects and replaces sensitive information before content is shared with AI assistants or other external systems.

## Capabilities

- Local PII detection with review before replacement
- Stable typed placeholders and reversible restore
- Secret and API-key detection
- DOCX and XLSX protection with metadata scrubbing
- Local image OCR and rendered pixel redaction for PNG, JPEG, WebP, BMP, GIF, and TIFF input
- Local custom terms and ignore list
- English and Vietnamese interface
- Fail-closed export when Office content cannot be safely protected

PDF protection is intentionally not included in version 1.0.0. For PDF OCR workflows, use OneBoard PDF OCR Batch.

## Privacy model

Sensitive-content detection and protection run locally. A network connection may be required once to download the selected local ML model. DocCloak.Core pins the model and tokenizer assets to immutable revisions, verifies their SHA-256 hashes, and caches them locally. Normal protection can then work offline.

No OneBoard cloud service receives the user's documents, text, PII, OCR output, file names, placeholder maps, or restore dictionaries. The app has no telemetry, analytics, account, API key, cloud LLM, or local server. Sensitive session state is memory-first and is not automatically persisted. Only preferences and downloaded model assets are cached.

The Windows portable build requires the Microsoft Edge WebView2 Runtime. The installer embeds Microsoft's supported WebView2 bootstrapper for systems where it is missing.

## First use

1. Paste text or choose a supported file.
2. Choose **Analyze locally**.
3. Review the model-download notice and select **Download Local Model**. The default is GLiNER PII Small (approximately 83 MB).
4. Review and deselect false positives.
5. Protect or export the selected content.
6. Use **Restore** with the current in-memory session map when needed.

No detector is perfect. Always review the result before sharing it.

## Development

Requirements: Node.js 20+, Rust stable with the MSVC target, Visual Studio C++ Build Tools, and WebView2.

```powershell
npm ci
npm test
npm run build
npm run tauri build
```

Runtime ONNX and Tesseract JavaScript/WASM files are copied from locked npm packages into the packaged application by `npm run assets`. English and Vietnamese Tesseract trained data are redistributed locally under Apache-2.0.

## Source and licensing

The OneBoard application shell is MIT licensed. The detection engine is [DocCloak.Core](https://github.com/WLojek/DocCloak.Core) 0.12.1, licensed under Apache-2.0. No DocCloak AGPL web application source, PyMuPDF, Rizzo backend/model, or PDF-redaction implementation is included.

See [UPSTREAM.md](UPSTREAM.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

- Website: https://oneboard.io.vn
- Repository: https://github.com/phat7000/OneBoardPrivacyGuard

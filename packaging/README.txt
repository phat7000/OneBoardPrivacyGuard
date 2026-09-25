OneBoard Privacy Guard 1.0.0 — Windows x64 Portable
===================================================

Run OneBoardPrivacyGuard.exe. No installation, account, OneBoard cloud
service, Python, .NET application runtime, Java, Docker, or local server is
required.

System requirement: Windows 10 or Windows 11 with Microsoft Edge WebView2
Runtime. If WebView2 is not installed, use the OneBoard Privacy Guard Setup
installer, which includes Microsoft's supported WebView2 bootstrapper.

The default GLiNER PII Small model is not included. On first analysis, the app
asks for consent before downloading approximately 83 MB of hash-verified model
and tokenizer assets. They are cached locally. Documents, PII, OCR results,
file names, and placeholder mappings are not sent to OneBoard.

Supported protection workflows:
  - text review, typed placeholders, and current-session restore
  - DOCX and XLSX protection with fail-closed warnings
  - local OCR and rendered pixel redaction for supported image formats

PDF protection is not included in version 1.0.0.

Website: https://oneboard.io.vn
Source: https://github.com/phat7000/OneBoardPrivacyGuard

See LICENSE and THIRD_PARTY_NOTICES.md.

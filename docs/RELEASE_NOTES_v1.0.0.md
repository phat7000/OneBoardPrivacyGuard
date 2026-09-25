# OneBoard Privacy Guard v1.0.0

First public release of OneBoard Privacy Guard.

OneBoard Privacy Guard is a local-first Windows utility designed to protect sensitive information before text or documents are shared with AI assistants or other external systems.

## Highlights

- Local PII detection
- Reversible typed placeholders
- Restore protected AI responses locally
- Secret and credential detection
- DOCX protection
- XLSX protection
- Local image OCR and pixel redaction
- Custom protection terms
- Ignore list
- English and Vietnamese interface
- Local ML model processing
- No OneBoard cloud service required

## Privacy

Sensitive-content processing runs locally on the device. The selected local detection model may need to be downloaded once. Model files are hash-verified and cached locally, and normal protection processing can then work offline. User documents and PII are not uploaded to OneBoard.

## Downloads

- Portable ZIP: `OneBoardPrivacyGuard-1.0.0-win-x64.zip`
- Windows installer: `OneBoardPrivacyGuard-Setup-1.0.0-win-x64.exe`
- Standalone executable: `OneBoardPrivacyGuard-1.0.0-win-x64.exe`
- Checksums: `SHA256SUMS.txt`

## Open source

OneBoard Privacy Guard uses the permissively licensed [DocCloak.Core](https://github.com/WLojek/DocCloak.Core) engine. See `THIRD_PARTY_NOTICES.md` for third-party software and licenses.
